import { Client, Wallet, Payment } from 'xrpl';
import { xrplClient } from './xrpl-client';

export interface TransferRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
  currency: string;
  issuer?: string;
  memo?: string;
}

export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  balance?: string;
}

export class XRPLTransferManagerV2 {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    this.client = xrplClient.getClient();
  }

  async setWallet(seedOrPrivateKey: string): Promise<boolean> {
    try {
      console.log('🔑 지갑 설정 시도:', {
        keyPrefix: seedOrPrivateKey?.substring(0, 10) + '...',
        keyLength: seedOrPrivateKey?.length
      });

      // 여러 방법으로 시도
      const methods = [
        { name: 'fromSeed', fn: () => Wallet.fromSeed(seedOrPrivateKey) },
        { name: 'fromSecret', fn: () => Wallet.fromSecret(seedOrPrivateKey) }
      ];

      let lastError: Error | null = null;

      for (const method of methods) {
        try {
          this.wallet = method.fn();
          console.log(`✅ ${method.name}으로 지갑 설정 성공`);
          
          console.log('✅ 지갑 설정 완료:', {
            address: this.wallet.address,
            publicKey: this.wallet.publicKey
          });

          return true;
        } catch (error) {
          lastError = error as Error;
          console.log(`❌ ${method.name} 실패:`, error.message);
          continue;
        }
      }

      // 모든 방법이 실패한 경우
      throw new Error(`모든 지갑 생성 방법 실패. 마지막 오류: ${lastError?.message}`);
      
    } catch (error) {
      console.error('❌ 지갑 설정 실패:', error);
      return false;
    }
  }


  // 표준 예제 기반 일반 전송 (XRP)
  async sendXRP(request: TransferRequest): Promise<TransferResult> {
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
      console.log(`🚀 XRPL XRP 전송 시작: ${request.amount} XRP from ${request.fromAddress} to ${request.toAddress}`);

      // 표준 예제 방식의 Payment 트랜잭션 생성
      const tx: Payment = {
        TransactionType: "Payment",
        Account: this.wallet.address,
        Destination: request.toAddress,
        Amount: (parseFloat(request.amount) * 1000000).toString() // XRP to drops
      };

      // 메모 추가 (선택사항)
      if (request.memo) {
        tx.Memos = [{
          Memo: {
            MemoData: Buffer.from(request.memo, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      // 표준 예제 방식으로 트랜잭션 실행
      const prepared = await this.client.autofill(tx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📦 XRPL XRP 전송 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      if (result.result.validated) {
        // 잔액 조회
        const balance = await this.client.getXrpBalance(this.wallet.address);
        
        return {
          success: true,
          transactionHash: result.result.hash,
          balance
        };
      } else {
        return {
          success: false,
          error: `트랜잭션 실패: ${result.result.engine_result}`
        };
      }

    } catch (error) {
      console.error('❌ XRPL XRP 전송 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 표준 예제 기반 IOU 토큰 전송
  async sendIOU(request: TransferRequest): Promise<TransferResult> {
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
      console.log(`🚀 XRPL IOU 전송 시작: ${request.amount} ${request.currency} from ${request.fromAddress} to ${request.toAddress}`);

      // 표준 예제 방식의 Payment 트랜잭션 생성 (IOU)
      const tx: Payment = {
        TransactionType: "Payment",
        Account: this.wallet.address,
        Destination: request.toAddress,
        Amount: {
          currency: request.currency,
          issuer: request.issuer || this.getDefaultIssuer(request.currency),
          value: request.amount
        }
      };

      // 메모 추가 (선택사항)
      if (request.memo) {
        tx.Memos = [{
          Memo: {
            MemoData: Buffer.from(request.memo, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      // 표준 예제 방식으로 트랜잭션 실행
      const prepared = await this.client.autofill(tx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📦 XRPL IOU 전송 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      if (result.result.validated) {
        return {
          success: true,
          transactionHash: result.result.hash
        };
      } else {
        return {
          success: false,
          error: `트랜잭션 실패: ${result.result.engine_result}`
        };
      }

    } catch (error) {
      console.error('❌ XRPL IOU 전송 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 통합 전송 함수 (XRP/IOU 자동 판별)
  async sendTransfer(request: TransferRequest): Promise<TransferResult> {
    if (request.currency.toUpperCase() === 'XRP') {
      return await this.sendXRP(request);
    } else {
      return await this.sendIOU(request);
    }
  }

  // 잔액 조회
  async getBalance(address: string, currency: string = 'XRP'): Promise<string> {
    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      if (currency.toUpperCase() === 'XRP') {
        return await this.client!.getXrpBalance(address);
      } else {
        // IOU 토큰 잔액 조회
        const accountLines = await this.client!.request({
          command: "account_lines",
          account: address
        });

        const tokenLine = accountLines.result.lines.find((line: any) => 
          line.currency === currency.toUpperCase()
        );

        return tokenLine ? tokenLine.balance : '0';
      }
    } catch (error) {
      console.error('❌ 잔액 조회 실패:', error);
      return '0';
    }
  }

  // 계정 정보 조회
  async getAccountInfo(address: string): Promise<any> {
    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      const accountInfo = await this.client!.request({
        command: "account_info",
        account: address
      });

      return accountInfo.result.account_data;
    } catch (error) {
      console.error('❌ 계정 정보 조회 실패:', error);
      return null;
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
export const xrplTransferV2 = new XRPLTransferManagerV2();