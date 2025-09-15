import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { walletAtom, walletLoadingAtom, enabledAssetsAtom } from '@/store/atoms';
import { createTestWalletIfNotExists } from '@/lib/wallet-utils';
import { ASSET_CONSTANTS } from '@/config/constants';

// 단일지갑 관리 hook
export const useWallet = () => {
  console.log('🔧 useWallet hook 초기화 시작');

  const [wallet, setWallet] = useAtom(walletAtom);
  const [isLoading, setIsLoading] = useAtom(walletLoadingAtom);
  const [enabledAssets, setEnabledAssets] = useAtom(enabledAssetsAtom);

  console.log('🔍 현재 상태:', { wallet, isLoading, enabledAssets });

  // enabledAssets가 비어있으면 바로 기본값으로 설정
  if (enabledAssets.length === 0) {
    console.log('⚡ enabledAssets 비어있음, 바로 기본값 설정');
    setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
    console.log('⚡ 설정 완료:', ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
  }

  // 각 브라우저별 고유 지갑 ID 생성
  const getBrowserWalletId = () => {
    let browserId = localStorage.getItem('browserWalletId');
    if (!browserId) {
      browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('browserWalletId', browserId);
      console.log('🆔 새 브라우저 지갑 ID 생성:', browserId);
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

          console.log('🔄 기존 지갑 마이그레이션 완료:', {
            oldAddress: oldWallet.addresses?.XRP,
            newKey: walletKey
          });

          return migratedWallet;
        }
      }
      return null;
    } catch (error) {
      console.error('지갑 마이그레이션 실패:', error);
      return null;
    }
  };

  // 지갑 로드
  const loadWallet = async () => {
    try {
      console.log('🔍 지갑 로드 시작, setIsLoading(true)');
      setIsLoading(true);

      const browserWalletId = getBrowserWalletId();

      // 브라우저별 지갑 키로 저장
      const walletKey = `hdWallet_${browserWalletId}`;
      const walletData = localStorage.getItem(walletKey);
      console.log('💾 브라우저별 지갑 데이터:', walletKey, !!walletData);

      if (walletData) {
        const currentWallet = JSON.parse(walletData);

        // 기존 지갑에 토큰 주소가 없으면 추가
        let walletUpdated = false;
        if (currentWallet.addresses.XRP && (!currentWallet.addresses.USD || !currentWallet.addresses.CNY || !currentWallet.addresses.TST)) {
          console.log('🔄 기존 지갑에 토큰 주소 추가 중...');
          currentWallet.addresses.USD = currentWallet.addresses.XRP;
          currentWallet.addresses.CNY = currentWallet.addresses.XRP;
          currentWallet.addresses.EUR = currentWallet.addresses.XRP;
          currentWallet.addresses.TST = currentWallet.addresses.XRP;

          currentWallet.privateKeys.USD = currentWallet.privateKeys.XRP;
          currentWallet.privateKeys.CNY = currentWallet.privateKeys.XRP;
          currentWallet.privateKeys.EUR = currentWallet.privateKeys.XRP;
          currentWallet.privateKeys.TST = currentWallet.privateKeys.XRP;

          if (currentWallet.publicKeys) {
            currentWallet.publicKeys.USD = currentWallet.publicKeys.XRP;
            currentWallet.publicKeys.CNY = currentWallet.publicKeys.XRP;
            currentWallet.publicKeys.EUR = currentWallet.publicKeys.XRP;
            currentWallet.publicKeys.TST = currentWallet.publicKeys.XRP;
          }

          // 업데이트된 지갑 저장
          localStorage.setItem(walletKey, JSON.stringify(currentWallet));
          walletUpdated = true;
          console.log('✅ 토큰 주소 추가 완료');
        }

        setWallet(currentWallet);
        console.log('✅ 기존 지갑 로드됨:', currentWallet.name, currentWallet.addresses?.XRP);
        if (walletUpdated) {
          console.log('📊 업데이트된 주소들:', Object.keys(currentWallet.addresses));
        }
        return;
      }

      // 기존 hdWallets 데이터 마이그레이션 시도
      console.log('🔄 기존 지갑 마이그레이션 시도...');
      const migrated = await migrateOldWallet(browserWalletId);

      if (migrated) {
        setWallet(migrated);
        console.log('✅ 마이그레이션된 지갑 로드 완료:', migrated.name, migrated.addresses?.XRP);
        return;
      }

      // 지갑이 없으면 새로 생성
      console.log('💫 새 지갑 생성 중...');
      const created = await createBrowserSpecificWallet(browserWalletId);

      if (created) {
        setWallet(created);
        console.log('✅ 새 지갑 생성 완료:', created.name, created.addresses?.XRP);
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
          TST: newXrplWallet.address
        },
        privateKeys: {
          XRP: newXrplWallet.privateKey,
          USD: newXrplWallet.privateKey,
          CNY: newXrplWallet.privateKey,
          EUR: newXrplWallet.privateKey,
          TST: newXrplWallet.privateKey
        },
        publicKeys: {
          XRP: newXrplWallet.publicKey,
          USD: newXrplWallet.publicKey,
          CNY: newXrplWallet.publicKey,
          EUR: newXrplWallet.publicKey,
          TST: newXrplWallet.publicKey
        },
        browserWalletId
      };

      // 브라우저별 키로 저장
      const walletKey = `hdWallet_${browserWalletId}`;
      localStorage.setItem(walletKey, JSON.stringify(newWallet));

      console.log('💫 브라우저별 지갑 생성:', {
        browserWalletId,
        walletName: newWallet.name,
        address: newWallet.addresses.XRP
      });

      return newWallet;
    } catch (error) {
      console.error('브라우저별 지갑 생성 실패:', error);
      return null;
    }
  };

  // 활성화된 자산 로드
  const loadEnabledAssets = () => {
    try {
      console.log('🚀 활성화된 자산 로드 시작');

      // 항상 기본값으로 설정 (개발 단계에서는 매번 초기화)
      console.log('✅ XRPL 기본 자산으로 강제 설정:', ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
      setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
      const defaultAssetsData = ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS.map(symbol => ({ symbol }));
      localStorage.setItem('enabledAssets', JSON.stringify(defaultAssetsData));

      console.log('📊 최종 활성화된 자산:', ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);

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
    try {
      if (typeof window !== 'undefined') {
        console.log('🚀 useWallet 클라이언트 사이드 초기화 시작');
        loadWallet();
        loadEnabledAssets();
      }
    } catch (error) {
      console.error('❌ useWallet useEffect 에러:', error);
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