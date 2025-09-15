"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useMasterAddress } from "../hooks/wallet/useMasterAddress";
import { CustomSelect } from "../components/molecules/CustomSelect";
import { useRouter } from "next/navigation";
import { TabBar } from "../components/molecules/TabBar";
import { cn } from '@/lib/utils/utils';
import { useWalletList, useEnabledAssets } from "../hooks/useWalletAtoms";
import { useWalletBalance } from "../hooks/queries/useWalletBalance";
import { Button, Input, Card } from "../components/ui";
import { useQueryClient } from '@tanstack/react-query';
import { regenerateAllWalletPrivateKeys, createTestWalletIfNotExists, getNextEthAddressPath, getNextAccountPath } from "../lib/wallet-utils";
import { useWallet } from "../hooks/wallet/useWallet";
import { xrplFaucet } from "../lib/xrpl/xrpl-faucet";
import { xrplClient } from "../lib/xrpl/xrpl-client";

// 더 세련된 코인 SVG 아이콘들 (gradient, 입체감, 라인 등)
const XrpIcon = ({ size = 54 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="xrpG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff7d1"/>
        <stop offset="100%" stopColor="#23292F"/>
      </radialGradient>
    </defs>
    <circle cx="27" cy="27" r="27" fill="#1B1C22"/>
    <circle cx="27" cy="27" r="22" fill="url(#xrpG)"/>
    <text x="27" y="36" textAnchor="middle" fontWeight="bold" fontSize={size * 0.45} fill="#fff" fontFamily="monospace" style={{filter:'drop-shadow(0 1px 2px #0008)'}}>X</text>
  </svg>
);
const BtcIcon = ({ size = 54 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="btcG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff7d1"/>
        <stop offset="100%" stopColor="#F7931A"/>
      </radialGradient>
    </defs>
    <circle cx="27" cy="27" r="27" fill="#1B1C22"/>
    <circle cx="27" cy="27" r="22" fill="url(#btcG)"/>
    <text x="27" y="36" textAnchor="middle" fontWeight="bold" fontSize={size * 0.45} fill="#fff" fontFamily="monospace" style={{filter:'drop-shadow(0 1px 2px #0008)'}}>₿</text>
  </svg>
);
const EthIcon = ({ size = 54 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ethG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#B2BFFF"/>
        <stop offset="100%" stopColor="#627EEA"/>
      </linearGradient>
    </defs>
    <circle cx="27" cy="27" r="27" fill="#1B1C22"/>
    <circle cx="27" cy="27" r="22" fill="url(#ethG)"/>
    <polygon points="27,12 39,27 27,48 15,27" fill="#fff"/>
    <polygon points="27,12 27,36 39,27" fill="#B2BFFF"/>
    <polygon points="27,12 27,36 15,27" fill="#627EEA"/>
  </svg>
);
const UsdtIcon = ({ size = 54 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="usdtG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#baffd7"/>
        <stop offset="100%" stopColor="#26A17B"/>
      </radialGradient>
    </defs>
    <circle cx="27" cy="27" r="27" fill="#1B1C22"/>
    <circle cx="27" cy="27" r="22" fill="url(#usdtG)"/>
    <text x="27" y="36" textAnchor="middle" fontWeight="bold" fontSize={size * 0.38} fill="#fff" fontFamily="monospace" style={{filter:'drop-shadow(0 1px 2px #0008)'}}>$</text>
  </svg>
);

const BaseIcon = ({ size = 54 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="baseG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0052FF"/>
        <stop offset="100%" stopColor="#4C5BB3"/>
      </linearGradient>
    </defs>
    <circle cx="27" cy="27" r="27" fill="#1B1C22"/>
    <circle cx="27" cy="27" r="22" fill="url(#baseG)"/>
    <text x="27" y="36" textAnchor="middle" fontWeight="bold" fontSize={size * 0.45} fill="#fff" fontFamily="monospace" style={{filter:'drop-shadow(0 1px 2px #0008)'}}>B</text>
  </svg>
);

// QR 코드 SVG 아이콘 (단순한 [=] 스타일)
const QrIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 왼쪽 세로선 */}
    <rect x="8" y="6" width="2" height="20" fill="#F2A003"/>
    <rect x="12" y="6" width="2" height="20" fill="#F2A003"/>
    <rect x="16" y="6" width="2" height="20" fill="#F2A003"/>
    
    {/* 오른쪽 세로선 */}
    <rect x="22" y="6" width="2" height="20" fill="#F2A003"/>
    <rect x="26" y="6" width="2" height="20" fill="#F2A003"/>
  </svg>
);

// Coin 타입 정의
interface Coin {
  symbol: string;
  name: string;
  amount: string;
  usd: string;
  change: string;
  changeColor: string;
  subAmount: string;
  subUsd: string;
}

// 전송, 수신, 스왑 버튼용 세련된 아이콘
const SwapIcon = ({ size = 32, color = '#F2A003' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 20H24M24 20L20 24M24 20L20 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 12H8M8 12L12 8M8 12L12 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Home() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [balanceType, setBalanceType] = useState<'잔액' | 'NFT'>('잔액');
  const balanceOptions = ['잔액', 'NFT'] as const;
  
  // useMasterAddress 훅 사용
  const { masterAddress } = useMasterAddress();

  // React Query 클라이언트
  const queryClient = useQueryClient();
  
  // 지갑 관련 hooks
  const { generateNewAssetKey } = useWallet();

  // 새로운 atoms hooks 사용
  const {
    walletList,
    selectedWallet,
    selectedWalletId,
    setSelectedWalletId,
    isLoading: isWalletListLoading,
    loadWallets,
    refreshWalletList
  } = useWalletList();

  const {
    enabledAssets,
    loadEnabledAssets
  } = useEnabledAssets();

  // XRPL 자산 잔액 데이터 가져오기
  const xrpBalance = useWalletBalance(
    selectedWallet?.addresses.XRP || '', 
    'XRP'
  );
  const mock1Balance = useWalletBalance(
    selectedWallet?.addresses.MOCK1 || '', 
    'MOCK1'
  );
  const mock2Balance = useWalletBalance(
    selectedWallet?.addresses.MOCK2 || '', 
    'MOCK2'
  );

  // 잔액 데이터 캐시 무효화 함수
  const invalidateBalanceCache = () => {
    queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
    console.log('잔액 캐시 무효화 완료');
  };

  // 총 달러 금액 계산 (XRPL 자산들의 합계)
  const calculateTotalUSD = () => {
    if (!selectedWallet || !enabledAssets.length) return 0;
    
    let total = 0;
    
    // XRPL 자산들의 USD 가치 합계
    if (enabledAssets.includes('XRP') && xrpBalance.data) {
      const xrpValue = parseFloat(xrpBalance.data.usdValue.replace('$', '').replace(',', ''));
      total += xrpValue;
    }
    
    if (enabledAssets.includes('MOCK1') && mock1Balance.data) {
      const mock1Value = parseFloat(mock1Balance.data.usdValue.replace('$', '').replace(',', ''));
      total += mock1Value;
    }
    
    if (enabledAssets.includes('MOCK2') && mock2Balance.data) {
      const mock2Value = parseFloat(mock2Balance.data.usdValue.replace('$', '').replace(',', ''));
      total += mock2Value;
    }
    
    return total;
  };

  const totalUSD = calculateTotalUSD();

  // 활성화된 자산들에 대한 주소가 모두 존재하는지 확인하고 누락된 것들을 생성
  const ensureAllAddressesExist = async () => {
    try {
      console.log('=== 주소 생성 확인 시작 ===');
      
      // localStorage에서 현재 활성화된 자산들 가져오기
      const savedEnabledAssets = localStorage.getItem('enabledAssets');
      if (!savedEnabledAssets) {
        console.log('활성화된 자산이 없음');
        return;
      }
      
      const enabledAssets = JSON.parse(savedEnabledAssets);
      const enabledSymbols = enabledAssets.map((asset: any) => asset.symbol);
      console.log('활성화된 자산들:', enabledSymbols);
      
      // 현재 지갑들 가져오기
      const wallets = JSON.parse(localStorage.getItem('hdWallets') || '[]');
      console.log('전체 지갑 수:', wallets.length);
      
      let walletsUpdated = false;
      
      // 각 지갑에 대해 누락된 주소들을 생성
      for (const wallet of wallets) {
        console.log(`\n--- ${wallet.name} (${wallet.id}) 주소 확인 ---`);
        
        if (!wallet.addresses) wallet.addresses = {};
        if (!wallet.privateKeys) wallet.privateKeys = {};
        
        const missingAssets = enabledSymbols.filter(symbol => !wallet.addresses[symbol]);
        console.log('누락된 자산들:', missingAssets);
        
        for (const symbol of missingAssets) {
          try {
            console.log(`${symbol} 주소 생성 중...`);

            // XRPL 토큰들은 XRP 주소와 동일한 주소를 사용
            if (['USD', 'CNY', 'EUR', 'TST'].includes(symbol)) {
              if (wallet.addresses.XRP && wallet.privateKeys.XRP) {
                wallet.addresses[symbol] = wallet.addresses.XRP;
                wallet.privateKeys[symbol] = wallet.privateKeys.XRP;
                walletsUpdated = true;
                console.log(`✅ ${symbol} 주소 설정 완료 (XRP 주소 공유): ${wallet.addresses.XRP.substring(0, 10)}...`);
              } else {
                console.error(`❌ ${symbol} 주소 설정 실패: XRP 주소가 없음`);
              }
              continue;
            }

            // 다른 체인 토큰들 (더 이상 사용하지 않으므로 스킵)
            if (symbol.includes('ETH') || symbol.includes('SOL') || symbol.includes('BASE')) {
              console.log(`${symbol}은 XRPL 전용 지갑에서 지원하지 않습니다.`);
              continue;
            }

            // XRP의 경우만 실제 주소 생성
            if (symbol === 'XRP') {
              const newAssetKey = await generateNewAssetKey(symbol, "m/44'/144'/0'/0/0");

              if (newAssetKey) {
                wallet.addresses[symbol] = newAssetKey.address;
                wallet.privateKeys[symbol] = newAssetKey.privateKey;
                walletsUpdated = true;
                console.log(`✅ ${symbol} 주소 생성 완료: ${newAssetKey.address.substring(0, 10)}...`);
              } else {
                console.error(`❌ ${symbol} 주소 생성 실패`);
              }
            }
          } catch (error) {
            console.error(`❌ ${symbol} 주소 생성 중 오류:`, error);
          }
        }
      }
      
      // 업데이트된 지갑 정보 저장
      if (walletsUpdated) {
        localStorage.setItem('hdWallets', JSON.stringify(wallets));
        console.log('✅ 지갑 정보 업데이트 완료');
      } else {
        console.log('✅ 모든 주소가 이미 존재함');
      }
      
      console.log('=== 주소 생성 확인 완료 ===\n');
    } catch (error) {
      console.error('주소 생성 확인 중 오류:', error);
    }
  };

  // 디버깅용 로그
  console.log('메인 화면 상태:', {
    enabledAssets,
    selectedWallet: selectedWallet ? {
      id: selectedWallet.id,
      addresses: selectedWallet.addresses
    } : null
  });

  // localStorage 디버깅
  if (typeof window !== 'undefined') {
    const savedEnabledAssets = localStorage.getItem('enabledAssets');
    console.log('localStorage 저장된 자산:', savedEnabledAssets);
    if (savedEnabledAssets) {
      try {
        const parsed = JSON.parse(savedEnabledAssets);
        console.log('파싱된 저장 자산:', parsed);
        console.log('자산 심볼들:', parsed.map((a: any) => a.symbol));
      } catch (error) {
        console.error('localStorage 파싱 오류:', error);
      }
    }
  }

  // HD Wallet 목록 로드 및 솔라나 마이그레이션
  useEffect(() => {
    const initializeApp = async () => {
      // test-wallet 생성 (없으면 생성)
      try {
        console.log('=== test-wallet 생성 함수 호출 시작 ===');
        const testWalletCreated = await createTestWalletIfNotExists();
        console.log('test-wallet 생성 결과:', testWalletCreated);
        console.log('=== test-wallet 생성 함수 호출 완료 ===');
        
        // test-wallet이 생성되었다면 즉시 지갑 목록과 활성화된 자산을 새로고침
        if (testWalletCreated) {
          console.log('test-wallet 생성됨, 상태 새로고침 중...');
          // 약간의 지연을 주어 localStorage 업데이트가 완료되도록 함
          await new Promise(resolve => setTimeout(resolve, 100));
          loadWallets();
          loadEnabledAssets();
        }
      } catch (error) {
        console.error('test-wallet 생성 실패:', error);
      }
      
      // XRPL 자산 확인 및 주소 생성
      console.log('XRPL 자산 확인 완료');
      
      // 활성화된 자산들에 대한 주소 생성 (누락된 주소들 자동 생성)
      try {
        await ensureAllAddressesExist();
      } catch (error) {
        console.error('주소 생성 실패:', error);
      }
      
      // 최종 지갑 목록 로드
      loadWallets();
      loadEnabledAssets();
    };
    
    initializeApp();
  }, []);

  // Faucet 관련 상태
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  // Faucet 요청 함수
  const handleFaucetRequest = async () => {
    if (!selectedWallet?.addresses.XRP) {
      alert('XRP 주소를 찾을 수 없습니다.');
      return;
    }

    setIsFaucetLoading(true);
    try {
      console.log('Faucet 요청 시작:', selectedWallet.addresses.XRP);

      // Faucet 가용성 확인
      const availability = await xrplFaucet.checkFaucetAvailability(selectedWallet.addresses.XRP);

      if (!availability.available) {
        if (availability.remainingTime) {
          const hours = Math.ceil(availability.remainingTime / (1000 * 60 * 60));
          alert(`Faucet 한도 초과: ${hours}시간 후 다시 시도해주세요.`);
        } else {
          alert(`Faucet 사용 불가: ${availability.reason}`);
        }
        return;
      }

      // Devnet Faucet 요청
      const result = await xrplFaucet.requestDevnetXRP(selectedWallet.addresses.XRP);

      if (result.success) {
        // Faucet 사용 기록
        xrplFaucet.recordFaucetUsage(selectedWallet.addresses.XRP);

        alert(`✅ Faucet 성공!\n1000 XRP가 충전되었습니다.\n잔액: ${result.balance} drops`);

        // 잔액 새로고침
        invalidateBalanceCache();
      } else {
        alert(`❌ Faucet 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Faucet 요청 오류:', error);
      alert('Faucet 요청 중 오류가 발생했습니다.');
    } finally {
      setIsFaucetLoading(false);
    }
  };

  // 활성화된 자산 로드
  useEffect(() => {
    loadEnabledAssets();
  }, []);

  // 디버깅용 useEffect
  useEffect(() => {
    if (selectedWallet) {
      console.log('선택된 지갑:', selectedWallet);
      console.log('활성화된 자산:', enabledAssets);
      console.log('모든 주소들:', selectedWallet.addresses);
      
      // XRPL 자산 상태 확인
      const xrplAssets = ['XRP', 'MOCK1', 'MOCK2'];
      xrplAssets.forEach(symbol => {
        console.log(`${symbol} 주소:`, selectedWallet.addresses[symbol]);
        console.log(`${symbol} 활성화됨:`, enabledAssets.includes(symbol));
      });
      
      // 잔액 데이터 디버깅
      console.log('XRP 잔액 데이터:', xrpBalance.data);
      console.log('MOCK1 잔액 데이터:', mock1Balance.data);
      console.log('MOCK2 잔액 데이터:', mock2Balance.data);
    }
      }, [selectedWallet, enabledAssets, xrpBalance.data, mock1Balance.data, mock2Balance.data]);

  // assetsUpdated 이벤트 수신
  useEffect(() => {
    const handleAssetsUpdated = (event: CustomEvent) => {
      console.log('자산 업데이트 이벤트 수신:', event.detail);
      // 이벤트는 useEnabledAssets hook에서 처리됨
    };

    const handleWalletsUpdated = () => {
      console.log('지갑 업데이트 이벤트 수신');
      refreshWalletList();
      loadEnabledAssets();
    };

    window.addEventListener('assetsUpdated', handleAssetsUpdated as EventListener);
    window.addEventListener('walletsUpdated', handleWalletsUpdated as EventListener);
    return () => {
      window.removeEventListener('assetsUpdated', handleAssetsUpdated as EventListener);
      window.removeEventListener('walletsUpdated', handleWalletsUpdated as EventListener);
    };
  }, []);

  // 전송 완료 이벤트 수신하여 잔액 새로고침
  useEffect(() => {
    const handleTransferCompleted = (event: CustomEvent) => {
      console.log('전송 완료 이벤트 수신:', event.detail);
      
      // 캐시 무효화로 모든 잔액 데이터 새로고침
      invalidateBalanceCache();
      
    };

    window.addEventListener('transferCompleted', handleTransferCompleted as EventListener);
    return () => {
      window.removeEventListener('transferCompleted', handleTransferCompleted as EventListener);
    };
  }, [masterAddress]);

  // 페이지 포커스 시 지갑 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      refreshWalletList();
      loadEnabledAssets(); // 활성화된 자산도 다시 로드
      
      // 캐시 무효화로 잔액 데이터 새로고침
      invalidateBalanceCache();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 라우터 변경 시 잔액 새로고침 (전송 완료 후 홈화면으로 돌아올 때)
  useEffect(() => {
    const handleRouteChange = () => {
      // 캐시 무효화로 모든 잔액 데이터 새로고침
      invalidateBalanceCache();
    };

    // 페이지 로드 시 한 번 실행
    handleRouteChange();
    
    // 라우터 이벤트 리스너 추가
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);


  // 코인별 아이콘 매핑
  const getCoinIcon = (symbol: string, size: number = 54) => {
    if (symbol === 'XRP') return <XrpIcon size={size} />;
    if (symbol === 'USD') return (
      <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl">
        $
      </div>
    );
    if (symbol === 'CNY') return (
      <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xl">
        ¥
      </div>
    );
    if (symbol === 'EUR') return (
      <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
        €
      </div>
    );
    return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  return (
    <div className="min-h-screen w-full flex flex-col relative font-inherit">
      {/* 탑바 */}
      <nav className="top-bar">
        <div className="top-bar-inner">
          {/* xTalk Wallet 제품명 */}
          <div className="wallet-select-container">
            <div className="px-7 py-5">
              <span className="text-2xl font-bold text-white">xTalk Wallet</span>
            </div>
          </div>
          {/* QR 코드 스캔 버튼 */}
          <div>
            <button
              className="profile-button"
              aria-label="QR 스캔"
              onClick={() => alert('QR 스캔 기능은 추후 구현 예정입니다.')}
            >
              <QrIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="main-box min-h-screen">
        {/* 내 ETH/달러/쿠폰 */}
        <div className="main-summary-box">
          <div className="main-summary-amount">${totalUSD.toFixed(2)}</div>
        </div>
        
        {/* 전송/스왑/Faucet 버튼 */}
        <div className="main-action-button-group">
          <button
            className="main-action-button"
            onClick={() => router.push('/transfer')}
          >
            전송
          </button>
          <button
            className="main-action-swap-button"
            onClick={() => router.push('/swap')}
          >
            <SwapIcon />
          </button>

          {/* XRPL Devnet Faucet 버튼 */}
          {selectedWallet?.addresses.XRP && (
            <button
              className="main-action-button"
              onClick={handleFaucetRequest}
              disabled={isFaucetLoading}
              style={{
                backgroundColor: isFaucetLoading ? '#666' : '#F2A003',
                opacity: isFaucetLoading ? 0.6 : 1
              }}
            >
              {isFaucetLoading ? '충전 중...' : 'Faucet'}
            </button>
          )}
        </div>
        
        {/* 잔액 콤보박스 */}
        <div className="balance-combo-box">
          <CustomSelect
            value={balanceType}
            options={balanceOptions.map(opt => ({ value: opt, label: opt }))}
            onChange={v => setBalanceType(v as typeof balanceType)}
            width={120}
            height={40}
            fontSize={15}
            padding="8px 32px 8px 16px"
            accentColor="#F2A003"
            style={{ minWidth: 90 }}
          />
        </div>
        
        {/* XRPL 자산 잔액 리스트 */}
        <div className="balance-list">
          {selectedWallet && (
            <>
              {selectedWallet.addresses.XRP && enabledAssets.includes('XRP') && (
                <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
                  <XrpIcon size={72} />
                  <div className="balance-card-inner">
                    <span className="balance-card-name">XRP</span>
                    <span className="balance-card-usd" style={{ color: xrpBalance.data?.changeColor || '#6FCF97' }}>
                      {xrpBalance.isLoading ? '로딩 중...' : xrpBalance.data?.price ? `${xrpBalance.data.price} ${xrpBalance.data.change}` : '$0.50 0.00%'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end ml-auto">
                    <span className="balance-card-amount">
                      {xrpBalance.isLoading ? '로딩 중...' : xrpBalance.data?.balance || '0.00000'}
                    </span>
                    <span className="balance-card-sub-usd">
                      {xrpBalance.isLoading ? '로딩 중...' : xrpBalance.data?.usdValue || '$0.00'}
                    </span>
                  </div>
                </div>
              )}
              
              {selectedWallet.addresses.USD && enabledAssets.includes('USD') && (
                <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
                  <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                    $
                  </div>
                  <div className="balance-card-inner">
                    <span className="balance-card-name">Devnet USD</span>
                    <span className="balance-card-usd" style={{ color: '#6FCF97' }}>
                      $1.00 0.00%
                    </span>
                  </div>
                  <div className="flex flex-col items-end ml-auto">
                    <span className="balance-card-amount">
                      0.000000
                    </span>
                    <span className="balance-card-sub-usd">
                      $0.00
                    </span>
                  </div>
                </div>
              )}

              {selectedWallet.addresses.CNY && enabledAssets.includes('CNY') && (
                <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
                  <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xl">
                    ¥
                  </div>
                  <div className="balance-card-inner">
                    <span className="balance-card-name">Devnet CNY</span>
                    <span className="balance-card-usd" style={{ color: '#6FCF97' }}>
                      ¥7.20 0.00%
                    </span>
                  </div>
                  <div className="flex flex-col items-end ml-auto">
                    <span className="balance-card-amount">
                      0.000000
                    </span>
                    <span className="balance-card-sub-usd">
                      $0.00
                    </span>
                  </div>
                </div>
              )}

              {selectedWallet.addresses.EUR && enabledAssets.includes('EUR') && (
                <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
                  <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    €
                  </div>
                  <div className="balance-card-inner">
                    <span className="balance-card-name">Devnet EUR</span>
                    <span className="balance-card-usd" style={{ color: '#6FCF97' }}>
                      €0.92 0.00%
                    </span>
                  </div>
                  <div className="flex flex-col items-end ml-auto">
                    <span className="balance-card-amount">
                      0.000000
                    </span>
                    <span className="balance-card-sub-usd">
                      $0.00
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {!selectedWallet && !isWalletListLoading && (
            <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
              <div className="balance-card-inner">
                <span className="balance-card-name">지갑이 없습니다</span>
                <span className="balance-card-usd" style={{ color: '#A0A0B0' }}>새 지갑을 생성해주세요</span>
              </div>
            </div>
          )}
        </div>

        {/* 가상자산 추가 링크 */}
        {selectedWallet && (
          <div className="text-center mt-4">
            <button 
              onClick={() => router.push('/add-assets')}
              className="text-[#F2A003] text-sm font-semibold hover:text-[#E09400] transition-colors"
            >
              + 가상자산 추가
            </button>
          </div>
        )}
        
        
        {/* xTalk Wallet 워터마크 */}
        <div className="watermark">
          <span>xTalk Wallet</span>
        </div>
      </main>

      {/* 하단 탭바 */}
      <TabBar />
    </div>
  );
}