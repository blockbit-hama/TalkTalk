'use client';

import { useWallet } from '@/hooks/useWallet';

export function TestUseWallet() {
  const { wallet, isLoading, enabledAssets } = useWallet();

  console.log('🧪 TestUseWallet 컴포넌트:', {
    wallet: wallet ? wallet.name : 'null',
    isLoading,
    enabledAssets
  });

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'black',
      color: 'white',
      padding: 10,
      fontSize: 12,
      zIndex: 9999
    }}>
      <div>Wallet: {wallet ? wallet.name : 'null'}</div>
      <div>Loading: {isLoading ? 'true' : 'false'}</div>
      <div>Assets: {enabledAssets.length}</div>
    </div>
  );
}