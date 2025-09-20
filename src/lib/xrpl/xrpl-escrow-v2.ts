import { Client, Wallet, EscrowCreate, EscrowFinish, EscrowCancel } from 'xrpl';
import { xrplClient } from './xrpl-client';

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

export interface EscrowResult {
  success: boolean;
  escrowSequence?: number;
  transactionHash?: string;
  error?: string;
}

export class XRPLEScrowManagerV2 {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    this.client = xrplClient.getClient();
  }

  async setWallet(seedOrPrivateKey: string): Promise<boolean> {
    try {
      console.log('🔑 Escrow 지갑 설정 시도:', {
        keyPrefix: seedOrPrivateKey?.substring(0, 10) + '...',
        keyLength: seedOrPrivateKey?.length
      });

      // 시드인지 개인키인지 판별하여 적절한 방법으로 지갑 생성
      if (seedOrPrivateKey.startsWith('s') && seedOrPrivateKey.length === 29) {
        // 시드 구문인 경우
        this.wallet = Wallet.fromSeed(seedOrPrivateKey);
        console.log('✅ 시드로 Escrow 지갑 설정 성공');
      } else if (seedOrPrivateKey.startsWith('ED') && seedOrPrivateKey.length === 66) {
        // 개인키인 경우
        this.wallet = Wallet.fromSecret(seedOrPrivateKey);
        console.log('✅ 개인키로 Escrow 지갑 설정 성공');
      } else {
        // 시도해보기 (시드 우선)
        try {
          this.wallet = Wallet.fromSeed(seedOrPrivateKey);
          console.log('✅ 시드로 Escrow 지갑 설정 성공 (자동 판별)');
        } catch {
          this.wallet = Wallet.fromSecret(seedOrPrivateKey);
          console.log('✅ 개인키로 Escrow 지갑 설정 성공 (자동 판별)');
        }
      }

      console.log('✅ Escrow 지갑 설정 완료:', {
        address: this.wallet.address,
        publicKey: this.wallet.publicKey
      });

      return true;
    } catch (error) {
      console.error('❌ Escrow 지갑 설정 실패:', error);
      return false;
    }
  }

  // 표준 예제 기반 XRP Escrow 생성
  async createXRPEscrow(escrowPayment: EscrowPayment): Promise<EscrowResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      console.log(`🔒 XRP Escrow 생성: ${escrowPayment.amount} XRP → ${escrowPayment.destination}`);

      // 표준 예제 방식의 EscrowCreate 트랜잭션 생성
      const escrowTx: EscrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: this.wallet.address,
        Destination: escrowPayment.destination,
        Amount: (parseFloat(escrowPayment.amount) * 1000000).toString() // XRP to drops
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

      // 표준 예제 방식으로 트랜잭션 실행
      const prepared = await this.client.autofill(escrowTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📦 XRP Escrow 생성 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      if (result.result.validated) {
        // Escrow sequence 추출 (완료 시 필요)
        const escrowSequence = prepared.Sequence;

        console.log(`✅ XRP Escrow 생성 성공: ${result.result.hash}, Sequence: ${escrowSequence}`);

        return {
          success: true,
          escrowSequence,
          transactionHash: result.result.hash
        };
      } else {
        return {
          success: false,
          error: `Escrow 트랜잭션 실패: ${result.result.engine_result}`
        };
      }

    } catch (error) {
      console.error('❌ XRP Escrow 생성 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 표준 예제 기반 IOU Escrow 생성
  async createIOUEscrow(escrowPayment: EscrowPayment): Promise<EscrowResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      console.log(`🔒 IOU Escrow 생성: ${escrowPayment.amount} ${escrowPayment.currency} → ${escrowPayment.destination}`);

      // 표준 예제 방식의 EscrowCreate 트랜잭션 생성 (IOU)
      const escrowTx: EscrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: this.wallet.address,
        Destination: escrowPayment.destination,
        Amount: {
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

      // 표준 예제 방식으로 트랜잭션 실행
      const prepared = await this.client.autofill(escrowTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📦 IOU Escrow 생성 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      if (result.result.validated) {
        // Escrow sequence 추출 (완료 시 필요)
        const escrowSequence = prepared.Sequence;

        console.log(`✅ IOU Escrow 생성 성공: ${result.result.hash}, Sequence: ${escrowSequence}`);

        return {
          success: true,
          escrowSequence,
          transactionHash: result.result.hash
        };
      } else {
        return {
          success: false,
          error: `Escrow 트랜잭션 실패: ${result.result.engine_result}`
        };
      }

    } catch (error) {
      console.error('❌ IOU Escrow 생성 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 통합 Escrow 생성 함수 (XRP/IOU 자동 판별)
  async createEscrow(escrowPayment: EscrowPayment): Promise<EscrowResult> {
    if (escrowPayment.currency.toUpperCase() === 'XRP') {
      return await this.createXRPEscrow(escrowPayment);
    } else {
      return await this.createIOUEscrow(escrowPayment);
    }
  }

  // 표준 예제 기반 Escrow 완료 (조건 충족 시)
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

      // 표준 예제 방식의 EscrowFinish 트랜잭션 생성
      const finishTx: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: this.wallet.address,
        Owner: owner,
        OfferSequence: escrowSequence
      };

      if (fulfillment) {
        finishTx.Fulfillment = fulfillment;
      }

      // 표준 예제 방식으로 트랜잭션 실행
      const prepared = await this.client.autofill(finishTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📦 Escrow 완료 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      if (result.result.validated) {
        console.log(`✅ Escrow 완료 성공: ${result.result.hash}`);
        return {
          success: true,
          transactionHash: result.result.hash
        };
      } else {
        return {
          success: false,
          error: `Escrow 완료 트랜잭션 실패: ${result.result.engine_result}`
        };
      }

    } catch (error) {
      console.error('❌ Escrow 완료 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 표준 예제 기반 Escrow 취소 (시간 초과 시)
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

      // 표준 예제 방식의 EscrowCancel 트랜잭션 생성
      const cancelTx: EscrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: this.wallet.address,
        Owner: owner,
        OfferSequence: escrowSequence
      };

      // 표준 예제 방식으로 트랜잭션 실행
      const prepared = await this.client.autofill(cancelTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📦 Escrow 취소 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      if (result.result.validated) {
        console.log(`✅ Escrow 취소 성공: ${result.result.hash}`);
        return {
          success: true,
          transactionHash: result.result.hash
        };
      } else {
        return {
          success: false,
          error: `Escrow 취소 트랜잭션 실패: ${result.result.engine_result}`
        };
      }

    } catch (error) {
      console.error('❌ Escrow 취소 실패:', error);
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

  // 현재 시간을 Ripple timestamp로 변환
  getCurrentRippleTimestamp(): number {
    return this.getRippleTimestamp(new Date());
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
export const xrplEscrowV2 = new XRPLEScrowManagerV2();