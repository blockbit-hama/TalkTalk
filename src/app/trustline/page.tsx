"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "../../components/ui";
import { useWallet } from "../../hooks/useWallet";
import { xrplAMM } from "../../lib/xrpl/xrpl-amm";
import { Wallet } from 'xrpl';

interface TestnetToken {
  currency: string;
  issuer: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface TrustLineStatus {
  token: TestnetToken;
  isSet: boolean;
  isLoading: boolean;
}

// XRPL Testnet 실제 토큰 (TST만)
const TESTNET_TOKENS: TestnetToken[] = [
  {
    currency: 'TST',
    issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd', // Testnet TST 토큰
    name: '테스트 토큰 (TST)',
    symbol: 'TST',
    decimals: 6
  }
];

export default function TrustLinePage() {
  const router = useRouter();
  const { wallet: selectedWallet, getPrivateKeyFromRedis } = useWallet();
  const [trustLines, setTrustLines] = useState<TrustLineStatus[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    initializeTrustLines();
  }, [selectedWallet]);

  const initializeTrustLines = () => {
    const initialStatus = TESTNET_TOKENS.map(token => ({
      token,
      isSet: false, // 실제로는 XRPL에서 확인해야 함
      isLoading: false
    }));
    setTrustLines(initialStatus);
  };

  const handleSetTrustLine = async (token: TestnetToken) => {
    if (!selectedWallet || !selectedWallet.phoneNumber) {
      alert('XRP 지갑이 필요합니다.');
      return;
    }

    setTrustLines(prev => prev.map(tl =>
      tl.token.currency === token.currency
        ? { ...tl, isLoading: true }
        : tl
    ));

    try {
      console.log(`실제 Trust Line 설정 시작: ${token.currency} from ${token.issuer}`);

      // XRPL 연결
      if (!isConnecting) {
        setIsConnecting(true);
        const connected = await xrplAMM.connect();
        setIsConnecting(false);

        if (!connected) {
          throw new Error('XRPL 네트워크 연결 실패');
        }
      }

      // Redis에서 개인키 가져오기
      const privateKey = await getPrivateKeyFromRedis(selectedWallet.phoneNumber);
      if (!privateKey) {
        throw new Error('지갑 개인키를 가져올 수 없습니다.');
      }

      // 지갑 설정
      const wallet = Wallet.fromSeed(privateKey);
      xrplAMM.setWallet(wallet);

      // 실제 Trust Line 설정
      const txHash = await xrplAMM.createTrustLine(
        token.currency,
        token.issuer,
        '1000000' // 1M 토큰 한도
      );

      if (txHash) {
        console.log(`Trust Line 설정 성공: ${txHash}`);

        setTrustLines(prev => prev.map(tl =>
          tl.token.currency === token.currency
            ? { ...tl, isSet: true, isLoading: false }
            : tl
        ));

        alert(`✅ ${token.name} Trust Line 설정 완료!\n\n트랜잭션 해시: ${txHash.substring(0, 16)}...\n\n이제 해당 토큰을 받을 수 있습니다.`);

        // 자산 추가 페이지로 자동 이동
        setTimeout(() => {
          router.push('/add-assets');
        }, 2000);
      } else {
        throw new Error('Trust Line 설정 트랜잭션 실패');
      }

    } catch (error) {
      console.error('Trust Line 설정 실패:', error);

      let errorMessage = '알 수 없는 오류';
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = '네트워크 연결 오류. Testnet 연결을 확인해주세요.';
        } else if (error.message.includes('funds')) {
          errorMessage = 'XRP 잔액이 부족합니다. 수수료와 예약금이 필요합니다.';
        } else {
          errorMessage = error.message;
        }
      }

      alert(`❌ Trust Line 설정 실패: ${errorMessage}`);

      setTrustLines(prev => prev.map(tl =>
        tl.token.currency === token.currency
          ? { ...tl, isLoading: false }
          : tl
      ));
    }
  };

  const handleSetAllTrustLines = async () => {
    for (const token of TESTNET_TOKENS) {
      if (!trustLines.find(tl => tl.token.currency === token.currency)?.isSet) {
        await handleSetTrustLine(token);
      }
    }
  };

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
        <h1 className="text-xl font-bold text-white">Trust Line 설정</h1>
        <div className="w-16"></div>
      </div>

      {/* 설명 */}
      <div className="p-6">
        <Card className="p-4 bg-gray-800 border-gray-700 mb-6">
          <h2 className="text-white font-semibold mb-2">Trust Line이란?</h2>
          <p className="text-gray-400 text-sm">
            XRPL에서 XRP 이외의 토큰을 받기 위해서는 해당 토큰 발행자에 대한 Trust Line을 설정해야 합니다.
            Trust Line은 특정 발행자로부터 특정 토큰을 얼마까지 받을 것인지 설정하는 신뢰 관계입니다.
          </p>
        </Card>

        {/* Mock 토큰 리스트 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">사용 가능한 토큰</h3>
            <Button
              onClick={handleSetAllTrustLines}
              className="bg-[#F2A003] hover:bg-[#E09400] text-white px-4 py-2 rounded-lg text-sm"
            >
              모두 설정
            </Button>
          </div>

          {trustLines.map((trustLine) => (
            <Card key={trustLine.token.currency} className="p-4 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* 토큰 아이콘 */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    {trustLine.token.symbol}
                  </div>

                  {/* 토큰 정보 */}
                  <div>
                    <div className="text-white font-semibold">{trustLine.token.name}</div>
                    <div className="text-gray-400 text-sm">
                      Currency: {trustLine.token.currency}
                    </div>
                    <div className="text-gray-500 text-xs font-mono">
                      Issuer: {trustLine.token.issuer.substring(0, 8)}...
                    </div>
                  </div>
                </div>

                {/* 설정 버튼 */}
                <div>
                  {trustLine.isSet ? (
                    <div className="text-green-500 text-sm font-semibold">
                      ✅ 설정됨
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSetTrustLine(trustLine.token)}
                      disabled={trustLine.isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      {trustLine.isLoading ? '설정 중...' : 'Trust Line 설정'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 주의사항 */}
        <Card className="mt-6 p-4 bg-yellow-900/20 border-yellow-700">
          <h3 className="text-yellow-500 font-semibold mb-2">⚠️ 주의사항</h3>
          <ul className="text-yellow-400 text-sm space-y-1">
            <li>• Trust Line 설정에는 약간의 XRP 수수료가 필요합니다 (약 0.000012 XRP)</li>
            <li>• Trust Line을 설정하면 해당 토큰을 받을 수 있습니다</li>
            <li>• 각 Trust Line은 계정 예약금을 증가시킵니다 (2 XRP)</li>
            <li>• 신뢰할 수 있는 발행자에게만 Trust Line을 설정하세요</li>
          </ul>
        </Card>

        {/* Testnet 안내 */}
        <Card className="mt-4 p-4 bg-blue-900/20 border-blue-700">
          <h3 className="text-blue-400 font-semibold mb-2">🌐 XRPL Testnet 실제 토큰 연동</h3>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• 실제 XRPL Testnet 토큰 발행자와 Trust Line 설정</li>
            <li>• TST는 실제 Testnet에서 작동하는 토큰입니다</li>
            <li>• 설정 후 실제 XRPL 네트워크에서 토큰 송수신 가능</li>
            <li>• 모든 Trust Line은 XRPL Explorer에서 확인 가능</li>
            <li>• Faucet으로 XRP 충전 후 토큰 수신 테스트 가능</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}