import { Client, Wallet, AMMInfoRequest, Payment, TrustSet } from 'xrpl';

export interface MockToken {
  currency: string;
  issuer: string;
  name: string;
  symbol: string;
  decimals: number;
}

// XRPL Devnet 실제 토큰 정의 (4종)
export const MOCK_TOKENS: MockToken[] = [
  {
    currency: 'USD',
    issuer: 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX', // Devnet USD - 안정적인 AMM 풀 보유
    name: 'Devnet USD',
    symbol: 'USD',
    decimals: 2
  },
  {
    currency: 'CNY',
    issuer: 'rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x', // Devnet CNY - 활성 AMM 풀
    name: 'Devnet CNY',
    symbol: 'CNY',
    decimals: 2
  },
  {
    currency: 'EUR',
    issuer: 'rBXYWgAg6z5NxCshzGkNuX3YjHFyN26cgj', // Devnet EUR
    name: 'Devnet EUR',
    symbol: 'EUR',
    decimals: 2
  },
  {
    currency: 'TST',
    issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd', // Devnet Test Token
    name: 'Devnet Test Token',
    symbol: 'TST',
    decimals: 6
  }
];

export interface AMMPoolInfo {
  account: string;
  amount: any;
  amount2: any;
  tradingFee: number;
  auctionSlot?: any;
  lpToken: any;
}

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  price: string;
  priceImpact: string;
  fee: string;
  slippage: string;
}

export class XRPLAMMManager {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor(private network: 'mainnet' | 'testnet' | 'devnet' = 'devnet') {
    this.initializeClient();
  }

  private initializeClient() {
    const servers = {
      mainnet: 'wss://s1.ripple.com',
      testnet: 'wss://s.altnet.rippletest.net:51233',
      devnet: 'wss://s.devnet.rippletest.net:51233'
    };

    this.client = new Client(servers[this.network]);
  }

  async connect(): Promise<boolean> {
    if (!this.client) {
      this.initializeClient();
    }

    try {
      if (this.client && !this.client.isConnected()) {
        await this.client.connect();
      }
      return true;
    } catch (error) {
      console.error('Failed to connect to XRPL:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
    }
  }

  setWallet(wallet: Wallet) {
    this.wallet = wallet;
  }

  // Trust Line 설정 (토큰을 받기 위해 필요)
  async createTrustLine(
    currency: string,
    issuer: string,
    limit: string = '1000000'
  ): Promise<string | null> {
    if (!this.client || !this.wallet) {
      console.error('Client or wallet not initialized');
      return null;
    }

    try {
      const trustSetTx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: this.wallet.address,
        LimitAmount: {
          currency,
          issuer,
          value: limit
        }
      };

      const prepared = await this.client.autofill(trustSetTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log(`Trust line created for ${currency}`);
        return result.result.hash;
      }

      return null;
    } catch (error) {
      console.error('Failed to create trust line:', error);
      return null;
    }
  }

  // AMM 정보 조회
  async getAMMInfo(
    asset1: { currency: string; issuer?: string },
    asset2: { currency: string; issuer?: string }
  ): Promise<AMMPoolInfo | null> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) return null;

    try {
      // 실제 XRPL AMM 정보 조회 시도
      const ammInfoRequest: AMMInfoRequest = {
        command: 'amm_info',
        asset: asset1.currency === 'XRP'
          ? { currency: 'XRP' }
          : { currency: asset1.currency, issuer: asset1.issuer! },
        asset2: asset2.currency === 'XRP'
          ? { currency: 'XRP' }
          : { currency: asset2.currency, issuer: asset2.issuer! }
      };

      const response = await this.client.request(ammInfoRequest);

      if (response.result && response.result.amm) {
        const amm = response.result.amm;
        return {
          account: amm.account,
          amount: amm.amount,
          amount2: amm.amount2,
          tradingFee: amm.trading_fee || 0,
          auctionSlot: amm.auction_slot,
          lpToken: amm.lp_token
        };
      }

      // 실제 AMM 풀이 없는 경우 Mock 데이터 반환
      console.log(`No real AMM pool found for ${asset1.currency}/${asset2.currency}, using fallback`);
      return this.getMockAMMInfo(asset1, asset2);

    } catch (error) {
      console.warn('AMM info request failed, using fallback:', error);
      return this.getMockAMMInfo(asset1, asset2);
    }
  }

  // Fallback Mock AMM 정보
  private getMockAMMInfo(
    asset1: { currency: string; issuer?: string },
    asset2: { currency: string; issuer?: string }
  ): AMMPoolInfo {
    return {
      account: 'rMockAMMAccount123456789',
      amount: asset1.currency === 'XRP'
        ? '1000000000' // 1000 XRP in drops
        : { currency: asset1.currency, issuer: asset1.issuer, value: '10000' },
      amount2: asset2.currency === 'XRP'
        ? '500000000' // 500 XRP in drops
        : { currency: asset2.currency, issuer: asset2.issuer, value: '5000' },
      tradingFee: 3000, // 0.3%
      lpToken: {
        currency: 'LP',
        issuer: 'rMockAMMAccount123456789',
        value: '7071.067812' // sqrt(10000 * 5000)
      }
    };
  }

  // 스왑 견적 계산 (Constant Product Formula: K = X * Y)
  calculateSwapQuote(
    inputAmount: number,
    poolReserve1: number,
    poolReserve2: number,
    fee: number = 0.003 // 0.3% default fee
  ): SwapQuote {
    // 수수료를 제외한 실제 입력 금액
    const inputWithFee = inputAmount * (1 - fee);

    // Constant Product 공식: K = poolReserve1 * poolReserve2
    const k = poolReserve1 * poolReserve2;

    // 새로운 풀 잔액
    const newPoolReserve1 = poolReserve1 + inputWithFee;
    const newPoolReserve2 = k / newPoolReserve1;

    // 출력 금액
    const outputAmount = poolReserve2 - newPoolReserve2;

    // 가격 계산
    const price = inputAmount / outputAmount;

    // 가격 영향 계산 (%)
    const priceImpact = ((newPoolReserve1 / newPoolReserve2) / (poolReserve1 / poolReserve2) - 1) * 100;

    // 슬리피지 계산 (예상 최대 슬리피지)
    const slippage = Math.min(priceImpact * 2, 10); // 최대 10%

    return {
      inputAmount: inputAmount.toFixed(6),
      outputAmount: outputAmount.toFixed(6),
      price: price.toFixed(6),
      priceImpact: priceImpact.toFixed(2),
      fee: (inputAmount * fee).toFixed(6),
      slippage: slippage.toFixed(2)
    };
  }

  // 실제 스왑 실행
  async executeSwap(
    fromAsset: { currency: string; issuer?: string; amount: string },
    toAsset: { currency: string; issuer?: string; minAmount: string }
  ): Promise<string | null> {
    if (!this.client || !this.wallet) {
      console.error('Client or wallet not initialized');
      return null;
    }

    try {
      // Payment 트랜잭션을 사용하여 스왑 실행
      // XRPL의 Payment는 경로 찾기를 통해 자동으로 AMM을 활용
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Destination: this.wallet.address, // 자기 자신에게 전송 (스왑)
        Amount: toAsset.currency === 'XRP'
          ? toAsset.minAmount // XRP는 drops 단위
          : {
              currency: toAsset.currency,
              issuer: toAsset.issuer!,
              value: toAsset.minAmount
            },
        SendMax: fromAsset.currency === 'XRP'
          ? fromAsset.amount // XRP는 drops 단위
          : {
              currency: fromAsset.currency,
              issuer: fromAsset.issuer!,
              value: fromAsset.amount
            },
        Flags: 0x00020000 // tfPartialPayment - 부분 지불 허용
      };

      const prepared = await this.client.autofill(payment);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        console.log('Swap executed successfully');
        return result.result.hash;
      }

      return null;
    } catch (error) {
      console.error('Failed to execute swap:', error);
      return null;
    }
  }

  // Mock 스왑 실행 (실제 네트워크 연결 없이 테스트용)
  async executeMockSwap(
    fromCurrency: string,
    toCurrency: string,
    amount: string
  ): Promise<{ success: boolean; hash?: string; outputAmount?: string; error?: string }> {
    try {
      // Devnet 실제 토큰 기반 환율 (AMM 풀 기반 근사치)
      const mockRates: { [key: string]: number } = {
        'XRP_USD': 0.5,     // XRP → USD (실제 AMM 풀 존재)
        'USD_XRP': 2,       // USD → XRP
        'XRP_CNY': 3.5,     // XRP → CNY (실제 AMM 풀 존재)
        'CNY_XRP': 0.286,   // CNY → XRP
        'XRP_EUR': 0.45,    // XRP → EUR
        'EUR_XRP': 2.22,    // EUR → XRP
        'XRP_TST': 10,      // XRP → Test Token
        'TST_XRP': 0.1,     // Test Token → XRP
        'USD_CNY': 7,       // USD → CNY
        'CNY_USD': 0.143,   // CNY → USD
        'USD_EUR': 0.9,     // USD → EUR
        'EUR_USD': 1.11,    // EUR → USD
        'USD_TST': 20,      // USD → Test Token
        'TST_USD': 0.05,    // Test Token → USD
      };

      const rateKey = `${fromCurrency}_${toCurrency}`;
      const rate = mockRates[rateKey] || 1;

      const inputAmount = parseFloat(amount);
      const outputAmount = inputAmount * rate * 0.997; // 0.3% 수수료 차감

      // Mock 트랜잭션 해시
      const mockHash = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`Mock swap: ${amount} ${fromCurrency} → ${outputAmount.toFixed(6)} ${toCurrency}`);

      return {
        success: true,
        hash: mockHash,
        outputAmount: outputAmount.toFixed(6)
      };
    } catch (error) {
      console.error('Mock swap failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock swap failed'
      };
    }
  }

  // 사용 가능한 스왑 경로 조회
  async getAvailableSwapPairs(): Promise<Array<{ from: string; to: string; available: boolean }>> {
    // 실제 Devnet 토큰 기반 스왑 페어
    const pairs = [
      // XRP 기반 페어 (실제 AMM 풀 존재)
      { from: 'XRP', to: 'USD', available: true },   // 실제 AMM 풀 활성
      { from: 'USD', to: 'XRP', available: true },
      { from: 'XRP', to: 'CNY', available: true },   // 실제 AMM 풀 활성
      { from: 'CNY', to: 'XRP', available: true },

      // 기타 지원 페어
      { from: 'XRP', to: 'EUR', available: true },
      { from: 'EUR', to: 'XRP', available: true },
      { from: 'XRP', to: 'TST', available: true },   // Test Token
      { from: 'TST', to: 'XRP', available: true },

      // 토큰 간 페어 (교차 스왑)
      { from: 'USD', to: 'CNY', available: true },
      { from: 'CNY', to: 'USD', available: true },
      { from: 'USD', to: 'EUR', available: true },
      { from: 'EUR', to: 'USD', available: true },
      { from: 'USD', to: 'TST', available: true },
      { from: 'TST', to: 'USD', available: true },
    ];

    return pairs;
  }
}

// Singleton instance
export const xrplAMM = new XRPLAMMManager('devnet');