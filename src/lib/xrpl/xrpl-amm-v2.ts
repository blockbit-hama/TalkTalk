import { Client, Wallet, Payment, AMMInfoRequest } from 'xrpl';
import { xrplClient } from './xrpl-client';

export interface MockToken {
  currency: string;
  issuer: string;
  name: string;
  symbol: string;
  decimals: number;
}

// XRPL Devnet 실제 토큰 정의 (표준 예제 기반)
export const MOCK_TOKENS: MockToken[] = [
  {
    currency: 'USD',
    issuer: 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX', // Devnet USD - 실제 AMM 풀 보유
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

export interface SwapRequest {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  minAmount?: string;
  slippage?: number;
}

export interface SwapResult {
  success: boolean;
  transactionHash?: string;
  actualFromAmount?: string;
  actualToAmount?: string;
  error?: string;
}

export class XRPLAMMManagerV2 {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    this.client = xrplClient.getClient();
  }

  async setWallet(seedOrPrivateKey: string): Promise<boolean> {
    try {
      console.log('🔑 AMM 지갑 설정 시도:', {
        keyPrefix: seedOrPrivateKey?.substring(0, 10) + '...',
        keyLength: seedOrPrivateKey?.length
      });

      // 시드인지 개인키인지 판별하여 적절한 방법으로 지갑 생성
      if (seedOrPrivateKey.startsWith('s') && seedOrPrivateKey.length === 29) {
        // 시드 구문인 경우
        this.wallet = Wallet.fromSeed(seedOrPrivateKey);
        console.log('✅ 시드로 AMM 지갑 설정 성공');
      } else if (seedOrPrivateKey.startsWith('ED') && seedOrPrivateKey.length === 66) {
        // 개인키인 경우
        this.wallet = Wallet.fromSecret(seedOrPrivateKey);
        console.log('✅ 개인키로 AMM 지갑 설정 성공');
      } else {
        // 시도해보기 (시드 우선)
        try {
          this.wallet = Wallet.fromSeed(seedOrPrivateKey);
          console.log('✅ 시드로 AMM 지갑 설정 성공 (자동 판별)');
        } catch {
          this.wallet = Wallet.fromSecret(seedOrPrivateKey);
          console.log('✅ 개인키로 AMM 지갑 설정 성공 (자동 판별)');
        }
      }

      console.log('✅ AMM 지갑 설정 완료:', {
        address: this.wallet.address,
        publicKey: this.wallet.publicKey
      });

      return true;
    } catch (error) {
      console.error('❌ AMM 지갑 설정 실패:', error);
      return false;
    }
  }

  // 표준 예제 기반 AMM 정보 조회
  async getAMMInfo(fromCurrency: string, toCurrency: string): Promise<AMMPoolInfo | null> {
    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      console.log(`🔍 AMM 정보 조회: ${fromCurrency}/${toCurrency}`);

      // 표준 예제 방식의 AMM 정보 요청
      const asset1 = fromCurrency === 'XRP' ? { currency: 'XRP' } : {
        currency: fromCurrency,
        issuer: this.getTokenIssuer(fromCurrency)
      };

      const asset2 = toCurrency === 'XRP' ? { currency: 'XRP' } : {
        currency: toCurrency,
        issuer: this.getTokenIssuer(toCurrency)
      };

      const request: AMMInfoRequest = {
        command: 'amm_info',
        asset: asset1,
        asset2: asset2
      };

      const result = await this.client!.request(request);

      if (result.result.amm) {
        console.log('✅ AMM 풀 정보 조회 성공:', result.result.amm);
        return result.result.amm;
      } else {
        console.log('⚠️ AMM 풀이 존재하지 않음');
        return null;
      }
    } catch (error) {
      console.error('❌ AMM 정보 조회 실패:', error);
      return null;
    }
  }

  // 표준 예제 기반 스왑 견적 계산
  async calculateSwapQuote(request: SwapRequest): Promise<SwapQuote | null> {
    try {
      console.log(`💰 스왑 견적 계산: ${request.fromAmount} ${request.fromCurrency} → ${request.toCurrency}`);

      // AMM 풀 정보 조회
      const ammInfo = await this.getAMMInfo(request.fromCurrency, request.toCurrency);
      
      if (!ammInfo) {
        console.log('⚠️ AMM 풀이 없어 Mock 견적 사용');
        return this.calculateMockQuote(request);
      }

      // 실제 AMM 풀 기반 견적 계산
      const fromAmount = parseFloat(request.fromAmount);
      const poolReserve1 = parseFloat(ammInfo.amount.value || ammInfo.amount);
      const poolReserve2 = parseFloat(ammInfo.amount2.value || ammInfo.amount2);
      const tradingFee = ammInfo.tradingFee / 1000000; // TradingFee는 마이크로 단위

      // AMM 공식 적용
      const inputWithFee = fromAmount * (1 - tradingFee);
      const k = poolReserve1 * poolReserve2;
      const newPoolReserve1 = poolReserve1 + inputWithFee;
      const newPoolReserve2 = k / newPoolReserve1;
      const outputAmount = poolReserve2 - newPoolReserve2;

      const price = fromAmount / outputAmount;
      const priceImpact = ((newPoolReserve1 / newPoolReserve2) / (poolReserve1 / poolReserve2) - 1) * 100;
      const fee = fromAmount * tradingFee;

      console.log('✅ 실제 AMM 견적 계산 완료:', {
        inputAmount: fromAmount,
        outputAmount: outputAmount,
        price: price,
        priceImpact: priceImpact,
        fee: fee
      });

      return {
        inputAmount: fromAmount.toFixed(6),
        outputAmount: outputAmount.toFixed(6),
        price: price.toFixed(6),
        priceImpact: priceImpact.toFixed(2),
        fee: fee.toFixed(6),
        slippage: Math.min(priceImpact * 2, 10).toFixed(2)
      };
    } catch (error) {
      console.error('❌ 스왑 견적 계산 실패:', error);
      return this.calculateMockQuote(request);
    }
  }

  // 표준 예제 기반 스왑 실행
  async executeSwap(request: SwapRequest): Promise<SwapResult> {
    if (!this.wallet) {
      throw new Error('지갑이 설정되지 않았습니다.');
    }

    if (!this.client) {
      await xrplClient.connect();
      this.client = xrplClient.getClient();
    }

    try {
      console.log(`🔄 표준 방식 스왑 실행: ${request.fromAmount} ${request.fromCurrency} → ${request.toCurrency}`);

      // 표준 예제 방식의 Payment 트랜잭션 생성 (스왑용)
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Destination: this.wallet.address, // 자기 자신에게 전송 (스왑)
        Amount: request.toCurrency === 'XRP'
          ? (parseFloat(request.minAmount || '0') * 1000000).toString() // XRP to drops
          : {
              currency: request.toCurrency,
              issuer: this.getTokenIssuer(request.toCurrency),
              value: request.minAmount || '0'
            },
        SendMax: request.fromCurrency === 'XRP'
          ? (parseFloat(request.fromAmount) * 1000000).toString() // XRP to drops
          : {
              currency: request.fromCurrency,
              issuer: this.getTokenIssuer(request.fromCurrency),
              value: request.fromAmount
            },
        Flags: 0x00020000 // tfPartialPayment - 부분 지불 허용
      };

      console.log('📦 표준 방식 스왑 트랜잭션:', payment);

      // 표준 예제 방식으로 트랜잭션 실행
      const prepared = await this.client!.autofill(payment);
      const signed = this.wallet.sign(prepared);
      const result = await this.client!.submitAndWait(signed.tx_blob);

      console.log('📦 표준 방식 스왑 결과:', {
        hash: result.result.hash,
        validated: result.result.validated,
        engine_result: result.result.engine_result
      });

      if (result.result.validated) {
        // 실제 전송된 금액 추출 (메타데이터에서)
        const meta = result.result.meta;
        let actualFromAmount = request.fromAmount;
        let actualToAmount = request.minAmount || '0';

        if (meta && meta.delivered_amount) {
          actualToAmount = typeof meta.delivered_amount === 'string' 
            ? (parseFloat(meta.delivered_amount) / 1000000).toString() // drops to XRP
            : meta.delivered_amount.value;
        }

        return {
          success: true,
          transactionHash: result.result.hash,
          actualFromAmount,
          actualToAmount
        };
      } else {
        return {
          success: false,
          error: `스왑 트랜잭션 실패: ${result.result.engine_result}`
        };
      }

    } catch (error) {
      console.error('❌ 표준 방식 스왑 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 사용 가능한 스왑 페어 조회
  async getAvailableSwapPairs(): Promise<Array<{ from: string; to: string; available: boolean }>> {
    const pairs = [
      { from: 'XRP', to: 'USD' },
      { from: 'XRP', to: 'CNY' },
      { from: 'XRP', to: 'EUR' },
      { from: 'USD', to: 'XRP' },
      { from: 'CNY', to: 'XRP' },
      { from: 'EUR', to: 'XRP' },
      { from: 'USD', to: 'CNY' },
      { from: 'CNY', to: 'USD' }
    ];

    const availablePairs = [];
    for (const pair of pairs) {
      const ammInfo = await this.getAMMInfo(pair.from, pair.to);
      availablePairs.push({
        ...pair,
        available: !!ammInfo
      });
    }

    return availablePairs;
  }

  // Mock 견적 계산 (AMM 풀이 없을 때)
  private calculateMockQuote(request: SwapRequest): SwapQuote {
    const fromAmount = parseFloat(request.fromAmount);
    let outputAmount = fromAmount;

    // 간단한 Mock 환율 적용
    const rates: { [key: string]: number } = {
      'USD': 1.0,
      'CNY': 7.2,
      'EUR': 0.85,
      'TST': 0.1
    };

    if (request.fromCurrency === 'XRP') {
      outputAmount = fromAmount * (rates[request.toCurrency] || 1);
    } else if (request.toCurrency === 'XRP') {
      outputAmount = fromAmount / (rates[request.fromCurrency] || 1);
    } else {
      outputAmount = fromAmount * (rates[request.toCurrency] / rates[request.fromCurrency]);
    }

    return {
      inputAmount: fromAmount.toFixed(6),
      outputAmount: outputAmount.toFixed(6),
      price: (fromAmount / outputAmount).toFixed(6),
      priceImpact: '0.00',
      fee: (fromAmount * 0.003).toFixed(6), // 0.3% 수수료
      slippage: '0.50'
    };
  }

  // 토큰 발행자 주소 반환
  private getTokenIssuer(currency: string): string {
    const token = MOCK_TOKENS.find(t => t.currency === currency.toUpperCase());
    if (!token) {
      throw new Error(`지원하지 않는 통화: ${currency}`);
    }
    return token.issuer;
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
export const xrplAMMV2 = new XRPLAMMManagerV2();