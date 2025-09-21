"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { CustomSelect } from "../components/molecules/CustomSelect";
import { useRouter } from "next/navigation";
import { TabBar } from "../components/molecules/TabBar";
import { cn } from '@/lib/utils/utils';
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/queries/useWalletBalance";
import { Button, Input, Card } from "../components/ui";
import { Modal } from "../components/ui/Modal";
import { useQueryClient } from '@tanstack/react-query';
import { regenerateAllWalletPrivateKeys, getNextEthAddressPath, getNextAccountPath } from "../lib/wallet-utils";
import { xrplFaucet } from "../lib/xrpl/xrpl-faucet";
import { xrplClient } from "../lib/xrpl/xrpl-client";
import dynamic from 'next/dynamic';

// 클라이언트 전용 컴포넌트를 동적으로 로드
const ClientOnlyAssetDisplay = dynamic(() => import('../components/ClientOnlyAssetDisplay'), {
  ssr: false,
  loading: () => <div style={{ color: 'white', padding: '20px' }}>자산 로딩 중...</div>
});

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

// 자산 흐름 차트 컴포넌트 (Mock 데이터)
const AssetFlowChart = () => {
  // 1년간의 Mock 데이터 (달러 기준) - 월별
  const mockData = [
    { month: '23/10', value: 245.80 },
    { month: '23/11', value: 312.45 },
    { month: '23/12', value: 389.20 },
    { month: '24/01', value: 456.75 },
    { month: '24/02', value: 423.30 },
    { month: '24/03', value: 578.90 },
    { month: '24/04', value: 634.25 },
    { month: '24/05', value: 721.60 },
    { month: '24/06', value: 689.15 },
    { month: '24/07', value: 792.40 },
    { month: '24/08', value: 845.70 },
    { month: '24/09', value: 925.85 }
  ];

  const maxValue = Math.max(...mockData.map(d => d.value));
  const minValue = Math.min(...mockData.map(d => d.value));
  const range = maxValue - minValue;

  // SVG 좌표 계산 - 끝에서 끝까지 전체 너비 사용
  const width = 400; // 훨씬 더 넓게
  const height = 90; // 높이도 조금 증가
  const padding = { top: 15, right: 2, bottom: 25, left: 2 }; // 좌우 패딩 최소화

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 좌표 계산
  const coordinates = mockData.map((d, i) => ({
    x: padding.left + (i / (mockData.length - 1)) * chartWidth,
    y: padding.top + ((maxValue - d.value) / range) * chartHeight
  }));

  // 더 부드러운 곡선을 위한 향상된 베지어 곡선 계산
  const createSmoothPath = (points: Array<{x: number, y: number}>) => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // 이전과 다음 점을 고려한 부드러운 곡선
      const prev = i > 0 ? points[i - 1] : current;
      const after = i < points.length - 2 ? points[i + 2] : next;

      // 더 부드러운 제어점 계산 - 인접 점들의 영향 고려
      const tension = 0.4; // 곡선의 부드러움 정도
      const cp1x = current.x + (next.x - prev.x) * tension * 0.2;
      const cp1y = current.y + (next.y - prev.y) * tension * 0.2;
      const cp2x = next.x - (after.x - current.x) * tension * 0.2;
      const cp2y = next.y - (after.y - current.y) * tension * 0.2;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }

    return path;
  };

  const smoothPath = createSmoothPath(coordinates);

  const currentValue = mockData[mockData.length - 1].value;
  const previousValue = mockData[mockData.length - 2].value;
  const change = currentValue - previousValue;
  const changePercent = ((change / previousValue) * 100).toFixed(2);
  const isPositive = change >= 0;

  return (
    <div style={{
      width: '100%',
      padding: '12px 8px'
    }}>
      {/* 차트 제목과 변화율 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{
          color: '#999',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          1년 자산 흐름
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            color: isPositive ? '#4CAF50' : '#F44336',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {isPositive ? '+' : ''}{changePercent}%
          </span>
          <span style={{
            color: isPositive ? '#4CAF50' : '#F44336',
            fontSize: '12px'
          }}>
            {isPositive ? '↗' : '↘'}
          </span>
        </div>
      </div>

      {/* SVG 차트 */}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {/* 격자 배경 */}
        <defs>
          <pattern id="grid" width="50" height="20" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 20" fill="none" stroke="#333" strokeWidth="0.5" opacity="0.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* 그라데이션 영역 */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F2A003" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#F2A003" stopOpacity="0.03"/>
          </linearGradient>
        </defs>

        {/* 채움 영역 - 부드러운 곡선으로 */}
        <path
          d={`${smoothPath} L ${coordinates[coordinates.length - 1].x},${padding.top + chartHeight} L ${coordinates[0].x},${padding.top + chartHeight} Z`}
          fill="url(#chartGradient)"
        />

        {/* 부드러운 곡선 라인 */}
        <path
          d={smoothPath}
          fill="none"
          stroke="#F2A003"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 데이터 포인트 */}
        {coordinates.map((coord, i) => (
          <circle
            key={i}
            cx={coord.x}
            cy={coord.y}
            r="3"
            fill="#F2A003"
            stroke="#1A1A1A"
            strokeWidth="1.5"
          />
        ))}

        {/* X축 라벨 */}
        {[0, Math.floor(mockData.length / 2), mockData.length - 1].map(i => (
          <text
            key={i}
            x={coordinates[i].x}
            y={height - 8}
            textAnchor="middle"
            fill="#666"
            fontSize="11"
            fontFamily="monospace"
          >
            {mockData[i].month}
          </text>
        ))}
      </svg>
    </div>
  );
};

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
  // State variables with explicit initialization
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [walletSelectOpen, setWalletSelectOpen] = useState<boolean>(false);
  const [balanceType, setBalanceType] = useState<'잔액' | 'NFT'>('잔액');
  const [phoneModalOpen, setPhoneModalOpen] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [displayUserName, setDisplayUserName] = useState<string>('');
  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const balanceOptions = ['잔액', 'NFT'] as const;
  
  // useMasterAddress 훅 사용

  // React Query 클라이언트
  const queryClient = useQueryClient();
  

  // 새로운 atoms hooks 사용
  const {
    wallet: selectedWallet,
    isLoading: isWalletLoading,
    enabledAssets,
    isRegistered,
    loadWallet,
    refreshWallet,
    updateEnabledAssets,
    registerUser
  } = useWallet();


  // XRPL 자산 잔액 데이터 가져오기
  const xrpBalance = useWalletBalance(
    selectedWallet?.addresses.XRP || '', 
    'XRP'
  );

  // 잔액 데이터 캐시 무효화 함수
  const invalidateBalanceCache = () => {
    queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
    console.log('잔액 캐시 무효화 완료');
  };

  // XRP 잔액 표시 (달러 대신 XRP 잔액, 소수점 2자리)
  const getDisplayBalance = () => {
    console.log('💰 XRP 잔액 표시:', xrpBalance.data);

    if (!selectedWallet || !xrpBalance.data) {
      return { amount: '0.00', symbol: 'XRP' };
    }

    // 소수점 2자리로 포맷
    const balance = parseFloat(xrpBalance.data.balance || '0');
    const formattedBalance = balance.toFixed(2);

    return {
      amount: formattedBalance,
      symbol: 'XRP'
    };
  };

  const displayBalance = getDisplayBalance();

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

            // XRPL 토큰들은 XRP 주소와 동일한 주소를 사용 (TST만 지원)
            if (['TST'].includes(symbol)) {
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
              // XRPL 주소는 XRPL Client를 통해 생성
              console.log(`${symbol} 주소는 XRPL Client를 통해 생성됩니다.`);
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
  console.log('메인 화면 상태 (단일지갑):', {
    enabledAssets,
    selectedWallet: selectedWallet ? {
      id: selectedWallet.id,
      name: selectedWallet.name,
      addresses: selectedWallet.addresses
    } : null,
    isWalletLoading: isWalletLoading
  });

  // localStorage 상세 디버깅
  if (typeof window !== 'undefined') {
    console.log('=== localStorage 상세 디버깅 ===');

    // hdWallets 확인
    const savedWallets = localStorage.getItem('hdWallets');
    console.log('저장된 지갑들 (raw):', savedWallets);
    if (savedWallets) {
      try {
        const parsedWallets = JSON.parse(savedWallets);
        console.log('파싱된 지갑들:', parsedWallets.length, '개');
        parsedWallets.forEach((wallet: any, index: number) => {
          console.log(`지갑 ${index + 1}:`, {
            id: wallet.id,
            name: wallet.name,
            addresses: wallet.addresses ? Object.keys(wallet.addresses) : 'No addresses'
          });
        });
      } catch (error) {
        console.error('지갑 파싱 오류:', error);
      }
    }

    // selectedWalletId 확인
    const savedSelectedWalletId = localStorage.getItem('selectedWalletId');
    console.log('저장된 선택 지갑 ID:', savedSelectedWalletId);

    // enabledAssets 확인
    const savedEnabledAssets = localStorage.getItem('enabledAssets');
    console.log('저장된 자산들 (raw):', savedEnabledAssets);
    if (savedEnabledAssets) {
      try {
        const parsed = JSON.parse(savedEnabledAssets);
        console.log('파싱된 저장 자산:', parsed);
        console.log('자산 심볼들:', parsed.map((a: any) => a.symbol));
      } catch (error) {
        console.error('자산 파싱 오류:', error);
      }
    }

    console.log('=== localStorage 디버깅 완료 ===');
  }

  // 지갑 초기 로딩은 useWallet 훅에서 자동으로 처리됨

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
      console.log('🚰 === Faucet 요청 시작 ===');
      console.log('요청 주소:', selectedWallet.addresses.XRP);
      console.log('선택된 지갑:', selectedWallet.name);

      // XRPL 연결 확인
      console.log('XRPL 클라이언트 연결 확인...');
      const accountInfo = await xrplClient.getAccountInfo(selectedWallet.addresses.XRP);
      console.log('Faucet 전 계정 정보:', accountInfo);

      // Faucet 가용성 확인
      console.log('Faucet 가용성 확인 중...');
      const availability = await xrplFaucet.checkFaucetAvailability(selectedWallet.addresses.XRP);
      console.log('Faucet 가용성:', availability);

      if (!availability.available) {
        if (availability.remainingTime) {
          const hours = Math.ceil(availability.remainingTime / (1000 * 60 * 60));
          alert(`Faucet 한도 초과: ${hours}시간 후 다시 시도해주세요.`);
        } else {
          alert(`Faucet 사용 불가: ${availability.reason}`);
        }
        return;
      }

      // Testnet Faucet 요청 (네트워크를 TESTNET으로 통일)
      console.log('XRPL Testnet Faucet API 호출 중...');
      const result = await xrplFaucet.requestTestnetXRP(selectedWallet.addresses.XRP);
      console.log('Faucet API 응답:', result);

      if (result.success) {
        // Faucet 사용 기록
        xrplFaucet.recordFaucetUsage(selectedWallet.addresses.XRP);

        console.log('✅ Faucet 성공! 잔액 새로고침 중...');
        alert(`✅ Faucet 성공!\n1000 XRP가 충전되었습니다.\n잔액: ${result.balance} drops`);

        // 잔액 새로고침
        invalidateBalanceCache();

        // 5초 후 계정 상태 재확인
        setTimeout(async () => {
          const updatedAccountInfo = await xrplClient.getAccountInfo(selectedWallet.addresses.XRP);
          console.log('Faucet 후 계정 정보:', updatedAccountInfo);
        }, 5000);

      } else {
        console.error('❌ Faucet 실패:', result.error);
        alert(`❌ Faucet 실패: ${result.error}`);
      }

      console.log('🚰 === Faucet 요청 완료 ===');
    } catch (error) {
      console.error('Faucet 요청 오류:', error);
      alert('Faucet 요청 중 오류가 발생했습니다.');
    } finally {
      setIsFaucetLoading(false);
    }
  };

  // 사용자 등록 함수 (Redis 저장 + 로컬스토리지 삭제)
  const handleUserRegistration = async () => {
    if (!phoneNumber.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    if (!userName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      console.log('📞 사용자 등록 시작:', phoneNumber, userName);

      // useWallet 훅의 registerUser 함수 사용
      const success = await registerUser(phoneNumber.trim(), userName.trim());

      if (success) {
        alert(`${userName}님의 계정이 등록되었습니다!\n개인키는 Redis에 안전하게 저장되었습니다.`);
        setPhoneModalOpen(false);
        setPhoneNumber('');
        setUserName('');

        // 화면에 표시되는 사용자 이름 업데이트
        setDisplayUserName(userName.trim());
      } else {
        alert('사용자 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 등록 오류:', error);
      alert('사용자 등록 중 오류가 발생했습니다.');
    }
  };

  // 사용자 이름 로드 useEffect (sessionStorage 사용)
  useEffect(() => {
    const savedUserName = sessionStorage.getItem('userName');
    if (savedUserName) {
      setDisplayUserName(savedUserName);
    }
  }, []);

  // 디버깅용 useEffect
  useEffect(() => {
    if (selectedWallet) {
      console.log('선택된 지갑:', selectedWallet);
      console.log('활성화된 자산:', enabledAssets);
      console.log('모든 주소들:', selectedWallet.addresses);

      // XRPL 자산 상태 확인
      const xrplAssets = ['XRP'];
      xrplAssets.forEach(symbol => {
        console.log(`${symbol} 주소:`, selectedWallet.addresses[symbol]);
        console.log(`${symbol} 활성화됨:`, enabledAssets.includes(symbol));
      });

      // 잔액 데이터 디버깅
      console.log('XRP 잔액 데이터:', xrpBalance.data);
    }
      }, [selectedWallet, enabledAssets, xrpBalance.data]);

  // assetsUpdated 이벤트 수신
  useEffect(() => {
    const handleAssetsUpdated = (event: CustomEvent) => {
      console.log('자산 업데이트 이벤트 수신:', event.detail);
      // 이벤트는 useEnabledAssets hook에서 처리됨
    };

    const handleWalletsUpdated = () => {
      console.log('지갑 업데이트 이벤트 수신');
      refreshWallet();
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
  }, []);

  // 페이지 포커스 시 지갑 새로고침
  useEffect(() => {
    const handleFocus = () => {
      refreshWallet();

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

  // 전화번호 등록 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenPhoneModal = () => {
      setPhoneModalOpen(true);
    };

    window.addEventListener('openPhoneModal', handleOpenPhoneModal);
    return () => {
      window.removeEventListener('openPhoneModal', handleOpenPhoneModal);
    };
  }, []);



  const profileRef = useRef<HTMLDivElement>(null);
  const walletSelectRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (walletSelectRef.current && !walletSelectRef.current.contains(e.target as Node)) {
        setWalletSelectOpen(false);
      }
    };

    if ((profileOpen === true) || (walletSelectOpen === true)) {
      document.addEventListener('mousedown', handleClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [profileOpen, walletSelectOpen]);

  return (
    <div className="min-h-screen w-full flex flex-col relative font-inherit">
      {/* 탑바 */}
      <nav className="top-bar">
        <div className="top-bar-inner">
          {/* 지갑 선택 콤보박스 */}
          <div className="wallet-select-container">
            <div className="relative" ref={walletSelectRef}>
              <button
                className="select-button py-5 px-7 text-left text-2xl font-bold text-white bg-transparent border-none"
                onClick={() => setWalletSelectOpen(!(walletSelectOpen === true))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  paddingRight: '56px',
                  width: '260px',
                  textAlign: 'left'
                }}
              >
                {selectedWallet?.name || 'xTalk Wallet'}
                <span
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white font-bold text-lg"
                  style={{ transform: (walletSelectOpen === true) ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}
                >
                  ▼
                </span>
              </button>

              {(walletSelectOpen === true) && (
                <div className="dropdown-menu" style={{ top: 'calc(100% + 8px)' }}>
                  {/* 현재 지갑 표시 */}
                  {selectedWallet && (
                    <div
                      className="dropdown-option selected"
                      onClick={() => {
                        setWalletSelectOpen(false);
                      }}
                    >
                      {selectedWallet.name}
                      <div style={{
                        fontSize: '14px',
                        color: '#A0A0B0',
                        marginTop: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {selectedWallet.addresses.XRP?.slice(0, 8)}...{selectedWallet.addresses.XRP?.slice(-6)}
                      </div>
                    </div>
                  )}

                  {/* 사용자 등록 안내 */}
                  <div
                    className="dropdown-option"
                    onClick={() => {
                      setWalletSelectOpen(false);
                      setPhoneModalOpen(true);
                    }}
                    style={{ borderTop: '1px solid #333', marginTop: '4px' }}
                  >
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>📱</span>
                    계정 등록
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 전화번호 연동 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="profile-button"
              aria-label="전화번호 연동"
              onClick={() => setPhoneModalOpen(true)}
              style={{ marginRight: '8px' }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="6" width="16" height="28" rx="3" stroke="#F2A003" strokeWidth="2.5" fill="none"/>
                <rect x="16" y="10" width="8" height="2" fill="#F2A003"/>
                <circle cx="20" cy="28" r="2" fill="#F2A003"/>
                <path d="M10 16C10 15.4477 10.4477 15 11 15H13" stroke="#F2A003" strokeWidth="2" strokeLinecap="round"/>
                <path d="M30 16C30 15.4477 29.5523 15 29 15H27" stroke="#F2A003" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* 사용자 이름 표시 */}
            <div style={{ color: '#F2A003', fontSize: '16px', fontWeight: 'bold' }}>
              {displayUserName}
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="main-box min-h-screen">
        {/* 내 XRP 잔액 */}
        <div className="main-summary-box">
          <div className="main-summary-amount">{displayBalance.amount} {displayBalance.symbol}</div>

          {/* 자산 흐름 차트 */}
          <div style={{
            marginTop: '16px',
            padding: '12px 0',
            borderTop: '1px solid #333'
          }}>
            <AssetFlowChart />
          </div>
        </div>
        
        {/* 전송/스왑/Faucet 버튼 */}
        <div className="main-action-button-group">
          <button
            className="main-action-button"
            onClick={() => setTransferModalOpen(true)}
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
        
        {/* 클라이언트 전용 자산 표시 컴포넌트 */}
        <ClientOnlyAssetDisplay
          selectedWallet={selectedWallet}
          xrpBalance={xrpBalance}
        />

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

      {/* 전송 방식 선택 모달 */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="전송 방식 선택"
        type="info"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-center mb-6">
            어떤 방식으로 전송하시겠습니까?
          </p>

          {/* 일반 전송 */}
          <button
            onClick={() => {
              setTransferModalOpen(false);
              router.push('/transfer');
            }}
            className="w-full p-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-gray-600 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">💸</div>
              <div>
                <div className="font-bold text-white">일반 전송</div>
                <div className="text-sm text-gray-400">한 명에게 즉시 송금</div>
              </div>
            </div>
          </button>

          {/* 일괄 전송 */}
          <button
            onClick={() => {
              setTransferModalOpen(false);
              router.push('/batch-payment');
            }}
            className="w-full p-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-gray-600 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">📦</div>
              <div>
                <div className="font-bold text-white">일괄 전송</div>
                <div className="text-sm text-gray-400">여러 명에게 한 번에 송금</div>
              </div>
            </div>
          </button>

          {/* 조건부 전송 */}
          <button
            onClick={() => {
              setTransferModalOpen(false);
              router.push('/escrow-payment');
            }}
            className="w-full p-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-gray-600 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">🔒</div>
              <div>
                <div className="font-bold text-white">조건부 전송</div>
                <div className="text-sm text-gray-400">조건 충족 시 자동 송금</div>
              </div>
            </div>
          </button>
        </div>
      </Modal>

      {/* 전화번호 등록 모달 */}
      <Modal
        isOpen={phoneModalOpen}
        onClose={() => {
          setPhoneModalOpen(false);
          setPhoneNumber('');
          setUserName('');
        }}
        title={isRegistered ? "계정 정보 수정" : "계정 등록"}
        type="info"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            {isRegistered 
              ? "계정 정보를 수정할 수 있습니다."
              : "지갑을 사용하려면 먼저 계정을 등록해주세요. 등록 시 자동으로 새 지갑이 생성됩니다."
            }
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              이름
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#F2A003]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#F2A003]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePhoneRegistration();
                }
              }}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setPhoneModalOpen(false);
                setPhoneNumber('');
                setUserName('');
              }}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleUserRegistration}
              disabled={!phoneNumber.trim() || !userName.trim()}
              className="flex-1 px-4 py-2 bg-[#F2A003] hover:bg-[#E09400] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isRegistered ? "수정" : "등록"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 하단 탭바 */}
      <TabBar />
    </div>
  );
}