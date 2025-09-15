"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, AlertModal, useModal } from "../../components/ui";
import { TabBar } from "../../components/molecules/TabBar";
import { useWallet } from "../../hooks/useWallet";
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

  // 모달 상태 관리
  const { isOpen: isAlertOpen, openModal: openAlert, closeModal: closeAlert } = useModal();
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [alertTitle, setAlertTitle] = useState("");

  const { wallet: selectedWallet, enabledAssets } = useWallet();

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
      // 실제 XRPL AMM 풀 정보를 가져와서 견적 계산
      const fromAsset = {
        currency: fromCurrency === 'XRP' ? 'XRP' : fromCurrency,
        issuer: fromCurrency === 'XRP' ? undefined : MOCK_TOKENS.find(t => t.symbol === fromCurrency)?.issuer
      };

      const toAsset = {
        currency: toCurrency === 'XRP' ? 'XRP' : toCurrency,
        issuer: toCurrency === 'XRP' ? undefined : MOCK_TOKENS.find(t => t.symbol === toCurrency)?.issuer
      };

      // 실제 AMM 풀 정보 가져오기
      const ammInfo = await xrplAMM.getAMMInfo(fromAsset, toAsset);

      if (ammInfo) {
        const inputAmount = parseFloat(fromAmount);

        // AMM 풀 잔액으로부터 환율 계산
        const amount1 = typeof ammInfo.amount === 'string' ?
          parseFloat(ammInfo.amount) / 1000000 : // XRP drops를 XRP로 변환
          parseFloat(ammInfo.amount.value);

        const amount2 = typeof ammInfo.amount2 === 'string' ?
          parseFloat(ammInfo.amount2) / 1000000 : // XRP drops를 XRP로 변환
          parseFloat(ammInfo.amount2.value);

        // 간단한 상수곱 공식 (x * y = k)
        const outputAmount = (inputAmount * amount2) / (amount1 + inputAmount);
        const fee = outputAmount * 0.003; // 0.3% 거래수수료
        const finalOutput = outputAmount - fee;

        const quote = xrplAMM.calculateSwapQuote(
          inputAmount,
          amount1,
          amount2,
          0.003
        );

        setToAmount(finalOutput.toFixed(6));
        setPriceImpact(quote.priceImpact);
        setSwapQuote(quote);
      } else {
        // AMM 풀이 없는 경우 기본값
        console.warn('AMM 풀 정보를 가져올 수 없습니다');
        setToAmount('0');
        setSwapQuote(null);
      }
    } catch (error) {
      console.error('스왑 견적 계산 실패:', error);
      setToAmount('0');
      setSwapQuote(null);
    }
  };

  // 알럼 헬퍼 함수
  const showAlert = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', title?: string) => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertTitle(title || '');
    openAlert();
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      showAlert('올바른 금액을 입력해주세요.', 'warning', '입력 오류');
      return;
    }

    if (!selectedWallet || !selectedWallet.privateKeys?.XRP) {
      showAlert('XRP 지갑이 필요합니다.', 'error', '지갑 오류');
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

      // 지갑 설정 - mnemonic을 사용해 지갑 생성
      console.log('지갑 정보:', {
        name: selectedWallet.name,
        address: selectedWallet.addresses?.XRP,
        hasMnemonic: !!selectedWallet.mnemonic
      });

      if (!selectedWallet.mnemonic) {
        throw new Error('Mnemonic을 찾을 수 없습니다. 지갑을 다시 생성해주세요.');
      }

      const wallet = Wallet.fromMnemonic(selectedWallet.mnemonic);
      xrplAMM.setWallet(wallet);

      // USD 토큰을 받을 때 trustline 설정 확인
      if (toCurrency === 'USD') {
        console.log('USD trustline 설정 중...');
        const usdIssuer = MOCK_TOKENS.find(t => t.symbol === 'USD')?.issuer;
        if (usdIssuer) {
          const trustlineHash = await xrplAMM.createTrustLine('USD', usdIssuer, '1000000');
          if (trustlineHash) {
            console.log('✅ USD trustline 설정 완료:', trustlineHash);
          } else {
            console.log('⚠️ USD trustline 설정 실패 또는 이미 존재');
          }
        }
      }

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

      // 실제 XRPL AMM 스왑 실행
      const txHash = await xrplAMM.executeSwap(fromAsset, toAsset);

      if (txHash) {
        const successMessage = `스왑이 성공적으로 완료되었습니다!\n\n${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}\n\n트랜잭션 해시:\n${txHash.substring(0, 16)}...\n\nXRPL AMM 프로토콜을 통해 실제 스왑이 실행되었습니다.`;

        showAlert(successMessage, 'success', '🎉 스왑 완료');

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

        // 잔액 새로고침 이벤트 강제 발생
        window.dispatchEvent(new CustomEvent('assetsUpdated', {
          detail: { reason: 'swap_completed' }
        }));

        // 3초 후 홈으로 이동
        setTimeout(() => {
          router.push('/');
        }, 3000);
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

      showAlert(`스왑 처리 중 오류가 발생했습니다:\n\n${errorMessage}`, 'error', '스왑 실패');
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

      {/* 커스텀 알럼 모달 */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={closeAlert}
        message={alertMessage}
        type={alertType}
        title={alertTitle}
      />
    </div>
  );
}