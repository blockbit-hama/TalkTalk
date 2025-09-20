import { Client, Wallet, Payment } from 'xrpl';
import { xrplClient } from './xrpl-client';

export interface BatchPaymentItem {
  to: string;
  amount: string;
  currency: string;
  issuer?: string;
  memo?: string;
}

export interface BatchResult {
  success: boolean;
  results: Array<{
    index: number;
    success: boolean;
    transactionHash?: string;
    error?: string;
  }>;
  totalSuccessful: number;
  totalFailed: number;
  batchTransactionHash?: string;
}

export class XRPLBatchManagerV2 {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    this.client = xrplClient.getClient();
  }

  async setWallet(seedOrPrivateKey: string): Promise<boolean> {
    try {
      console.log('🔑 Batch 지갑 설정 시도:', {
        keyPrefix: seedOrPrivateKey?.substring(0, 10) + '...',
        keyLength: seedOrPrivateKey?.length
      });

      // 시드인지 개인키인지 판별하여 적절한 방법으로 지갑 생성
      if (seedOrPrivateKey.startsWith('s') && seedOrPrivateKey.length === 29) {
        // 시드 구문인 경우
        this.wallet = Wallet.fromSeed(seedOrPrivateKey);
        console.log('✅ 시드로 Batch 지갑 설정 성공');
      } else if (seedOrPrivateKey.startsWith('ED') && seedOrPrivateKey.length === 66) {
        // 개인키인 경우
        this.wallet = Wallet.fromSecret(seedOrPrivateKey);
        console.log('✅ 개인키로 Batch 지갑 설정 성공');
      } else {
        // 시도해보기 (시드 우선)
        try {
          this.wallet = Wallet.fromSeed(seedOrPrivateKey);
          console.log('✅ 시드로 Batch 지갑 설정 성공 (자동 판별)');
        } catch {
          this.wallet = Wallet.fromSecret(seedOrPrivateKey);
          console.log('✅ 개인키로 Batch 지갑 설정 성공 (자동 판별)');
        }
      }

      console.log('✅ Batch 지갑 설정 완료:', {
        address: this.wallet.address,
        publicKey: this.wallet.publicKey
      });

      return true;
    } catch (error) {
      console.error('❌ Batch 지갑 설정 실패:', error);
      return false;
    }
  }

  // 표준 예제 기반 Batch Payment 구현 - XRPL 네이티브 Batch 트랜잭션 사용
  async executeBatchPayments(payments: BatchPaymentItem[], mode: 'Independent' | 'AllOrNothing' | 'UntilFailure' = 'Independent'): Promise<BatchResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    // 클라이언트 연결 상태 확인 및 연결
    if (!this.client || !this.client.isConnected()) {
      console.log('🔌 XRPL 클라이언트 연결 시도...');
      const connected = await xrplClient.connect();
      if (!connected) {
        throw new Error('XRPL 네트워크 연결에 실패했습니다.');
      }
      this.client = xrplClient.getClient();
      console.log('✅ XRPL 클라이언트 연결 성공');
    }

    try {
      // 계정 정보 조회 (시퀀스 번호 필요)
      const accountInfo = await this.client.request({ 
        command: "account_info", 
        account: this.wallet.address 
      });
      const seq = accountInfo.result.account_data.Sequence;

      console.log(`📦 XRPL 네이티브 Batch Payment 시작: ${payments.length}개 결제 처리 (${mode} 모드)`);

      // Batch 모드에 따른 플래그 설정
      const batchFlags = {
        'Independent': 0x00080000,    // 모든 내부 트랜잭션을 독립적으로 실행
        'AllOrNothing': 0x00010000,   // 모든 내부 트랜잭션이 성공해야만 커밋
        'UntilFailure': 0x00040000    // 순차 실행하다가 첫 실패 시 중단
      };

      // RawTransactions 배열 생성
      const rawTransactions = payments.map((payment, index) => {
        const amount = payment.currency.toUpperCase() === 'XRP'
          ? (parseFloat(payment.amount) * 1000000).toString() // XRP to drops
          : {
              currency: payment.currency,
              issuer: payment.issuer || this.getDefaultIssuer(payment.currency),
              value: payment.amount
            };

        return {
          RawTransaction: {
            TransactionType: "Payment",
            Flags: 0x40000000, // tfInnerBatchTxn (내부 트랜잭션 필수 플래그)
            Account: this.wallet!.address,
            Destination: payment.to,
            Amount: amount,
            Sequence: seq + index + 1,
            Fee: "0",
            SigningPubKey: ""
          }
        };
      });

      // Batch 트랜잭션 생성
      const batchTx: any = {
        TransactionType: "Batch",
        Account: this.wallet.address,
        Flags: batchFlags[mode],
        RawTransactions: rawTransactions,
        Sequence: seq
      };

      // 트랜잭션 실행
      const prepared = await this.client.autofill(batchTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📦 XRPL Batch 트랜잭션 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      // 결과 파싱
      if (result.result.validated) {
        // 성공한 경우 - 모든 내부 트랜잭션이 성공
        const results = payments.map((_, index) => ({
          index,
          success: true,
          transactionHash: result.result.hash
        }));

        return {
          success: true,
          results,
          totalSuccessful: payments.length,
          totalFailed: 0,
          batchTransactionHash: result.result.hash
        };
      } else {
        // 실패한 경우
        return {
          success: false,
          results: payments.map((_, index) => ({
            index,
            success: false,
            error: `Batch 트랜잭션 실패: ${result.result.engine_result}`
          })),
          totalSuccessful: 0,
          totalFailed: payments.length,
          batchTransactionHash: result.result.hash
        };
      }

    } catch (error) {
      console.error('❌ XRPL Batch Payment 실패:', error);
      
      return {
        success: false,
        results: payments.map((_, index) => ({
          index,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })),
        totalSuccessful: 0,
        totalFailed: payments.length
      };
    }
  }

  // 잔액 사전 검증
  async validateBalances(payments: BatchPaymentItem[]): Promise<{ valid: boolean; error?: string }> {
    if (!this.wallet || !this.client) {
      return { valid: false, error: '지갑 또는 클라이언트가 설정되지 않았습니다.' };
    }

    try {
      // XRP 잔액 조회
      const balance = await this.client.getXrpBalance(this.wallet.address);
      const balanceDrops = parseFloat(balance) * 1000000; // XRP to drops

      // 총 필요 금액 계산 (XRP만)
      const xrpPayments = payments.filter(p => p.currency.toUpperCase() === 'XRP');
      const totalXrpNeeded = xrpPayments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) * 1000000);
      }, 0);

      // 수수료 예상 (Batch 트랜잭션 1개 + 내부 트랜잭션들)
      const estimatedFee = 12000 * (payments.length + 1); // drops

      const totalNeeded = totalXrpNeeded + estimatedFee;

      if (balanceDrops < totalNeeded) {
        return {
          valid: false,
          error: `잔액 부족: 필요 ${totalNeeded / 1000000} XRP, 보유 ${balance} XRP`
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : '잔액 검증 실패'
      };
    }
  }

  // 기본 토큰 발행자 주소 반환
  private getDefaultIssuer(currency: string): string {
    // Devnet 주요 토큰 발행자들
    const devnetIssuers: { [key: string]: string } = {
      'USD': 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX',
      'CNY': 'rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x',
      'EUR': 'rBXYWgAg6z5NxCshzGkNuX3YjHFyN26cgj',
      'TST': 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd'
    };

    const issuer = devnetIssuers[currency.toUpperCase()];
    if (!issuer) {
      throw new Error(`지원하지 않는 통화: ${currency}`);
    }

    return issuer;
  }

  // 연결 해제
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}

// Singleton instance
export const xrplBatchV2 = new XRPLBatchManagerV2();