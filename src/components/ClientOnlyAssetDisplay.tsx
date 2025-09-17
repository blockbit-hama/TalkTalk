'use client';

import { useState, useEffect } from 'react';

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
              <div style={{ width: 72, height: 72, backgroundColor: '#F2A003', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>
                X
              </div>
              <div className="balance-card-inner">
                <span className="balance-card-name">XRP</span>
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
              <div style={{ width: 72, height: 72, backgroundColor: '#0066CC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>
                €
              </div>
              <div className="balance-card-inner">
                <span className="balance-card-name">EUR</span>
                <div className="balance-amount" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  0.00 EUR
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