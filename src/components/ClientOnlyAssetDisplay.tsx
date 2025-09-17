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

const KRWIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(205, 32, 31, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    overflow: 'hidden'
  }}>
    <svg width={size} height={size} viewBox="0 0 72 72" style={{ borderRadius: '50%' }}>
      {/* 흰색 배경 */}
      <rect width="72" height="72" fill="white"/>

      {/* 태극 문양 - 더 크게 */}
      <g transform="translate(36, 36)">
        {/* 빨간색 반원 (위쪽, 양) */}
        <path d="M -26,0 A 26,26 0 0,1 26,0 Z" fill="#CD201F"/>

        {/* 파란색 반원 (아래쪽, 음) */}
        <path d="M -26,0 A 26,26 0 0,0 26,0 Z" fill="#0047A0"/>

        {/* 중앙의 작은 원들 - 올바른 위치 */}
        <circle cx="-13" cy="0" r="13" fill="#0047A0"/>
        <circle cx="13" cy="0" r="13" fill="#CD201F"/>
      </g>
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
    setIsClient(true);

    if (typeof window !== 'undefined') {
      try {
        const storedAssets = localStorage.getItem('enabledAssets');

        if (storedAssets) {
          const parsedAssets = JSON.parse(storedAssets);
          const assetsArray = parsedAssets.map((item: any) => item.symbol || item).filter(Boolean);
          setEnabledAssets(assetsArray);
        } else {
          const defaultAssets = ['XRP', 'KRW', 'USD', 'CNY', 'EUR'];
          setEnabledAssets(defaultAssets);
          // localStorage에 저장
          const defaultData = defaultAssets.map(symbol => ({ symbol }));
          localStorage.setItem('enabledAssets', JSON.stringify(defaultData));
        }
      } catch (error) {
        setEnabledAssets(['XRP', 'KRW', 'USD', 'CNY', 'EUR']);
      }
    }
  }, []);

  // 클라이언트가 준비되지 않았으면 아무것도 렌더링하지 않음
  if (!isClient) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="balance-list" style={{ marginTop: '20px' }}>
      {selectedWallet && (
        <>
          {selectedWallet.addresses.XRP && enabledAssets.includes('XRP') && (
            <div className="common-card" style={{ padding: '10px 20px', gap: 16, minHeight: '70px', display: 'flex', alignItems: 'center' }}>
              <XRPIcon size={56} />
              <div className="balance-card-inner" style={{ flex: 1 }}>
                <span className="balance-card-name">XRP Ledger</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div className="balance-amount" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                  {xrpBalance?.data?.balance || '0.000000'} XRP
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '14px' }}>
                  {xrpBalance?.data?.usdValue || '$0.00'}
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('KRW') && (
            <div className="common-card" style={{ padding: '10px 20px', gap: 16, minHeight: '70px', display: 'flex', alignItems: 'center' }}>
              <KRWIcon size={56} />
              <div className="balance-card-inner" style={{ flex: 1 }}>
                <span className="balance-card-name">한국 원화 (KRW)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div className="balance-amount" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                  0.000000 KRW
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '14px' }}>
                  $0.00
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('USD') && (
            <div className="common-card" style={{ padding: '10px 20px', gap: 16, minHeight: '70px', display: 'flex', alignItems: 'center' }}>
              <USDIcon size={56} />
              <div className="balance-card-inner" style={{ flex: 1 }}>
                <span className="balance-card-name">미국 달러 (USD)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div className="balance-amount" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                  0.000000 USD
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '14px' }}>
                  $0.00
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('CNY') && (
            <div className="common-card" style={{ padding: '10px 20px', gap: 16, minHeight: '70px', display: 'flex', alignItems: 'center' }}>
              <CNYIcon size={56} />
              <div className="balance-card-inner" style={{ flex: 1 }}>
                <span className="balance-card-name">중국 위안 (CNY)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div className="balance-amount" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                  0.000000 CNY
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '14px' }}>
                  $0.00
                </div>
              </div>
            </div>
          )}

          {enabledAssets.includes('EUR') && (
            <div className="common-card" style={{ padding: '10px 20px', gap: 16, minHeight: '70px', display: 'flex', alignItems: 'center' }}>
              <EURIcon size={56} />
              <div className="balance-card-inner" style={{ flex: 1 }}>
                <span className="balance-card-name">유로화 (EUR)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div className="balance-amount" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                  0.000000 EUR
                </div>
                <div className="balance-value" style={{ color: '#888A92', fontSize: '14px' }}>
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