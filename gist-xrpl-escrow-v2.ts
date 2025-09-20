/**
 * XRPL Escrow (조건부 지급) V2 - XRPL v4.3.0 표준 구현
 *
 * 이 코드는 XRPL의 네이티브 Escrow 기능을 구현합니다.
 * 시간 기반 조건부 지급으로 특정 시간이 되면 자동으로 자금을 수령할 수 있습니다.
 *
 * GitHub Gist: https://gist.github.com/YOUR_GITHUB_USERNAME/xrpl-escrow-v2
 *
 * 주요 기능:
 * 1. XRP Escrow 생성 (시간 기반 조건)
 * 2. IOU 토큰 Escrow 생성 (시간 기반 조건)
 * 3. Escrow 완료 (조건 충족 시)
 * 4. Escrow 취소 (만료 시)
 * 5. Escrow 목록 조회
 *
 * XRPL 공식 문서: https://xrpl.org/escrowcreate.html
 */

import {
  Client,
  Wallet,
  EscrowCreate,
  EscrowFinish,
  EscrowCancel,
  AccountObjectsRequest,
  xrpToDrops,
  convertTimeToRippleTime
} from 'xrpl';

/**
 * Escrow 생성 요청 인터페이스
 */
export interface EscrowPayment {
  from: string;
  to: string;
  amount: string;
  currency?: string;
  issuer?: string;
  condition?: string;  // 암호화 조건 (선택)
  finishAfter?: Date;  // 이 시간 이후 완료 가능
  cancelAfter?: Date;  // 이 시간 이후 취소 가능
}

/**
 * Escrow 트랜잭션 결과
 */
export interface EscrowResult {
  success: boolean;
  transactionHash?: string;
  escrowSequence?: number;
  error?: string;
}

/**
 * 활성 Escrow 정보
 */
export interface ActiveEscrow {
  account: string;
  destination: string;
  amount: string;
  escrowSequence: number;
  condition?: string;
  finishAfter?: string;
  cancelAfter?: string;
  previousTxnID: string;
}

/**
 * XRPL Escrow Manager V2
 * 표준 XRPL v4.3.0 기반 구현
 */
export class XRPLEscrowManagerV2 {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    // Devnet 연결
    this.client = new Client("wss://s.devnet.rippletest.net:51233");
  }

  /**
   * XRPL 네트워크 연결
   */
  async connect(): Promise<boolean> {
    try {
      if (!this.client) {
        this.client = new Client("wss://s.devnet.rippletest.net:51233");
      }

      if (!this.client.isConnected()) {
        await this.client.connect();
        console.log('✅ XRPL Devnet 연결 성공');
      }
      return true;
    } catch (error) {
      console.error('❌ XRPL 연결 실패:', error);
      return false;
    }
  }

  /**
   * 지갑 설정
   */
  async setWallet(seedOrPrivateKey: string): Promise<boolean> {
    try {
      // 시드 또는 개인키로 지갑 생성
      if (seedOrPrivateKey.startsWith('s')) {
        this.wallet = Wallet.fromSeed(seedOrPrivateKey);
      } else {
        this.wallet = Wallet.fromSecret(seedOrPrivateKey);
      }

      console.log('✅ Escrow 지갑 설정 완료:', this.wallet.address);
      return true;
    } catch (error) {
      console.error('❌ Escrow 지갑 설정 실패:', error);
      return false;
    }
  }

  /**
   * XRP Escrow 생성 (표준 방식)
   * 시간 기반 조건부 지급
   */
  async createXRPEscrow(escrowPayment: EscrowPayment): Promise<EscrowResult> {
    if (!this.wallet || !this.client) {
      throw new Error('지갑이 설정되지 않았거나 연결되지 않았습니다.');
    }

    try {
      console.log('🔒 XRP Escrow 생성 시작');

      // Ripple 시간 변환 (Unix timestamp - Ripple Epoch)
      const finishAfterRipple = escrowPayment.finishAfter
        ? convertTimeToRippleTime(escrowPayment.finishAfter)
        : undefined;

      const cancelAfterRipple = escrowPayment.cancelAfter
        ? convertTimeToRippleTime(escrowPayment.cancelAfter)
        : undefined;

      // EscrowCreate 트랜잭션 생성
      const escrowCreate: EscrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: this.wallet.address,
        Destination: escrowPayment.to,
        Amount: xrpToDrops(escrowPayment.amount),
        DestinationTag: undefined,
        Condition: escrowPayment.condition,
        FinishAfter: finishAfterRipple,
        CancelAfter: cancelAfterRipple
      };

      console.log('📦 Escrow 트랜잭션:', escrowCreate);

      // 트랜잭션 실행 (표준 패턴)
      const prepared = await this.client.autofill(escrowCreate);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log('✅ XRP Escrow 생성 성공');
        console.log(`트랜잭션 해시: ${result.result.hash}`);
        console.log(`Escrow Sequence: ${prepared.Sequence}`);

        return {
          success: true,
          transactionHash: result.result.hash,
          escrowSequence: prepared.Sequence
        };
      } else {
        throw new Error(`Escrow 생성 실패: ${result.result.engine_result}`);
      }

    } catch (error) {
      console.error('❌ XRP Escrow 생성 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * IOU 토큰 Escrow 생성
   * CheckCreate 사용 (IOU는 EscrowCreate 미지원)
   */
  async createIOUEscrow(escrowPayment: EscrowPayment): Promise<EscrowResult> {
    if (!this.wallet || !this.client) {
      throw new Error('지갑이 설정되지 않았거나 연결되지 않았습니다.');
    }

    try {
      console.log('🔒 IOU 토큰 Escrow 생성 (CheckCreate 사용)');

      // IOU는 CheckCreate를 사용하여 조건부 지급 구현
      const checkCreate = {
        TransactionType: 'CheckCreate',
        Account: this.wallet.address,
        Destination: escrowPayment.to,
        SendMax: {
          currency: escrowPayment.currency!,
          issuer: escrowPayment.issuer!,
          value: escrowPayment.amount
        },
        Expiration: escrowPayment.cancelAfter
          ? convertTimeToRippleTime(escrowPayment.cancelAfter)
          : undefined
      };

      console.log('📦 Check 트랜잭션 (IOU Escrow):', checkCreate);

      const prepared = await this.client.autofill(checkCreate);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log('✅ IOU Check (Escrow) 생성 성공');
        return {
          success: true,
          transactionHash: result.result.hash,
          escrowSequence: prepared.Sequence
        };
      } else {
        throw new Error(`IOU Escrow 생성 실패: ${result.result.engine_result}`);
      }

    } catch (error) {
      console.error('❌ IOU Escrow 생성 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * Escrow 완료 (조건 충족 시)
   */
  async finishEscrow(
    owner: string,
    escrowSequence: number,
    fulfillment?: string
  ): Promise<EscrowResult> {
    if (!this.wallet || !this.client) {
      throw new Error('지갑이 설정되지 않았거나 연결되지 않았습니다.');
    }

    try {
      console.log('🔓 Escrow 완료 시작');

      const escrowFinish: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: this.wallet.address,
        Owner: owner,
        OfferSequence: escrowSequence,
        Fulfillment: fulfillment
      };

      const prepared = await this.client.autofill(escrowFinish);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log('✅ Escrow 완료 성공');
        return {
          success: true,
          transactionHash: result.result.hash
        };
      } else {
        throw new Error(`Escrow 완료 실패: ${result.result.engine_result}`);
      }

    } catch (error) {
      console.error('❌ Escrow 완료 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * Escrow 취소 (만료 시)
   */
  async cancelEscrow(owner: string, escrowSequence: number): Promise<EscrowResult> {
    if (!this.wallet || !this.client) {
      throw new Error('지갑이 설정되지 않았거나 연결되지 않았습니다.');
    }

    try {
      console.log('❌ Escrow 취소 시작');

      const escrowCancel: EscrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: this.wallet.address,
        Owner: owner,
        OfferSequence: escrowSequence
      };

      const prepared = await this.client.autofill(escrowCancel);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log('✅ Escrow 취소 성공');
        return {
          success: true,
          transactionHash: result.result.hash
        };
      } else {
        throw new Error(`Escrow 취소 실패: ${result.result.engine_result}`);
      }

    } catch (error) {
      console.error('❌ Escrow 취소 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 계정의 활성 Escrow 목록 조회
   */
  async getActiveEscrows(address: string): Promise<ActiveEscrow[]> {
    if (!this.client) {
      await this.connect();
    }

    try {
      const request: AccountObjectsRequest = {
        command: 'account_objects',
        account: address,
        type: 'escrow'
      };

      const response = await this.client!.request(request);
      const escrows: ActiveEscrow[] = [];

      if (response.result.account_objects) {
        for (const obj of response.result.account_objects) {
          if (obj.LedgerEntryType === 'Escrow') {
            escrows.push({
              account: obj.Account,
              destination: obj.Destination,
              amount: obj.Amount,
              escrowSequence: obj.Sequence || obj.PreviousTxnLgrSeq,
              condition: obj.Condition,
              finishAfter: obj.FinishAfter,
              cancelAfter: obj.CancelAfter,
              previousTxnID: obj.PreviousTxnID
            });
          }
        }
      }

      console.log(`✅ ${escrows.length}개의 활성 Escrow 발견`);
      return escrows;

    } catch (error) {
      console.error('❌ Escrow 조회 실패:', error);
      return [];
    }
  }

  /**
   * 연결 해제
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}

// ============= 사용 예제 =============

async function escrowExample() {
  const escrowManager = new XRPLEscrowManagerV2();

  // 1. 연결 및 지갑 설정
  await escrowManager.connect();
  await escrowManager.setWallet('sYourSeedHere'); // 실제 시드로 교체

  // 2. XRP Escrow 생성 (1시간 후 수령 가능)
  const escrowPayment: EscrowPayment = {
    from: 'rYourAddress',
    to: 'rReceiverAddress',
    amount: '10', // 10 XRP
    finishAfter: new Date(Date.now() + 3600 * 1000), // 1시간 후
    cancelAfter: new Date(Date.now() + 86400 * 1000) // 24시간 후
  };

  const result = await escrowManager.createXRPEscrow(escrowPayment);
  console.log('Escrow 생성 결과:', result);

  // 3. 활성 Escrow 조회
  const escrows = await escrowManager.getActiveEscrows('rYourAddress');
  console.log('활성 Escrow:', escrows);

  // 4. Escrow 완료 (조건 충족 시)
  if (result.escrowSequence) {
    const finishResult = await escrowManager.finishEscrow(
      'rYourAddress',
      result.escrowSequence
    );
    console.log('Escrow 완료 결과:', finishResult);
  }

  await escrowManager.disconnect();
}

// Singleton Instance
export const xrplEscrowV2 = new XRPLEscrowManagerV2();