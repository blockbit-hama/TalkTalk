import { Wallet, Client } from 'xrpl';

export interface WalletInfo {
  address: string;
  seed?: string;
  publicKey: string;
  balance?: string;
  sequence?: number;
}

export class WalletUtilsV2 {
  private client: Client | null = null;

  constructor() {
    // Devnet 연결
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

  // 표준 방식: 새 지갑 생성
  async createNewWallet(): Promise<WalletInfo> {
    try {
      const newWallet = Wallet.generate();
      console.log('✅ 새 지갑 생성 완료');
      console.log(`주소: ${newWallet.address}`);
      console.log(`시드: ${newWallet.seed}`);
      console.log(`공개키: ${newWallet.publicKey}`);

      return {
        address: newWallet.address,
        seed: newWallet.seed!,
        publicKey: newWallet.publicKey!
      };
    } catch (error) {
      console.error('❌ 새 지갑 생성 실패:', error);
      throw new Error(`새 지갑 생성 실패: ${error}`);
    }
  }

  // 표준 방식: 시드로 지갑 로드
  async loadWalletFromSeed(seed: string): Promise<WalletInfo> {
    try {
      const wallet = Wallet.fromSeed(seed.trim());
      console.log('✅ 시드로 지갑 로드 성공');
      console.log(`주소: ${wallet.address}`);

      return {
        address: wallet.address,
        seed: wallet.seed!,
        publicKey: wallet.publicKey!
      };
    } catch (error) {
      console.error('❌ 시드로 지갑 로드 실패:', error);
      throw new Error(`시드로 지갑 로드 실패: ${error}`);
    }
  }

  // 표준 방식: 개인키로 지갑 로드
  async loadWalletFromPrivateKey(privateKey: string): Promise<WalletInfo> {
    try {
      const wallet = Wallet.fromSecret(privateKey);
      console.log('✅ 개인키로 지갑 로드 성공');
      console.log(`주소: ${wallet.address}`);

      return {
        address: wallet.address,
        seed: wallet.seed!,
        publicKey: wallet.publicKey!
      };
    } catch (error) {
      console.error('❌ 개인키로 지갑 로드 실패:', error);
      throw new Error(`개인키로 지갑 로드 실패: ${error}`);
    }
  }

  // 지갑 정보 조회 (잔액, 시퀀스 포함)
  async getWalletInfo(address: string): Promise<WalletInfo> {
    if (!this.client) {
      await this.connect();
    }

    try {
      // XRP 잔액 조회
      const balance = await this.client!.getXrpBalance(address);
      
      // 계정 정보 조회
      const accountInfo = await this.client!.request({ 
        command: "account_info", 
        account: address 
      });

      const sequence = accountInfo.result.account_data.Sequence;

      console.log(`✅ 지갑 정보 조회 성공: ${address}`);
      console.log(`잔액: ${balance} XRP`);
      console.log(`시퀀스: ${sequence}`);

      return {
        address,
        publicKey: '', // 계정 정보에서는 공개키를 직접 가져올 수 없음
        balance,
        sequence
      };
    } catch (error) {
      console.error('❌ 지갑 정보 조회 실패:', error);
      throw new Error(`지갑 정보 조회 실패: ${error}`);
    }
  }

  // Faucet으로 XRP 충전 (표준 방식)
  async fundWallet(wallet: Wallet): Promise<boolean> {
    if (!this.client) {
      await this.connect();
    }

    try {
      await this.client!.fundWallet(wallet);
      console.log(`✅ Faucet 충전 완료: ${wallet.address}`);
      return true;
    } catch (error) {
      console.error('❌ Faucet 충전 실패:', error);
      return false;
    }
  }

  // TrustLine 조회
  async getTrustLines(address: string): Promise<any[]> {
    if (!this.client) {
      await this.connect();
    }

    try {
      const accountLines = await this.client!.request({
        command: "account_lines",
        account: address
      });

      return accountLines.result.lines;
    } catch (error) {
      console.error('❌ TrustLine 조회 실패:', error);
      return [];
    }
  }

  // 지갑 유효성 검증
  async validateWallet(address: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const accountInfo = await this.client!.request({ 
        command: "account_info", 
        account: address 
      });

      if (accountInfo.result.account_data) {
        return { valid: true };
      } else {
        return { valid: false, error: '계정이 활성화되지 않았습니다.' };
      }
    } catch (error: any) {
      if (error.message && error.message.includes('Account not found')) {
        return { valid: false, error: '계정이 존재하지 않습니다. Faucet으로 활성화해주세요.' };
      }
      return { valid: false, error: error.message || '계정 검증 실패' };
    }
  }
}

// Singleton instance
export const walletUtilsV2 = new WalletUtilsV2();