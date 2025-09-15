import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { walletAtom, walletLoadingAtom, enabledAssetsAtom } from '@/store/atoms';
import { createTestWalletIfNotExists } from '@/lib/wallet-utils';
import { ASSET_CONSTANTS } from '@/config/constants';

// 단일지갑 관리 hook
export const useWallet = () => {
  const [wallet, setWallet] = useAtom(walletAtom);
  const [isLoading, setIsLoading] = useAtom(walletLoadingAtom);
  const [enabledAssets, setEnabledAssets] = useAtom(enabledAssetsAtom);

  // 지갑 로드
  const loadWallet = async () => {
    try {
      console.log('🔍 지갑 로드 시작, setIsLoading(true)');
      setIsLoading(true);

      // localStorage에서 지갑 확인
      const walletsData = localStorage.getItem('hdWallets');
      console.log('💾 localStorage hdWallets:', walletsData);

      if (walletsData) {
        const wallets = JSON.parse(walletsData);
        if (wallets.length > 0) {
          const currentWallet = wallets[0]; // 항상 첫 번째(유일한) 지갑 사용
          setWallet(currentWallet);
          console.log('✅ 기존 지갑 로드됨:', currentWallet.name);
          return;
        }
      }

      // 지갑이 없으면 새로 생성
      console.log('💫 새 지갑 생성 중...');
      const created = await createTestWalletIfNotExists();

      if (created) {
        // 생성 후 다시 로드
        const newWalletsData = localStorage.getItem('hdWallets');
        if (newWalletsData) {
          const newWallets = JSON.parse(newWalletsData);
          if (newWallets.length > 0) {
            setWallet(newWallets[0]);
            console.log('✅ 새 지갑 생성 완료:', newWallets[0].name);
          }
        }
      }
    } catch (error) {
      console.error('지갑 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 활성화된 자산 로드
  const loadEnabledAssets = () => {
    try {
      const savedEnabledAssets = localStorage.getItem('enabledAssets');
      if (savedEnabledAssets) {
        const assets = JSON.parse(savedEnabledAssets);
        const assetSymbols = assets.map((asset: any) => asset.symbol);
        setEnabledAssets(assetSymbols);
        console.log('활성화된 자산 로드:', assetSymbols);
      } else {
        // 기본값 설정
        setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
        const defaultAssetsData = ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS.map(symbol => ({ symbol }));
        localStorage.setItem('enabledAssets', JSON.stringify(defaultAssetsData));
        console.log('기본 자산 설정:', ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
      }
    } catch (error) {
      console.error('활성화된 자산 로드 실패:', error);
      setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
    }
  };

  // 자산 업데이트
  const updateEnabledAssets = (assets: string[]) => {
    setEnabledAssets(assets);
    const assetsData = assets.map(symbol => ({ symbol }));
    localStorage.setItem('enabledAssets', JSON.stringify(assetsData));

    // 이벤트 발생
    window.dispatchEvent(new CustomEvent('assetsUpdated', {
      detail: { enabledAssets: assets }
    }));
  };

  // 초기 로딩
  useEffect(() => {
    console.log('🚀 useWallet useEffect 시작, window:', typeof window);
    if (typeof window !== 'undefined') {
      console.log('🚀 useWallet 클라이언트 사이드 초기화 시작');
      loadWallet();
      loadEnabledAssets();
    }
  }, []);

  // 지갑 새로고침
  const refreshWallet = () => {
    loadWallet();
    loadEnabledAssets();
  };

  return {
    wallet,
    isLoading,
    enabledAssets,
    loadWallet,
    loadEnabledAssets,
    updateEnabledAssets,
    refreshWallet
  };
};