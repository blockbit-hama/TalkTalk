'use client';

import { useState, useEffect } from 'react';

// 아름다운 국기 아이콘 컴포넌트들
const XRPIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #23292F 0%, #F2A003 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(242, 160, 3, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)'
  }}>
    <span style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.4, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>X</span>
  </div>
);

const USDIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(191, 10, 48, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    overflow: 'hidden'
  }}>
    <svg width={size} height={size} viewBox="0 0 72 72" style={{ borderRadius: '50%' }}>
      {/* 미국 국기 패턴 */}
      <rect width="72" height="5.54" fill="#B22234"/>
      <rect y="5.54" width="72" height="5.54" fill="white"/>
      <rect y="11.08" width="72" height="5.54" fill="#B22234"/>
      <rect y="16.62" width="72" height="5.54" fill="white"/>
      <rect y="22.16" width="72" height="5.54" fill="#B22234"/>
      <rect y="27.7" width="72" height="5.54" fill="white"/>
      <rect y="33.24" width="72" height="5.54" fill="#B22234"/>
      <rect y="38.78" width="72" height="5.54" fill="white"/>
      <rect y="44.32" width="72" height="5.54" fill="#B22234"/>
      <rect y="49.86" width="72" height="5.54" fill="white"/>
      <rect y="55.4" width="72" height="5.54" fill="#B22234"/>
      <rect y="60.94" width="72" height="5.54" fill="white"/>
      <rect y="66.48" width="72" height="5.54" fill="#B22234"/>
      {/* 파란색 칸톤 */}
      <rect width="29" height="39" fill="#3C3B6E"/>
      {/* 별 패턴 (간단하게 흰색 점들로) */}
      <circle cx="4.8" cy="4.8" r="1.2" fill="white"/>
      <circle cx="12" cy="4.8" r="1.2" fill="white"/>
      <circle cx="19.2" cy="4.8" r="1.2" fill="white"/>
      <circle cx="8.4" cy="9.6" r="1.2" fill="white"/>
      <circle cx="15.6" cy="9.6" r="1.2" fill="white"/>
      <circle cx="22.8" cy="9.6" r="1.2" fill="white"/>
      <circle cx="4.8" cy="14.4" r="1.2" fill="white"/>
      <circle cx="12" cy="14.4" r="1.2" fill="white"/>
      <circle cx="19.2" cy="14.4" r="1.2" fill="white"/>
      <circle cx="8.4" cy="19.2" r="1.2" fill="white"/>
      <circle cx="15.6" cy="19.2" r="1.2" fill="white"/>
      <circle cx="22.8" cy="19.2" r="1.2" fill="white"/>
    </svg>
  </div>
);

const CNYIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(222, 41, 16, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    overflow: 'hidden'
  }}>
    <svg width={size} height={size} viewBox="0 0 72 72" style={{ borderRadius: '50%' }}>
      {/* 중국 국기 배경 */}
      <rect width="72" height="72" fill="#DE2910"/>
      {/* 큰 별 */}
      <g transform="translate(14.4, 14.4)">
        <polygon points="0,-7.2 2.16,-2.22 7.56,-2.22 3.7,1.17 5.86,6.15 0,2.75 -5.86,6.15 -3.7,1.17 -7.56,-2.22 -2.16,-2.22" fill="#FFDE00"/>
      </g>
      {/* 작은 별들 */}
      <g transform="translate(28.8, 10.8) rotate(0)">
        <polygon points="0,-2.4 0.72,-0.74 2.52,-0.74 1.26,0.39 1.98,2.05 0,0.92 -1.98,2.05 -1.26,0.39 -2.52,-0.74 -0.72,-0.74" fill="#FFDE00"/>
      </g>
      <g transform="translate(32.4, 18) rotate(15)">
        <polygon points="0,-2.4 0.72,-0.74 2.52,-0.74 1.26,0.39 1.98,2.05 0,0.92 -1.98,2.05 -1.26,0.39 -2.52,-0.74 -0.72,-0.74" fill="#FFDE00"/>
      </g>
      <g transform="translate(30.6, 25.2) rotate(30)">
        <polygon points="0,-2.4 0.72,-0.74 2.52,-0.74 1.26,0.39 1.98,2.05 0,0.92 -1.98,2.05 -1.26,0.39 -2.52,-0.74 -0.72,-0.74" fill="#FFDE00"/>
      </g>
      <g transform="translate(25.2, 30.6) rotate(45)">
        <polygon points="0,-2.4 0.72,-0.74 2.52,-0.74 1.26,0.39 1.98,2.05 0,0.92 -1.98,2.05 -1.26,0.39 -2.52,-0.74 -0.72,-0.74" fill="#FFDE00"/>
      </g>
    </svg>
  </div>
);

const EURIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0, 51, 153, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    overflow: 'hidden'
  }}>
    <svg width={size} height={size} viewBox="0 0 72 72" style={{ borderRadius: '50%' }}>
      {/* EU 국기 파란색 배경 */}
      <rect width="72" height="72" fill="#003399"/>
      {/* 12개 별들을 원형으로 배치 */}
      <g transform="translate(36, 36)">
        <g transform="rotate(0)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(30)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(60)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(90)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(120)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(150)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(180)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(210)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(240)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(270)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(300)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
        <g transform="rotate(330)">
          <polygon points="0,-20 1.76,-18.48 3.09,-16.18 1.76,-13.88 0,-12.36 -1.76,-13.88 -3.09,-16.18 -1.76,-18.48" fill="#FFCC00"/>
        </g>
      </g>
    </svg>
  </div>
);

const TSTIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(128, 0, 128, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    overflow: 'hidden'
  }}>
    <svg width={size} height={size} viewBox="0 0 72 72" style={{ borderRadius: '50%' }}>
      {/* 테스트 토큰 배경 - 그라데이션 */}
      <defs>
        <linearGradient id="testGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#800080"/>
          <stop offset="50%" stopColor="#9932CC"/>
          <stop offset="100%" stopColor="#4B0082"/>
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#testGradient)"/>
      {/* TEST 문자 */}
      <text x="36" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">TEST</text>
      <text x="36" y="48" textAnchor="middle" fill="white" fontSize="8" fontWeight="normal">TOKEN</text>
    </svg>
  </div>
);

interface ClientOnlyAssetDisplayProps {
  selectedWallet: any;
  xrpBalance: any;
}

export default function ClientOnlyAssetDisplay({ selectedWallet, xrpBalance }: ClientOnlyAssetDisplayProps) {
  const [enabledAssets, setEnabledAssets] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    console.log('🎯 ClientOnlyAssetDisplay 컴포넌트가 마운트됨');
    setIsClient(true);

    if (typeof window !== 'undefined') {
      console.log('🖥️ 클라이언트 사이드 확인, localStorage 읽기 시작');

      try {
        const storedAssets = localStorage.getItem('enabledAssets');
        console.log('💾 localStorage에서 읽은 데이터:', storedAssets);

        if (storedAssets) {
          const parsedAssets = JSON.parse(storedAssets);
          const assetsArray = parsedAssets.map((item: any) => item.symbol || item).filter(Boolean);
          console.log('✅ 파싱된 enabledAssets:', assetsArray);
          setEnabledAssets(assetsArray);
        } else {
          console.log('📦 기본값 설정');
          const defaultAssets = ['XRP', 'USD', 'CNY', 'EUR', 'TST'];
          setEnabledAssets(defaultAssets);
          // localStorage에 저장
          const defaultData = defaultAssets.map(symbol => ({ symbol }));
          localStorage.setItem('enabledAssets', JSON.stringify(defaultData));
          console.log('💾 기본값 저장 완료');
        }
      } catch (error) {
        console.error('❌ localStorage 처리 실패:', error);
        setEnabledAssets(['XRP', 'USD', 'CNY', 'EUR', 'TST']);
      }
    }
  }, []);

  // 클라이언트가 준비되지 않았으면 아무것도 렌더링하지 않음
  if (!isClient) {
    console.log('⏳ 클라이언트 준비 중...');
    return <div>로딩 중...</div>;
  }

  console.log('🎨 클라이언트에서 렌더링 시작, enabledAssets:', enabledAssets);

  return (
    <div className="balance-list">
      <div style={{ padding: '10px', background: '#333', margin: '10px', borderRadius: '5px' }}>
        <p style={{ color: 'white', margin: '5px 0' }}>
          🎯 클라이언트 전용 컴포넌트 실행됨!
        </p>
        <p style={{ color: 'yellow', margin: '5px 0' }}>
          활성화된 자산: {JSON.stringify(enabledAssets)}
        </p>
        <p style={{ color: 'cyan', margin: '5px 0' }}>
          지갑 주소: {selectedWallet?.addresses?.XRP || '없음'}
        </p>
      </div>

      {selectedWallet && (
        <>
          {selectedWallet.addresses.XRP && enabledAssets.includes('XRP') && (
            <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
              <XRPIcon />
              <div className="balance-card-inner">
                <span className="balance-card-name">XRP Ledger</span>
                <div className="balance-amount" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  {xrpBalance?.data?.balance || '0.00'} XRP
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '18px' }}>
                  {xrpBalance?.data?.usdValue || '$0.00'}
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('EUR') && (
            <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
              <EURIcon />
              <div className="balance-card-inner">
                <span className="balance-card-name">유로화 (EUR)</span>
                <div className="balance-amount" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  0.00 EUR
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '18px' }}>
                  $0.00
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('USD') && (
            <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
              <USDIcon />
              <div className="balance-card-inner">
                <span className="balance-card-name">미국 달러 (USD)</span>
                <div className="balance-amount" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  0.00 USD
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '18px' }}>
                  $0.00
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('CNY') && (
            <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
              <CNYIcon />
              <div className="balance-card-inner">
                <span className="balance-card-name">중국 위안 (CNY)</span>
                <div className="balance-amount" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  0.00 CNY
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '18px' }}>
                  $0.00
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('TST') && (
            <div className="common-card" style={{ padding: '14px 24px', gap: 20 }}>
              <TSTIcon />
              <div className="balance-card-inner">
                <span className="balance-card-name">테스트 토큰 (TST)</span>
                <div className="balance-amount" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  0.00 TST
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '18px' }}>
                  $0.00
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}