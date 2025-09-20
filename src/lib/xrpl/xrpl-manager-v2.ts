import { Client, Wallet } from 'xrpl';
import { xrplTransferV2, TransferRequest, TransferResult } from './xrpl-transfer-v2';
import { xrplBatchV2, BatchPaymentItem, BatchResult } from './xrpl-batch-v2';
import { xrplEscrowV2, EscrowPayment, EscrowResult } from './xrpl-escrow-v2';
import { walletUtilsV2, WalletInfo } from './wallet-utils-v2';

export type TransferType = 'regular' | 'batch' | 'escrow';
export type BatchMode = 'Independent' | 'AllOrNothing' | 'UntilFailure';

export interface UnifiedTransferRequest {
  type: TransferType;
  fromAddress: string;
  toAddress: string | string[]; // 단일 주소 또는 다중 주소
  amount: string | string[]; // 단일 금액 또는 다중 금액
  currency: string;
  issuer?: string;
  memo?: string;
  // Batch 관련
  batchMode?: BatchMode;
  // Escrow 관련
  finishAfter?: number;
  cancelAfter?: number;
  condition?: string;
  fulfillment?: string;
}

export interface UnifiedTransferResult {
  success: boolean;
  type: TransferType;
  results: any;
  error?: string;
}

export class XRPLManagerV2 {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    this.client = new Client("wss://s.devnet.rippletest.net:51233");
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.client) {
        this.client = new Client("wss://s.devnet.rippletest.net:51233");
      }
      await this.client.connect();
      console.log('✅ XRPL Devnet 연결 성공');
      return true;
    } catch (error) {
      console.error('❌ XRPL 연결 실패:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  // 표준 방식: 지갑 설정 (시드 또는 개인키 사용)
  async setWallet(seedOrPrivateKey: string): Promise<boolean> {
    try {
      console.log('🔑 통합 지갑 설정 시도:', {
        keyPrefix: seedOrPrivateKey?.substring(0, 10) + '...',
        keyLength: seedOrPrivateKey?.length
      });

      // 시드인지 개인키인지 판별하여 적절한 방법으로 지갑 생성
      if (seedOrPrivateKey.startsWith('s') && seedOrPrivateKey.length === 29) {
        // 시드 구문인 경우
        this.wallet = Wallet.fromSeed(seedOrPrivateKey);
        console.log('✅ 시드로 통합 지갑 설정 성공');
      } else if (seedOrPrivateKey.startsWith('ED') && seedOrPrivateKey.length === 66) {
        // 개인키인 경우
        this.wallet = Wallet.fromSecret(seedOrPrivateKey);
        console.log('✅ 개인키로 통합 지갑 설정 성공');
      } else {
        // 시도해보기 (시드 우선)
        try {
          this.wallet = Wallet.fromSeed(seedOrPrivateKey);
          console.log('✅ 시드로 통합 지갑 설정 성공 (자동 판별)');
        } catch {
          this.wallet = Wallet.fromSecret(seedOrPrivateKey);
          console.log('✅ 개인키로 통합 지갑 설정 성공 (자동 판별)');
        }
      }

      console.log('✅ 통합 지갑 설정 완료:', {
        address: this.wallet.address,
        publicKey: this.wallet.publicKey
      });

      // 모든 하위 매니저들에도 지갑 설정
      await xrplTransferV2.setWallet(seedOrPrivateKey);
      await xrplBatchV2.setWallet(seedOrPrivateKey);
      await xrplEscrowV2.setWallet(seedOrPrivateKey);

      return true;
    } catch (error) {
      console.error('❌ 통합 지갑 설정 실패:', error);
      return false;
    }
  }

  // 표준 방식: 새 지갑 생성
  async createNewWallet(): Promise<WalletInfo> {
    return await walletUtilsV2.createNewWallet();
  }

  // 표준 방식: 시드로 지갑 로드
  async loadWalletFromSeed(seed: string): Promise<WalletInfo> {
    return await walletUtilsV2.loadWalletFromSeed(seed);
  }

  // 표준 방식: 개인키로 지갑 로드
  async loadWalletFromPrivateKey(privateKey: string): Promise<WalletInfo> {
    return await walletUtilsV2.loadWalletFromPrivateKey(privateKey);
  }

  // Faucet으로 XRP 충전
  async fundWallet(wallet: Wallet): Promise<boolean> {
    return await walletUtilsV2.fundWallet(wallet);
  }

  // 통합 전송 실행
  async executeTransfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResult> {
    try {
      console.log(`🚀 통합 전송 실행: ${request.type}`, request);

      switch (request.type) {
        case 'regular':
          return await this.executeRegularTransfer(request);
        case 'batch':
          return await this.executeBatchTransfer(request);
        case 'escrow':
          return await this.executeEscrowTransfer(request);
        default:
          throw new Error(`지원하지 않는 전송 타입: ${request.type}`);
      }
    } catch (error) {
      console.error('❌ 통합 전송 실행 실패:', error);
      return {
        success: false,
        type: request.type,
        results: null,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 일반 전송 실행
  private async executeRegularTransfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResult> {
    if (Array.isArray(request.toAddress) || Array.isArray(request.amount)) {
      throw new Error('일반 전송은 단일 주소와 금액만 지원합니다.');
    }

    const transferRequest: TransferRequest = {
      fromAddress: request.fromAddress,
      toAddress: request.toAddress as string,
      amount: request.amount as string,
      currency: request.currency,
      issuer: request.issuer,
      memo: request.memo
    };

    const result = await xrplTransferV2.sendTransfer(transferRequest);

    return {
      success: result.success,
      type: 'regular',
      results: result,
      error: result.error
    };
  }

  // 일괄 전송 실행
  private async executeBatchTransfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResult> {
    if (!Array.isArray(request.toAddress) || !Array.isArray(request.amount)) {
      throw new Error('일괄 전송은 다중 주소와 금액이 필요합니다.');
    }

    if (request.toAddress.length !== request.amount.length) {
      throw new Error('주소와 금액의 개수가 일치하지 않습니다.');
    }

    const batchPayments: BatchPaymentItem[] = request.toAddress.map((address, index) => ({
      to: address,
      amount: request.amount[index],
      currency: request.currency,
      issuer: request.issuer,
      memo: request.memo
    }));

    const result = await xrplBatchV2.executeBatchPayments(
      batchPayments, 
      request.batchMode || 'Independent'
    );

    return {
      success: result.success,
      type: 'batch',
      results: result,
      error: result.results.find(r => !r.success)?.error
    };
  }

  // Escrow 전송 실행
  private async executeEscrowTransfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResult> {
    if (Array.isArray(request.toAddress) || Array.isArray(request.amount)) {
      throw new Error('Escrow 전송은 단일 주소와 금액만 지원합니다.');
    }

    const escrowPayment: EscrowPayment = {
      destination: request.toAddress as string,
      amount: request.amount as string,
      currency: request.currency,
      issuer: request.issuer,
      memo: request.memo,
      finishAfter: request.finishAfter,
      cancelAfter: request.cancelAfter,
      condition: request.condition,
      fulfillment: request.fulfillment
    };

    const result = await xrplEscrowV2.createEscrow(escrowPayment);

    return {
      success: result.success,
      type: 'escrow',
      results: result,
      error: result.error
    };
  }

  // 잔액 조회
  async getBalance(address: string, currency: string = 'XRP'): Promise<string> {
    return await walletUtilsV2.getWalletInfo(address).then(info => info.balance || '0');
  }

  // 계정 정보 조회
  async getAccountInfo(address: string): Promise<any> {
    return await walletUtilsV2.getWalletInfo(address);
  }

  // TrustLine 조회
  async getTrustLines(address: string): Promise<any[]> {
    return await walletUtilsV2.getTrustLines(address);
  }

  // 지갑 유효성 검증
  async validateWallet(address: string): Promise<{ valid: boolean; error?: string }> {
    return await walletUtilsV2.validateWallet(address);
  }

  // 현재 지갑 정보 반환
  getCurrentWallet(): Wallet | null {
    return this.wallet;
  }

  // 현재 지갑 주소 반환
  getCurrentWalletAddress(): string | null {
    return this.wallet?.address || null;
  }
}

// Singleton instance
export const xrplManagerV2 = new XRPLManagerV2();