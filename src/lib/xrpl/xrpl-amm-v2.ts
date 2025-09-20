import { Client, Wallet, Payment, AMMInfoRequest } from 'xrpl';
import { xrplClient } from './xrpl-client';

export interface MockToken {
  currency: string;
  issuer: string;
  name: string;
  symbol: string;
  decimals: number;
}

// XRPL Testnet 실제 토큰 정의 (TST만)
export const MOCK_TOKENS: MockToken[] = [
  {
    currency: 'TST',
    issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd', // Testnet Test Token - 실제 활성화된 토큰
    name: 'Testnet Test Token',
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
    // 클라이언트 연결 상태 확인 및 연결
    if (!this.client || !this.client.isConnected()) {
      console.log('🔌 XRPL 클라이언트 연결 시도...');
      const connected = await xrplClient.connect();
      if (!connected) {
        console.error('❌ XRPL 네트워크 연결에 실패했습니다.');
        return null;
      }
      this.client = xrplClient.getClient();
      console.log('✅ XRPL 클라이언트 연결 성공');
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
      
      // 특정 에러에 대한 더 자세한 정보 제공
      if (error instanceof Error) {
        if (error.message.includes('Account not found')) {
          console.log('💡 계정이 존재하지 않습니다. 토큰 발행자가 활성화되지 않았을 수 있습니다.');
        } else if (error.message.includes('Invalid parameters')) {
          console.log('💡 잘못된 매개변수입니다. 토큰 정보를 확인해주세요.');
        }
      }
      
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
        throw new Error('해당 토큰 쌍에 대한 AMM 풀이 존재하지 않습니다.');
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
      throw error;
    }
  }

  // 표준 예제 기반 스왑 실행
  async executeSwap(request: SwapRequest): Promise<SwapResult> {
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
      console.log(`🔄 표준 방식 스왑 실행: ${request.fromAmount} ${request.fromCurrency} → ${request.toCurrency}`);

      // 토큰 발행자 계정 존재 여부 확인
      const tokenValidation = await this.validateTokenAccounts(request.fromCurrency, request.toCurrency);
      if (!tokenValidation.valid) {
        throw new Error(`토큰 발행자 계정이 존재하지 않음: ${tokenValidation.error}`);
      }

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
      throw error;
    }
  }

  // 사용 가능한 스왑 페어 조회
  async getAvailableSwapPairs(): Promise<Array<{ from: string; to: string; available: boolean }>> {
    const pairs = [
      { from: 'XRP', to: 'TST' },
      { from: 'XRP', to: 'USD' },
      { from: 'TST', to: 'XRP' },
      { from: 'USD', to: 'XRP' },
      { from: 'TST', to: 'USD' },
      { from: 'USD', to: 'TST' }
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


  // 실제 Testnet에서 사용 가능한 토큰 확인
  async checkAvailableTokens(): Promise<void> {
    console.log('🔍 Testnet에서 사용 가능한 토큰 확인 중...');

    // 모든 토큰이 같은 발행자를 사용하므로 하나만 확인
    const issuer = 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd';

    try {
      const accountInfo = await this.client!.request({
        command: 'account_info',
        account: issuer
      });

      if (accountInfo.result.account_data) {
        console.log(`✅ 발행자 활성화됨: ${issuer}`);
        console.log(`📝 지원 토큰들: ${MOCK_TOKENS.map(t => t.currency).join(', ')}`);

        // TrustLine 확인
        try {
          const trustLines = await this.client!.request({
            command: 'account_lines',
            account: issuer
          });
          console.log(`📊 총 TrustLines: ${trustLines.result.lines?.length || 0}`);
        } catch (trustError) {
          console.log(`⚠️ TrustLine 조회 실패`);
        }
      }
    } catch (error) {
      console.log(`❌ 발행자 비활성화됨: ${issuer}`);
      throw new Error('토큰 발행자가 활성화되지 않았습니다.');
    }
  }

  // Testnet에서 실제 사용 가능한 토큰 찾기
  async findActiveTokens(): Promise<MockToken[]> {
    console.log('🔍 Testnet에서 실제 활성화된 토큰 찾는 중...');

    const activeTokens: MockToken[] = [];

    for (const token of MOCK_TOKENS) {
      try {
        const accountInfo = await this.client!.request({
          command: 'account_info',
          account: token.issuer
        });

        if (accountInfo.result.account_data) {
          activeTokens.push(token);
          console.log(`✅ 활성 토큰 발견: ${token.currency}`);
        }
      } catch (error) {
        console.log(`❌ 비활성 토큰: ${token.currency}`);
      }
    }

    console.log(`📊 총 ${activeTokens.length}개의 활성 토큰 발견`);
    return activeTokens;
  }

  // 토큰 발행자 계정 존재 여부 검증
  async validateTokenAccounts(fromCurrency: string, toCurrency: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // 모든 토큰이 같은 발행자를 사용하므로 하나만 확인
      const issuer = 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd';
      
      // XRP가 아닌 토큰이 있는 경우에만 발행자 확인
      if (fromCurrency !== 'XRP' || toCurrency !== 'XRP') {
        try {
          await this.client!.request({
            command: 'account_info',
            account: issuer
          });
          console.log(`✅ 토큰 발행자 계정 활성화됨: ${issuer}`);
          return { valid: true };
        } catch (error) {
          console.log(`❌ 토큰 발행자 계정이 존재하지 않음: ${issuer}`);
          return { valid: false, error: `토큰 발행자 계정이 존재하지 않음: ${issuer}` };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `토큰 검증 실패: ${error}` };
    }
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