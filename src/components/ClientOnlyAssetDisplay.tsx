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
    background: 'linear-gradient(135deg, #002868 0%, #BF0A30 50%, #FFFFFF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(191, 10, 48, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    position: 'relative'
  }}>
    <div style={{
      position: 'absolute',
      inset: '8px',
      borderRadius: '50%',
      background: '#002868',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.25 }}>🇺🇸</span>
    </div>
  </div>
);

const CNYIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #DE2910 0%, #FFDE00 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(222, 41, 16, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    position: 'relative'
  }}>
    <div style={{
      position: 'absolute',
      inset: '8px',
      borderRadius: '50%',
      background: '#DE2910',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <span style={{ color: '#FFDE00', fontWeight: 'bold', fontSize: size * 0.25 }}>🇨🇳</span>
    </div>
  </div>
);

const EURIcon = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #003399 0%, #FFCC00 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0, 51, 153, 0.3)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    position: 'relative'
  }}>
    <div style={{
      position: 'absolute',
      inset: '8px',
      borderRadius: '50%',
      background: '#003399',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <span style={{ color: '#FFCC00', fontWeight: 'bold', fontSize: size * 0.25 }}>🇪🇺</span>
    </div>
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
        </>
      )}
    </div>
  );
}