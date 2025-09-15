// XRPL Devnet Faucet 연동
export interface FaucetResult {
  success: boolean;
  account?: {
    classicAddress: string;
    xAddress: string;
    secret: string;
  };
  balance?: string;
  error?: string;
}

export class XRPLFaucet {
  private devnetFaucetUrl = 'https://faucet.devnet.rippletest.net/accounts';
  private testnetFaucetUrl = 'https://faucet.altnet.rippletest.net/accounts';

  /**
   * Devnet Faucet에서 XRP 충전 요청
   */
  async requestDevnetXRP(address: string): Promise<FaucetResult> {
    try {
      console.log('Devnet Faucet XRP 요청:', address);

      const response = await fetch(this.devnetFaucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: address,
          amount: '1000' // 1000 XRP 요청
        })
      });

      if (!response.ok) {
        throw new Error(`Faucet 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('Faucet 응답:', data);

      return {
        success: true,
        account: {
          classicAddress: data.account?.classicAddress || address,
          xAddress: data.account?.xAddress || '',
          secret: data.account?.secret || ''
        },
        balance: data.balance || '1000000000' // 1000 XRP in drops
      };

    } catch (error) {
      console.error('Devnet Faucet 오류:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Devnet Faucet 요청 실패'
      };
    }
  }

  /**
   * Testnet Faucet에서 XRP 충전 요청
   */
  async requestTestnetXRP(address: string): Promise<FaucetResult> {
    try {
      console.log('Testnet Faucet XRP 요청:', address);

      const response = await fetch(this.testnetFaucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: address
        })
      });

      if (!response.ok) {
        throw new Error(`Testnet Faucet 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('Testnet Faucet 응답:', data);

      return {
        success: true,
        account: {
          classicAddress: data.account?.classicAddress || address,
          xAddress: data.account?.xAddress || '',
          secret: data.account?.secret || ''
        },
        balance: data.balance || '1000000000' // 1000 XRP in drops
      };

    } catch (error) {
      console.error('Testnet Faucet 오류:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Testnet Faucet 요청 실패'
      };
    }
  }


  /**
   * 네트워크에 따른 Faucet 요청
   */
  async requestXRP(address: string, network: 'devnet' | 'testnet' = 'devnet'): Promise<FaucetResult> {
    if (network === 'devnet') {
      return this.requestDevnetXRP(address);
    } else {
      return this.requestTestnetXRP(address);
    }
  }

  /**
   * Faucet 가능 여부 확인 (일일 제한 등)
   */
  async checkFaucetAvailability(address: string): Promise<{
    available: boolean;
    remainingTime?: number;
    reason?: string;
  }> {
    try {
      // 실제로는 Faucet API에서 제한 확인
      // 여기서는 Mock 응답
      const lastFaucetTime = localStorage.getItem(`faucet_${address}`);

      if (lastFaucetTime) {
        const timeSinceLastRequest = Date.now() - parseInt(lastFaucetTime);
        const oneDay = 24 * 60 * 60 * 1000; // 24시간

        if (timeSinceLastRequest < oneDay) {
          return {
            available: false,
            remainingTime: oneDay - timeSinceLastRequest,
            reason: '일일 한도 초과 (24시간마다 1회만 가능)'
          };
        }
      }

      return {
        available: true
      };
    } catch (error) {
      console.error('Faucet 가용성 확인 오류:', error);
      return {
        available: false,
        reason: '가용성 확인 실패'
      };
    }
  }

  /**
   * Faucet 사용 기록 저장
   */
  recordFaucetUsage(address: string): void {
    localStorage.setItem(`faucet_${address}`, Date.now().toString());
  }
}

// Singleton instance
export const xrplFaucet = new XRPLFaucet();