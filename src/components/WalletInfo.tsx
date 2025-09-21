'use client';

import { useState, useEffect } from 'react';

export function WalletInfo() {
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedWallets = localStorage.getItem('wallets');
        if (storedWallets) {
          const parsedWallets = JSON.parse(storedWallets);
          setWallets(parsedWallets);
          console.log('📱 현재 저장된 지갑들:', parsedWallets);
        }
      } catch (error) {
        console.error('지갑 정보 로딩 실패:', error);
      }
    }
  }, []);

  if (wallets.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-4">
        <h3 className="text-white font-semibold mb-2">💡 지갑 정보</h3>
        <p className="text-gray-400 text-sm">저장된 지갑이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-4">
      <h3 className="text-white font-semibold mb-2">📱 현재 지갑 계정들</h3>
      <div className="space-y-2">
        {wallets.map((wallet, index) => (
          <div key={wallet.id || index} className="bg-gray-700 p-3 rounded-lg">
            <div className="text-white font-medium">{wallet.name}</div>
            <div className="text-gray-400 text-xs font-mono mt-1 break-all">
              {wallet.masterAddress || wallet.addresses?.XRP || 'No address'}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              생성: {new Date(wallet.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}