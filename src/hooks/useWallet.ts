import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { walletAtom, walletLoadingAtom, enabledAssetsAtom } from '@/store/atoms';
import { ASSET_CONSTANTS } from '@/config/constants';

// 단계별 지갑 관리 hook
export const useWallet = () => {
  const [wallet, setWallet] = useAtom(walletAtom);
  const [isLoading, setIsLoading] = useAtom(walletLoadingAtom);
  const [enabledAssets, setEnabledAssets] = useAtom(enabledAssetsAtom);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // enabledAssets가 비어있으면 바로 기본값으로 설정
  if (enabledAssets.length === 0) {
    setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
  }

  // 브라우저별 고유 ID 생성
  const getBrowserId = () => {
    let browserId = sessionStorage.getItem('browserId');
    if (!browserId) {
      browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('browserId', browserId);
    }
    return browserId;
  };

  // 사용자 등록 시에만 지갑 생성 (제거됨)
  // 더 이상 임시 지갑을 미리 생성하지 않음

  // 사용자 등록 시 새 지갑 생성 및 Redis 저장
  const registerUser = async (phoneNumber: string, userName: string) => {
    try {
      setIsLoading(true);

      // 새 XRPL 지갑 생성 (사용자 등록 시에만)
      const { Wallet } = await import('xrpl');
      const newXrplWallet = Wallet.generate();

      console.log('🔑 새 지갑 생성 (사용자 등록):', {
        address: newXrplWallet.address,
        userName: userName.trim(),
        phoneNumber: phoneNumber.trim()
      });

      // Redis에 저장할 데이터 준비
      const redisData = {
        phoneNumber: phoneNumber.trim(),
        userName: userName.trim(),
        walletAddress: newXrplWallet.address,
        privateKey: newXrplWallet.privateKey,
        publicKey: newXrplWallet.publicKey,
        seed: newXrplWallet.seed,
        assets: {
          xrp: {
            balance: '0',
            address: newXrplWallet.address  // 새로 생성한 지갑 주소 사용
          },
          tokens: []
        },
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Redis에 저장
      const response = await fetch('/api/phone-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(redisData),
      });

      if (!response.ok) {
        throw new Error('Redis 저장 실패');
      }

      // sessionStorage에 사용자 정보 저장
      sessionStorage.setItem('userPhoneNumber', phoneNumber.trim());
      sessionStorage.setItem('userName', userName.trim());

      // 지갑 상태 업데이트 (개인키는 Redis에만 보관)
      const registeredWallet = {
        id: `user_${phoneNumber.trim()}`,
        phoneNumber: phoneNumber.trim(),
        userName: userName.trim(),
        name: `${userName.trim()} 지갑`,
        addresses: {
          XRP: newXrplWallet.address,
          USD: newXrplWallet.address,
          CNY: newXrplWallet.address,
          EUR: newXrplWallet.address,
          TST: newXrplWallet.address,
          KRW: newXrplWallet.address
        },
        privateKeys: {}, // 개인키는 로컬에 저장하지 않음
        publicKeys: {
          XRP: newXrplWallet.publicKey,
          USD: newXrplWallet.publicKey,
          CNY: newXrplWallet.publicKey,
          EUR: newXrplWallet.publicKey,
          TST: newXrplWallet.publicKey,
          KRW: newXrplWallet.publicKey
        },
        isTemporary: false,
        redisData: redisData
      };

      // localStorage에 지갑 정보 저장 (useWalletList에서 사용)
      const existingWallets = JSON.parse(localStorage.getItem('wallets') || '[]');
      // 전화번호가 같은 지갑들을 모두 제거 (하이픈 있는/없는 버전 모두)
      const cleanPhoneNumber = phoneNumber.trim().replace(/[-\s]/g, '');
      const updatedWallets = existingWallets.filter((w: any) => {
        const walletPhone = w.phoneNumber?.replace(/[-\s]/g, '') || '';
        return walletPhone !== cleanPhoneNumber;
      });
      updatedWallets.push(registeredWallet);
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
      localStorage.setItem('selectedWalletId', registeredWallet.id);

      setWallet(registeredWallet);
      setIsRegistered(true);
      
      console.log('✅ 사용자 등록 완료:', phoneNumber.trim());
      return true;
      
    } catch (error) {
      console.error('❌ 사용자 등록 실패:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 3단계: Redis에서 개인키 가져오기 (서명용)
  const getPrivateKeyFromRedis = async (phoneNumber: string) => {
    try {
      const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(phoneNumber)}`);
      const result = await response.json();
      
      if (response.ok && result.success && result.user && result.user.privateKey) {
        console.log('✅ Redis에서 개인키 조회 성공');
        return result.user.privateKey;
      }
      
      console.error('❌ Redis에서 개인키를 찾을 수 없습니다');
      return null;
    } catch (error) {
      console.error('❌ Redis 개인키 조회 실패:', error);
      return null;
    }
  };

  // 지갑 로드 (단계별)
  const loadWallet = async () => {
    try {
      setIsLoading(true);

      // sessionStorage에서 등록된 사용자 정보 확인
      const phoneNumber = sessionStorage.getItem('userPhoneNumber');
      if (phoneNumber) {
        // Redis에서 사용자 정보 로드
        const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(phoneNumber)}`);
        const result = await response.json();
        
        if (response.ok && result.success && result.user) {
          const walletData = {
            id: `user_${result.user.phoneNumber}`,
            name: `${result.user.userName} 지갑`,
            phoneNumber: result.user.phoneNumber,
            userName: result.user.userName,
            addresses: {
              XRP: result.user.walletAddress,
              USD: result.user.walletAddress,
              CNY: result.user.walletAddress,
              EUR: result.user.walletAddress,
              TST: result.user.walletAddress,
              KRW: result.user.walletAddress
            },
            privateKeys: {}, // 개인키는 로컬에 저장하지 않음
            publicKeys: {
              XRP: result.user.publicKey,
              USD: result.user.publicKey,
              CNY: result.user.publicKey,
              EUR: result.user.publicKey,
              TST: result.user.publicKey,
              KRW: result.user.publicKey
            },
            seed: result.user.seed,
            isTemporary: false,
            redisData: result.user
          };

          // localStorage에 지갑 정보 저장 (useWalletList에서 사용)
          const existingWallets = JSON.parse(localStorage.getItem('wallets') || '[]');
          // 전화번호가 같은 지갑들을 모두 제거 (하이픈 있는/없는 버전 모두)
          const cleanPhoneNumber = result.user.phoneNumber.replace(/[-\s]/g, '');
          const updatedWallets = existingWallets.filter((w: any) => {
            const walletPhone = w.phoneNumber?.replace(/[-\s]/g, '') || '';
            return walletPhone !== cleanPhoneNumber;
          });
          updatedWallets.push(walletData);
          localStorage.setItem('wallets', JSON.stringify(updatedWallets));
          localStorage.setItem('selectedWalletId', walletData.id);

          setWallet(walletData);
          setIsRegistered(true);
          console.log('✅ 등록된 지갑 로드:', result.user.walletAddress);
          return;
        }
      }

      // 등록된 사용자가 없으면 null 상태 유지
      console.log('ℹ️ 등록된 사용자가 없습니다. 사용자 등록이 필요합니다.');
      setWallet(null);
      setIsRegistered(false);
      
    } catch (error) {
      console.error('❌ 지갑 로드 실패:', error);
      setWallet(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 활성화된 자산 로드
  const loadEnabledAssets = () => {
    try {
      setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
    } catch (error) {
      setEnabledAssets(ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS);
    }
  };

  // 자산 업데이트
  const updateEnabledAssets = (assets: string[]) => {
    setEnabledAssets(assets);
    
    // 이벤트 발생
    window.dispatchEvent(new CustomEvent('assetsUpdated', {
      detail: { enabledAssets: assets }
    }));
  };

  // 지갑 새로고침
  const refreshWallet = () => {
    loadWallet();
    loadEnabledAssets();
  };

  // 클라이언트 사이드에서만 실행되는 useEffect
  useEffect(() => {
    loadWallet();
    loadEnabledAssets();
  }, []); // 빈 의존성 배열로 마운트 시 한 번만 실행

  return {
    wallet,
    isLoading,
    enabledAssets,
    isRegistered,
    loadWallet,
    loadEnabledAssets,
    updateEnabledAssets,
    refreshWallet,
    registerUser,
    getPrivateKeyFromRedis,
  };
};