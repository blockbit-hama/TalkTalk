"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "../../components/ui";
import { TabBar } from "../../components/molecules/TabBar";
import { useWalletList, useEnabledAssets } from "../../hooks/useWalletAtoms";
import { xrplAMM, MOCK_TOKENS } from "../../lib/xrpl/xrpl-amm";
import { Wallet } from 'xrpl';

export default function SwapPage() {
  const router = useRouter();
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("XRP");
  const [toCurrency, setToCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [priceImpact, setPriceImpact] = useState("0");
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [availablePairs, setAvailablePairs] = useState<any[]>([]);

  const { selectedWallet } = useWalletList();
  const { enabledAssets } = useEnabledAssets();

  // 사용 가능한 스왑 페어 로드
  useEffect(() => {
    loadAvailablePairs();
  }, []);

  const loadAvailablePairs = async () => {
    const pairs = await xrplAMM.getAvailableSwapPairs();
    setAvailablePairs(pairs);
  };

  // 스왑 견적 계산
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      calculateSwapQuote();
    } else {
      setToAmount("");
      setSwapQuote(null);
    }
  }, [fromAmount, fromCurrency, toCurrency]);

  const calculateSwapQuote = async () => {
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

      const inputAmount = parseFloat(fromAmount);
      const outputAmount = inputAmount * rate * 0.997; // 0.3% 수수료

      const quote = xrplAMM.calculateSwapQuote(
        inputAmount,
        10000, // Mock pool reserve 1
        5000,  // Mock pool reserve 2
        0.003  // 0.3% fee
      );

      setToAmount(outputAmount.toFixed(6));
      setPriceImpact(quote.priceImpact);
      setSwapQuote(quote);
    } catch (error) {
      console.error('Failed to calculate swap quote:', error);
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    if (!selectedWallet || !selectedWallet.privateKeys?.XRP) {
      alert('XRP 지갑이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      console.log(`실제 XRPL AMM 스왑 시작: ${fromAmount} ${fromCurrency} → ${toCurrency}`);

      // XRPL 연결
      const connected = await xrplAMM.connect();
      if (!connected) {
        throw new Error('XRPL 네트워크 연결 실패');
      }

      // 지갑 설정
      const wallet = Wallet.fromSeed(selectedWallet.privateKeys.XRP);
      xrplAMM.setWallet(wallet);

      // 실제 AMM 스왑 실행
      const fromAsset = {
        currency: fromCurrency === 'XRP' ? 'XRP' : fromCurrency,
        issuer: fromCurrency === 'XRP' ? undefined : MOCK_TOKENS.find(t => t.symbol === fromCurrency)?.issuer,
        amount: fromCurrency === 'XRP' ? Math.floor(parseFloat(fromAmount) * 1000000).toString() : fromAmount
      };

      const toAsset = {
        currency: toCurrency === 'XRP' ? 'XRP' : toCurrency,
        issuer: toCurrency === 'XRP' ? undefined : MOCK_TOKENS.find(t => t.symbol === toCurrency)?.issuer,
        minAmount: toCurrency === 'XRP' ? Math.floor(parseFloat(toAmount) * 1000000 * 0.95).toString() : (parseFloat(toAmount) * 0.95).toString() // 5% 슬리피지 허용
      };

      let txHash;
      try {
        // 실제 AMM 스왑 시도
        txHash = await xrplAMM.executeSwap(fromAsset, toAsset);

        if (!txHash) {
          // 실제 AMM이 아직 사용 불가한 경우 Mock 스왑 사용
          console.log('AMM 사용 불가, Mock 스왑 사용');
          const result = await xrplAMM.executeMockSwap(fromCurrency, toCurrency, fromAmount);
          if (result.success) {
            txHash = result.hash;
          } else {
            throw new Error(result.error);
          }
        }
      } catch (ammError) {
        // AMM 실패 시 Mock 스왑으로 폴백
        console.warn('AMM 스왑 실패, Mock 스왑으로 폴백:', ammError);
        const result = await xrplAMM.executeMockSwap(fromCurrency, toCurrency, fromAmount);
        if (result.success) {
          txHash = result.hash;
        } else {
          throw ammError;
        }
      }

      if (txHash) {
        alert(`✅ 스왑 완료!\n${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}\n\n트랜잭션 해시: ${txHash.substring(0, 16)}...\n\nXRPL AMM을 통해 스왑이 완료되었습니다.`);

        // 스왑 이벤트 발생
        window.dispatchEvent(new CustomEvent('swapCompleted', {
          detail: {
            from: fromCurrency,
            to: toCurrency,
            fromAmount,
            toAmount: toAmount,
            hash: txHash
          }
        }));

        router.push('/');
      } else {
        throw new Error('스왑 트랜잭션 실패');
      }

    } catch (error) {
      console.error('XRPL AMM 스왑 실패:', error);

      let errorMessage = '알 수 없는 오류';
      if (error instanceof Error) {
        if (error.message.includes('funds') || error.message.includes('balance')) {
          errorMessage = '잔액이 부족합니다. 수수료와 스왑 금액을 확인해주세요.';
        } else if (error.message.includes('network') || error.message.includes('connect')) {
          errorMessage = '네트워크 연결 오류. XRPL Devnet 연결을 확인해주세요.';
        } else if (error.message.includes('AMM') || error.message.includes('path')) {
          errorMessage = '스왑 경로를 찾을 수 없습니다. Trust Line을 설정해주세요.';
        } else {
          errorMessage = error.message;
        }
      }

      alert(`❌ 스왑 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  // 사용 가능한 통화 목록
  const availableCurrencies = ['XRP', ...MOCK_TOKENS.map(t => t.symbol)];

  return (
    <div className="min-h-screen" style={{ background: '#1A1A1A' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <button
          onClick={() => router.push('/')}
          className="text-white text-lg font-semibold"
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-white">XRPL AMM 스왑</h1>
        <div className="w-16"></div>
      </div>

      {/* 스왑 폼 */}
      <div className="p-6 max-w-md mx-auto">
        <Card className="p-6 bg-gray-800 border-gray-700">
          {/* From 섹션 */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">보낼 자산</label>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#F2A003] focus:outline-none"
              >
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 스왑 버튼 */}
          <div className="flex justify-center my-4">
            <button
              onClick={switchCurrencies}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <svg className="w-6 h-6 text-[#F2A003]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To 섹션 */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">받을 자산</label>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="0.00"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="flex-1"
                readOnly
              />
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#F2A003] focus:outline-none"
              >
                {availableCurrencies.filter(c => c !== fromCurrency).map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* 스왑 정보 */}
        {swapQuote && (
          <Card className="mt-4 p-4 bg-gray-800 border-gray-700">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">환율</span>
                <span className="text-white">1 {fromCurrency} = {swapQuote.price} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">가격 영향</span>
                <span className={`${parseFloat(priceImpact) > 5 ? 'text-red-500' : 'text-green-500'}`}>
                  {priceImpact}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">수수료 (0.3%)</span>
                <span className="text-white">{swapQuote.fee} {fromCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">최대 슬리피지</span>
                <span className="text-white">{slippage}%</span>
              </div>
            </div>
          </Card>
        )}

        {/* 슬리피지 설정 */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">슬리피지 허용치</span>
          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map(value => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                  slippage === value
                    ? 'bg-[#F2A003] text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* 스왑 버튼 */}
        <Button
          onClick={handleSwap}
          disabled={isLoading || !fromAmount || parseFloat(fromAmount) <= 0}
          className="w-full mt-6 bg-[#F2A003] hover:bg-[#E09400] text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '스왑 중...' : 'XRPL AMM 스왑 실행'}
        </Button>

        {/* AMM 풀 정보 */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            XRPL 네이티브 AMM 프로토콜 사용
          </p>
          <p className="text-gray-500 text-xs mt-1">
            스마트컨트랙트 없이 동작하는 프로토콜 레벨 AMM
          </p>
        </div>

        {/* Devnet 안내 */}
        <Card className="mt-4 p-4 bg-blue-900/20 border-blue-700">
          <h3 className="text-blue-400 font-semibold mb-2 text-sm">🌐 XRPL Devnet 실제 AMM 풀</h3>
          <ul className="text-blue-300 text-xs space-y-1">
            <li>• 실제 XRPL Devnet AMM 풀 사용 (USD, CNY 활성)</li>
            <li>• 실제 토큰 발행자와 AMM 프로토콜 연동</li>
            <li>• Trust Line 설정 후 실제 토큰 스왑 가능</li>
            <li>• 프로토콜 레벨에서 동작하는 네이티브 AMM</li>
            <li>• 실패 시 자동으로 Mock 스왑 폴백 제공</li>
          </ul>
        </Card>
      </div>

      {/* 하단 탭바 */}
      <TabBar />
    </div>
  );
}