import { Client, Wallet, Payment, TrustSet, EscrowCreate, EscrowFinish, EscrowCancel } from 'xrpl';
import { xrplClient } from './xrpl-client';
import { MOCK_TOKENS } from './xrpl-amm';

export interface BatchPaymentItem {
  to: string;
  amount: string;
  currency: string;
  issuer?: string;
  memo?: string;
}

export interface EscrowPayment {
  destination: string;
  amount: string;
  currency: string;
  issuer?: string;
  condition?: string; // 해시된 조건
  fulfillment?: string; // 조건 충족 증명
  finishAfter?: number; // 시간 기반 조건 (Ripple timestamp)
  cancelAfter?: number; // 취소 가능 시간 (Ripple timestamp)
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
}

export interface EscrowResult {
  success: boolean;
  escrowSequence?: number;
  transactionHash?: string;
  error?: string;
}

export class XRPLBatchManager {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    this.client = xrplClient.getClient();
  }

  async setWallet(privateKey: string): Promise<boolean> {
    try {
      console.log('🔑 지갑 설정 시도:', {
        privateKeyPrefix: privateKey?.substring(0, 10) + '...',
        privateKeyLength: privateKey?.length
      });

      // privateKey로부터 지갑 생성 (useWallet.ts와 동일한 방식)
      this.wallet = Wallet.fromSecret(privateKey);

      console.log('✅ 지갑 설정 성공:', {
        address: this.wallet.address,
        publicKey: this.wallet.publicKey
      });

      return true;
    } catch (error) {
      console.error('❌ 지갑 설정 실패:', error);
      console.error('privateKey 정보:', {
        prefix: privateKey?.substring(0, 10) + '...',
        length: privateKey?.length,
        type: typeof privateKey
      });
      return false;
    }
  }

  // Batch Payment 구현 - 여러 결제를 순차적으로 처리
  async executeBatchPayments(payments: BatchPaymentItem[]): Promise<BatchResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    const results: BatchResult['results'] = [];
    let successCount = 0;
    let failCount = 0;

    console.log(`📦 Batch Payment 시작: ${payments.length}개 결제 처리`);

    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];

      try {
        console.log(`💸 [${i + 1}/${payments.length}] ${payment.amount} ${payment.currency} → ${payment.to}`);

        // Payment 트랜잭션 생성
        const paymentTx: Payment = {
          TransactionType: 'Payment',
          Account: this.wallet.address,
          Destination: payment.to,
          Amount: payment.currency.toUpperCase() === 'XRP'
            ? (parseFloat(payment.amount) * 1000000).toString() // XRP to drops
            : {
                currency: payment.currency,
                issuer: payment.issuer || this.getDefaultIssuer(payment.currency),
                value: payment.amount
              }
        };

        // 메모 추가 (선택사항)
        if (payment.memo) {
          paymentTx.Memos = [{
            Memo: {
              MemoData: Buffer.from(`Batch Payment: ${payment.memo}`, 'utf8').toString('hex').toUpperCase()
            }
          }];
        }

        // 트랜잭션 실행
        const prepared = await this.client!.autofill(paymentTx);
        const signed = this.wallet.sign(prepared);
        const result = await this.client!.submitAndWait(signed.tx_blob);

        if (result.result.validated) {
          results.push({
            index: i,
            success: true,
            transactionHash: result.result.hash
          });
          successCount++;
          console.log(`✅ [${i + 1}] 성공: ${result.result.hash}`);
        } else {
          results.push({
            index: i,
            success: false,
            error: '트랜잭션 검증 실패'
          });
          failCount++;
          console.log(`❌ [${i + 1}] 실패: 트랜잭션 검증 실패`);
        }

        // 연속 전송으로 인한 네트워크 부하 방지
        if (i < payments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
        failCount++;
        console.log(`❌ [${i + 1}] 실패:`, error);
      }
    }

    console.log(`📊 Batch Payment 완료: 성공 ${successCount}개, 실패 ${failCount}개`);

    return {
      success: successCount > 0,
      results,
      totalSuccessful: successCount,
      totalFailed: failCount
    };
  }

  // Token Escrow 생성 - 조건부 지불
  async createEscrow(escrowPayment: EscrowPayment): Promise<EscrowResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      console.log(`🔒 Escrow 생성: ${escrowPayment.amount} ${escrowPayment.currency} → ${escrowPayment.destination}`);

      // EscrowCreate 트랜잭션 생성
      const escrowTx: EscrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: this.wallet.address,
        Destination: escrowPayment.destination,
        Amount: escrowPayment.currency.toUpperCase() === 'XRP'
          ? (parseFloat(escrowPayment.amount) * 1000000).toString() // XRP to drops
          : {
              currency: escrowPayment.currency,
              issuer: escrowPayment.issuer || this.getDefaultIssuer(escrowPayment.currency),
              value: escrowPayment.amount
            }
      };

      // 조건 설정
      if (escrowPayment.condition) {
        escrowTx.Condition = escrowPayment.condition;
      }

      // 시간 기반 조건 설정
      if (escrowPayment.finishAfter) {
        escrowTx.FinishAfter = escrowPayment.finishAfter;
      }

      if (escrowPayment.cancelAfter) {
        escrowTx.CancelAfter = escrowPayment.cancelAfter;
      }

      // 메모 추가
      if (escrowPayment.memo) {
        escrowTx.Memos = [{
          Memo: {
            MemoData: Buffer.from(`Escrow: ${escrowPayment.memo}`, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      // 트랜잭션 실행
      const prepared = await this.client.autofill(escrowTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        // Escrow sequence 추출 (완료 시 필요)
        const escrowSequence = prepared.Sequence;

        console.log(`✅ Escrow 생성 성공: ${result.result.hash}, Sequence: ${escrowSequence}`);

        return {
          success: true,
          escrowSequence,
          transactionHash: result.result.hash
        };
      } else {
        throw new Error('Escrow 트랜잭션 검증 실패');
      }

    } catch (error) {
      console.error('Escrow 생성 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // Escrow 완료 (조건 충족 시)
  async finishEscrow(
    owner: string,
    escrowSequence: number,
    fulfillment?: string
  ): Promise<EscrowResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      console.log(`🔓 Escrow 완료: Sequence ${escrowSequence}`);

      const finishTx: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: this.wallet.address,
        Owner: owner,
        OfferSequence: escrowSequence
      };

      if (fulfillment) {
        finishTx.Fulfillment = fulfillment;
      }

      const prepared = await this.client.autofill(finishTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log(`✅ Escrow 완료 성공: ${result.result.hash}`);
        return {
          success: true,
          transactionHash: result.result.hash
        };
      } else {
        throw new Error('Escrow 완료 트랜잭션 검증 실패');
      }

    } catch (error) {
      console.error('Escrow 완료 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // Escrow 취소 (시간 초과 시)
  async cancelEscrow(owner: string, escrowSequence: number): Promise<EscrowResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      console.log(`🚫 Escrow 취소: Sequence ${escrowSequence}`);

      const cancelTx: EscrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: this.wallet.address,
        Owner: owner,
        OfferSequence: escrowSequence
      };

      const prepared = await this.client.autofill(cancelTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log(`✅ Escrow 취소 성공: ${result.result.hash}`);
        return {
          success: true,
          transactionHash: result.result.hash
        };
      } else {
        throw new Error('Escrow 취소 트랜잭션 검증 실패');
      }

    } catch (error) {
      console.error('Escrow 취소 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 시간 기반 조건을 위한 유틸리티 함수들
  getRippleTimestamp(date: Date): number {
    // Ripple epoch는 2000년 1월 1일 00:00 GMT
    const rippleEpoch = new Date('2000-01-01T00:00:00.000Z').getTime();
    return Math.floor((date.getTime() - rippleEpoch) / 1000);
  }

  getDateFromRippleTimestamp(timestamp: number): Date {
    const rippleEpoch = new Date('2000-01-01T00:00:00.000Z').getTime();
    return new Date(rippleEpoch + (timestamp * 1000));
  }

  // 기본 토큰 발행자 주소 반환
  private getDefaultIssuer(currency: string): string {
    const token = MOCK_TOKENS.find(t =>
      t.currency === currency.toUpperCase() ||
      t.symbol === currency.toUpperCase()
    );

    if (!token) {
      throw new Error(`지원하지 않는 통화: ${currency}`);
    }

    return token.issuer;
  }
}

// Singleton instance
export const xrplBatch = new XRPLBatchManager();