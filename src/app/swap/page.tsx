"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, AlertModal, useModal } from "../../components/ui";
import { TabBar } from "../../components/molecules/TabBar";
import { useWallet } from "../../hooks/useWallet";
import { xrplAMMV2, SwapRequest, SwapResult } from "../../lib/xrpl/xrpl-amm-v2";
import { Wallet } from 'xrpl';

// Devnet에서 작동하는 토큰만 정의
const DEVNET_TOKENS = [
  {
    currency: 'TST',
    issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
    name: '테스트 토큰 (TST)',
    symbol: 'TST',
    decimals: 6
  }
];

export default function SwapPage() {
  const router = useRouter();
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("XRP");
  const [toCurrency, setToCurrency] = useState("TST");
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

  // 사용 가능한 스왑 페어 로드 및 네트워크 초기화
  useEffect(() => {
    initializeNetwork();
    loadAvailablePairs();
  }, []);

  const initializeNetwork = async () => {
    try {
      console.log('🔌 XRPL 네트워크 초기화 시작...');
      // 네트워크 연결 상태 확인 및 초기화
      const { xrplClient } = await import('../../lib/xrpl/xrpl-client');
      if (!xrplClient.isConnected()) {
        const connected = await xrplClient.connect();
        if (connected) {
          console.log('✅ XRPL 네트워크 초기화 완료');
        } else {
          console.error('❌ XRPL 네트워크 초기화 실패');
        }
      } else {
        console.log('✅ XRPL 네트워크 이미 연결됨');
      }
    } catch (error) {
      console.error('❌ 네트워크 초기화 오류:', error);
    }
  };

  const loadAvailablePairs = async () => {
    // 먼저 사용 가능한 토큰 확인
    await xrplAMMV2.checkAvailableTokens();
    
    // 실제 활성화된 토큰 찾기
    const activeTokens = await xrplAMMV2.findActiveTokens();
    console.log('🎯 활성화된 토큰들:', activeTokens.map(t => t.currency));
    
    if (activeTokens.length === 0) {
      console.log('💡 실제 토큰이 없으므로 Mock 모드로 스왑을 진행합니다.');
    }
    
    const pairs = await xrplAMMV2.getAvailableSwapPairs();
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
      console.log('💰 스왅 견적 계산 시작');

      // XRP-TST 간단한 견적 (1 XRP = 100 TST 예시)
      const rate = fromCurrency === 'XRP' ? 100 : 0.01;
      const outputAmount = (parseFloat(fromAmount) * rate).toFixed(6);

      setToAmount(outputAmount);
      setPriceImpact('0.5');
      setSwapQuote({
        inputAmount: fromAmount,
        outputAmount: outputAmount,
        price: rate.toString(),
        priceImpact: '0.5',
        fee: '0.001',
        slippage: slippage
      });

      console.log('✅ 스왑 견적 계산 완료:', { fromAmount, outputAmount, rate });
    } catch (error) {
      console.error('❌ 스왑 견적 계산 실패:', error);
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

    if (!selectedWallet) {
      showAlert('지갑을 선택해주세요.', 'warning', '지갑 오류');
      return;
    }

    setIsLoading(true);

    try {
      console.log(`🔄 표준 방식 XRPL AMM 스왑 시작: ${fromAmount} ${fromCurrency} → ${toCurrency}`);

      // 현재 사용자의 전화번호 가져오기
      const userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
      if (!userPhoneNumber) {
        alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // Redis에서 개인키 가져오기
      const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(userPhoneNumber)}`);
      const userResult = await response.json();
      
      if (!response.ok || !userResult.success || !userResult.user?.privateKey) {
        alert('개인키를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 표준 방식으로 지갑 설정
      await xrplAMMV2.setWallet(userResult.user.privateKey);

      // 네트워크 연결 상태 확인
      const { xrplClient } = await import('../../lib/xrpl/xrpl-client');
      if (!xrplClient.isConnected()) {
        console.log('🔌 스왑 전 네트워크 연결 확인...');
        const connected = await xrplClient.connect();
        if (!connected) {
          throw new Error('XRPL 네트워크 연결에 실패했습니다.');
        }
        console.log('✅ 스왑 전 네트워크 연결 완료');
      }

      // 표준 방식 스왑 요청 생성
      const swapRequest: SwapRequest = {
        fromCurrency,
        toCurrency,
        fromAmount,
        minAmount: (parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toString(), // 슬리피지 고려
        slippage: parseFloat(slippage)
      };

      console.log('📦 표준 방식 스왑 요청:', swapRequest);

      // 표준 방식 스왑 실행
      const result: SwapResult = await xrplAMMV2.executeSwap(swapRequest);

      if (result.success) {
        const successMessage = `표준 방식 스왑이 성공적으로 완료되었습니다!\n\n${result.actualFromAmount} ${fromCurrency} → ${result.actualToAmount} ${toCurrency}\n\n트랜잭션 해시:\n${result.transactionHash?.substring(0, 16)}...\n\nXRPL 표준 예제 기반 AMM 프로토콜을 통해 실제 스왑이 실행되었습니다.`;

        showAlert(successMessage, 'success', '🎉 표준 방식 스왑 완료');

        // 스왑 이벤트 발생
        window.dispatchEvent(new CustomEvent('swapCompleted', {
          detail: {
            from: fromCurrency,
            to: toCurrency,
            fromAmount: result.actualFromAmount,
            toAmount: result.actualToAmount,
            hash: result.transactionHash,
            method: 'standard'
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
        throw new Error(result.error || '스왑 트랜잭션 실패');
      }

    } catch (error) {
      console.error('❌ 표준 방식 XRPL AMM 스왑 실패:', error);

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

      showAlert(`표준 방식 스왑 처리 중 오류가 발생했습니다:\n\n${errorMessage}`, 'error', '표준 방식 스왑 실패');
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
  const availableCurrencies = ['XRP', ...DEVNET_TOKENS.map(t => t.symbol)];

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
        <h1 className="text-xl font-bold text-white">XRPL AMM 스왑 (표준)</h1>
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
          {isLoading ? '스왑 중...' : 'XRPL 표준 방식 스왑 실행'}
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
            <li>• 실제 XRPL Devnet AMM 풀 사용 (DALLAR, KRW 활성)</li>
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