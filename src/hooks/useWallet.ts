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

  // enabledAssets가 비어있으면 바로 기본값으로 설정
  if (enabledAssets.length === 0) {
    setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
  }

  // 각 브라우저별 고유 지갑 ID 생성
  const getBrowserWalletId = () => {
    let browserId = localStorage.getItem('browserWalletId');
    if (!browserId) {
      browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('browserWalletId', browserId);
    }
    return browserId;
  };

  // 기존 지갑 데이터 마이그레이션
  const migrateOldWallet = async (browserWalletId: string) => {
    try {
      const oldWalletsData = localStorage.getItem('hdWallets');
      if (oldWalletsData) {
        const oldWallets = JSON.parse(oldWalletsData);
        if (oldWallets.length > 0) {
          const oldWallet = oldWallets[0];

          // 기존 지갑을 새 형식으로 변환
          const migratedWallet = {
            ...oldWallet,
            browserWalletId,
            name: `마이그레이션 지갑 ${browserWalletId.slice(-4)}`
          };

          // 새 키로 저장
          const walletKey = `hdWallet_${browserWalletId}`;
          localStorage.setItem(walletKey, JSON.stringify(migratedWallet));

          return migratedWallet;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // 지갑 로드
  const loadWallet = async () => {
    try {
      setIsLoading(true);

      const browserWalletId = getBrowserWalletId();

      // 브라우저별 지갑 키로 저장
      const walletKey = `hdWallet_${browserWalletId}`;
      const walletData = localStorage.getItem(walletKey);

      if (walletData) {
        const currentWallet = JSON.parse(walletData);

        // 기존 지갑에 토큰 주소가 없으면 추가
        let walletUpdated = false;
        if (currentWallet.addresses.XRP && (!currentWallet.addresses.USD || !currentWallet.addresses.CNY || !currentWallet.addresses.TST)) {
          currentWallet.addresses.USD = currentWallet.addresses.XRP;
          currentWallet.addresses.CNY = currentWallet.addresses.XRP;
          currentWallet.addresses.EUR = currentWallet.addresses.XRP;
          currentWallet.addresses.TST = currentWallet.addresses.XRP;
          currentWallet.addresses.KRW = currentWallet.addresses.XRP;

          currentWallet.privateKeys.USD = currentWallet.privateKeys.XRP;
          currentWallet.privateKeys.CNY = currentWallet.privateKeys.XRP;
          currentWallet.privateKeys.EUR = currentWallet.privateKeys.XRP;
          currentWallet.privateKeys.TST = currentWallet.privateKeys.XRP;
          currentWallet.privateKeys.KRW = currentWallet.privateKeys.XRP;

          if (currentWallet.publicKeys) {
            currentWallet.publicKeys.USD = currentWallet.publicKeys.XRP;
            currentWallet.publicKeys.CNY = currentWallet.publicKeys.XRP;
            currentWallet.publicKeys.EUR = currentWallet.publicKeys.XRP;
            currentWallet.publicKeys.TST = currentWallet.publicKeys.XRP;
            currentWallet.publicKeys.KRW = currentWallet.publicKeys.XRP;
          }

          // 업데이트된 지갑 저장
          localStorage.setItem(walletKey, JSON.stringify(currentWallet));
          walletUpdated = true;
        }

        setWallet(currentWallet);
        return;
      }

      // 기존 hdWallets 데이터 마이그레이션 시도
      const migrated = await migrateOldWallet(browserWalletId);

      if (migrated) {
        setWallet(migrated);
        return;
      }

      // 지갑이 없으면 새로 생성
      const created = await createBrowserSpecificWallet(browserWalletId);

      if (created) {
        setWallet(created);
      }
    } catch (error) {
      console.error('지갑 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 브라우저별 지갑 생성
  const createBrowserSpecificWallet = async (browserWalletId: string) => {
    try {
      const { Wallet } = await import('xrpl');

      // 새 지갑 생성
      const newXrplWallet = Wallet.generate();

      const newWallet = {
        id: `wallet_${Date.now()}`,
        name: `채팅 지갑 ${browserWalletId.slice(-4)}`,
        mnemonic: newXrplWallet.seed, // mnemonic 대신 seed 사용
        addresses: {
          XRP: newXrplWallet.address,
          USD: newXrplWallet.address, // XRPL 토큰들은 XRP와 동일한 주소 사용
          CNY: newXrplWallet.address,
          EUR: newXrplWallet.address,
          TST: newXrplWallet.address,
          KRW: newXrplWallet.address
        },
        privateKeys: {
          XRP: newXrplWallet.privateKey,
          USD: newXrplWallet.privateKey,
          CNY: newXrplWallet.privateKey,
          EUR: newXrplWallet.privateKey,
          TST: newXrplWallet.privateKey,
          KRW: newXrplWallet.privateKey
        },
        publicKeys: {
          XRP: newXrplWallet.publicKey,
          USD: newXrplWallet.publicKey,
          CNY: newXrplWallet.publicKey,
          EUR: newXrplWallet.publicKey,
          TST: newXrplWallet.publicKey,
          KRW: newXrplWallet.publicKey
        },
        browserWalletId
      };

      // 브라우저별 키로 저장
      const walletKey = `hdWallet_${browserWalletId}`;
      localStorage.setItem(walletKey, JSON.stringify(newWallet));

      return newWallet;
    } catch (error) {
      console.error('브라우저별 지갑 생성 실패:', error);
      return null;
    }
  };

  // 활성화된 자산 로드
  const loadEnabledAssets = () => {
    try {
      // 먼저 localStorage에서 기존 설정 읽어오기
      const storedAssets = localStorage.getItem(ASSET_CONSTANTS.STORAGE_KEY);

      if (storedAssets) {
        try {
          const parsedAssets = JSON.parse(storedAssets);

          // 배열 형태인지 확인하고 처리
          let assetsArray = [];
          if (Array.isArray(parsedAssets)) {
            // 새 형식: [{ symbol: 'XRP' }, { symbol: 'USD' }]
            assetsArray = parsedAssets.map(item => item.symbol || item).filter(Boolean);
          } else {
            assetsArray = ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS;
          }

          setEnabledAssets(assetsArray);

        } catch (parseError) {
          setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
        }
      } else {
        // localStorage에 데이터가 없으면 기본값으로 초기화
        setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);

        // 기본값을 localStorage에 저장
        const defaultAssetsData = ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS.map(symbol => ({ symbol }));
        localStorage.setItem(ASSET_CONSTANTS.STORAGE_KEY, JSON.stringify(defaultAssetsData));
      }

    } catch (error) {
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

  // 클라이언트 사이드에서만 실행되는 useEffect
  useEffect(() => {
    loadWallet();
    loadEnabledAssets();
  }, []); // 빈 의존성 배열로 마운트 시 한 번만 실행

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