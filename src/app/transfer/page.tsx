"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { useEnabledAssets } from "../../hooks/useWalletAtoms";
import { sendBlockchainTransaction } from "../../lib/api/blockchain-transfer";
import { Button, Input, Card } from "../../components/ui";
// createTestWalletIfNotExists 제거 - 사용자 등록 시에만 지갑 생성

interface Friend {
  id: string;
  name: string;
  phoneNumber: string;
  xrplAddress: string;
  avatar?: string;
  isOnline: boolean;
}

function TransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [friendName, setFriendName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showFriendSelector, setShowFriendSelector] = useState(false);

  const { selectedWallet, refreshWalletList, isLoading: isWalletLoading } = useWalletList();
  const { enabledAssets } = useEnabledAssets();

  // 제거됨: createWalletIfNeeded
  // 사용자가 등록되지 않으면 전송 불가

  // 컴포넌트 로드시 전반적인 상태 디버깅
  useEffect(() => {
    console.log('🚀 TransferContent 컴포넌트 로드됨');
    console.log('📍 selectedWallet 상태:', {
      exists: !!selectedWallet,
      id: selectedWallet?.id,
      name: selectedWallet?.name,
      addressesExists: !!selectedWallet?.addresses,
      privateKeysExists: !!selectedWallet?.privateKeys
    });
    console.log('📍 enabledAssets 상태:', enabledAssets);
    console.log('📍 isWalletLoading 상태:', isWalletLoading);

    // 로딩이 완료된 후에만 지갑 체크
    if (!isWalletLoading && !selectedWallet) {
      console.log('⚠️ 선택된 지갑이 없음, 사용자 등록이 필요합니다');
      alert('지갑을 사용하려면 먼저 계정을 등록해주세요.');
      router.push('/');
      return;
    }

    // localStorage에서 실제 데이터 확인
    if (typeof window !== 'undefined') {
      const wallets = localStorage.getItem('wallets');
      const enabledAssetsStorage = localStorage.getItem('enabledAssets');
      const selectedWalletId = localStorage.getItem('selectedWalletId');

      console.log('💾 localStorage 데이터:', {
        walletsExists: !!wallets,
        walletsCount: wallets ? JSON.parse(wallets).length : 0,
        enabledAssetsExists: !!enabledAssetsStorage,
        selectedWalletIdExists: !!selectedWalletId,
        selectedWalletId
      });

      if (wallets) {
        const walletsData = JSON.parse(wallets);
        const currentWallet = walletsData.find((w: any) => w.id === selectedWalletId);
        if (currentWallet) {
          console.log('📋 현재 선택된 지갑 데이터:', {
            id: currentWallet.id,
            name: currentWallet.name,
            addresses: currentWallet.addresses,
            privateKeysExist: !!currentWallet.privateKeys,
            privateKeysList: currentWallet.privateKeys ? Object.keys(currentWallet.privateKeys) : []
          });
        } else {
          console.log('❌ selectedWalletId와 일치하는 지갑을 찾을 수 없음');
        }
      }

      if (enabledAssetsStorage) {
        const storedAssets = JSON.parse(enabledAssetsStorage);
        console.log('🎯 enabledAssets 저장소 데이터:', storedAssets);

        // KRW가 포함된 경우 강제로 제거하고 업데이트
        const hasKRW = storedAssets.some((asset: any) => asset.symbol === 'KRW');
        if (hasKRW) {
          console.log('⚠️ KRW 발견됨 - enabledAssets에서 제거 중...');
          const updatedAssets = storedAssets.filter((asset: any) => asset.symbol !== 'KRW');
          localStorage.setItem('enabledAssets', JSON.stringify(updatedAssets));
          console.log('✅ KRW 제거 완료:', updatedAssets);

          // 페이지 새로고침으로 상태 업데이트
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    }
  }, [selectedWallet, isWalletLoading, enabledAssets, router]);

  // URL 파라미터에서 친구 정보 가져오기
  useEffect(() => {
    const toParam = searchParams.get('to');
    const friendNameParam = searchParams.get('friendName');
    
    if (toParam) {
      setToAddress(toParam);
    }
    if (friendNameParam) {
      setFriendName(decodeURIComponent(friendNameParam));
    }
  }, [searchParams]);

  // 친구 목록 로드 (서버 API 사용)
  useEffect(() => {
    if (selectedWallet?.addresses?.XRP) {
      loadFriendsFromServer();
    }
  }, [selectedWallet]);

  const loadFriendsFromServer = async () => {
    try {
      if (!selectedWallet?.addresses?.XRP) {
        console.warn('지갑 정보가 아직 로드되지 않았습니다.');
        console.log('현재 selectedWallet:', selectedWallet);
        return;
      }

      const currentUserId = selectedWallet.addresses.XRP;
      console.log('🔍 친구 목록 조회 시작:');
      console.log('📍 현재 사용자 ID:', currentUserId);
      
      // Redis에 있는 실제 친구 관계 키들을 동적으로 조회
      let redisKeys: string[] = [];
      try {
        // Redis에서 실제 friends:* 키들을 조회
        const response = await fetch('/api/friends?debug=keys');
        if (response.ok) {
          const result = await response.json();
          redisKeys = result.keys || [];
          console.log('🔍 Redis에서 조회한 실제 친구 관계 키들:', redisKeys);
        } else {
          console.log('⚠️ API 실패, 동적 키 조회로 전환');
        }
      } catch (error) {
        console.error('❌ 친구 관계 키 조회 실패:', error);
      }
      
      // 현재 사용자 ID = 지갑 주소
      const currentKey = `friends:${currentUserId}`;
      const keyExists = redisKeys.includes(currentKey);
      
      console.log('🔍 키 매칭 결과:', keyExists ? '✅ 일치' : '❌ 불일치');
      
      // 키가 일치하지 않으면 기존 친구 관계가 있는 지갑으로 자동 매칭 시도
      if (!keyExists) {
        console.log('⚠️ 현재 지갑 주소가 Redis 친구 관계 키와 일치하지 않습니다!');
        console.log('🔧 자동 매칭 시도...');
        
        // Redis에 있는 모든 친구 관계를 조회해서 친구가 있는 지갑 찾기
        let friendsFound = false;
        let allFriends: any[] = [];
        
        for (const redisKey of redisKeys) {
          try {
            const userId = redisKey.replace('friends:', '');
            console.log(`🔍 친구 관계 조회 중: ${userId}`);
            
            const response = await fetch(`/api/friends?userId=${encodeURIComponent(userId)}`);
            const result = await response.json();
            
            console.log(`📡 ${userId} 응답:`, {
              status: response.status,
              success: result.success,
              count: result.count,
              friends: result.friends
            });
            
            if (response.ok && result.success && result.friends.length > 0) {
              console.log(`✅ 친구 관계 발견: ${userId} (${result.friends.length}명)`);
              
              // 모든 친구를 수집 (중복 제거)
              allFriends = [...allFriends, ...result.friends];
            }
          } catch (error) {
            console.error(`❌ ${redisKey} 조회 실패:`, error);
          }
        }
        
        if (allFriends.length > 0) {
          // 중복 제거 및 자기 자신 제외
          const uniqueFriends = allFriends.filter((friend, index, self) => {
            // 중복 제거 (같은 friendAddress 기준)
            const isUnique = index === self.findIndex(f => f.friendAddress === friend.friendAddress);
            // 자기 자신 제외 (현재 지갑 주소와 다른 주소만)
            const isNotSelf = friend.friendAddress !== currentUserId;
            
            return isUnique && isNotSelf;
          });
          
          console.log(`🎯 중복 제거 및 자기 자신 제외 후 친구 수: ${uniqueFriends.length}명`);
          console.log(`📍 현재 지갑 주소: ${currentUserId}`);
          console.log(`🚫 제외된 자기 자신 주소: ${currentUserId}`);
          
          // 현재 지갑 주소가 Redis 친구 관계에 없는 경우 안내
          const hasCurrentUserInFriends = allFriends.some(friend => 
            friend.friendAddress === currentUserId || friend.userId === currentUserId
          );
          
          if (!hasCurrentUserInFriends) {
            console.log('💡 현재 지갑 주소가 Redis 친구 관계에 없습니다.');
            console.log('💡 이는 현재 지갑이 친구 관계가 있는 지갑과 다르기 때문입니다.');
            console.log('💡 친구 목록에는 다른 지갑들의 친구들이 표시됩니다.');
          }
          
          // 서버 데이터를 친구 인터페이스 형식으로 변환
          const serverFriends = uniqueFriends.map((relationship: any) => ({
            id: relationship.friendId,
            name: relationship.friendName,
            phoneNumber: relationship.friendPhone,
            xrplAddress: relationship.friendAddress,
            isOnline: relationship.isOnline,
            lastSeen: new Date(relationship.lastSeen)
          }));

          setFriends(serverFriends);
          console.log(`🎉 친구 목록 로드 완료: ${serverFriends.length}명`);
          console.log('👥 로드된 친구들:', serverFriends);
          friendsFound = true;
        }
        
        if (!friendsFound) {
          console.log('❌ 친구 관계를 찾을 수 없습니다.');
          setFriends([]);
        }
        return;
      }

      // 키가 일치하는 경우 정상 조회
      const apiUrl = `/api/friends?userId=${encodeURIComponent(currentUserId)}`;
      console.log('🌐 API 호출 URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const result = await response.json();

      console.log('📡 서버 응답:', {
        status: response.status,
        success: result.success,
        storage: result.storage,
        count: result.count,
        friends: result.friends
      });

      if (response.ok && result.success) {
        // 서버 데이터를 친구 인터페이스 형식으로 변환
        const serverFriends = result.friends.map((relationship: any) => ({
          id: relationship.friendId,
          name: relationship.friendName,
          phoneNumber: relationship.friendPhone,
          xrplAddress: relationship.friendAddress,
          isOnline: relationship.isOnline,
          lastSeen: new Date(relationship.lastSeen)
        }));

        setFriends(serverFriends);
        console.log(`✅ 친구 목록 로드 완료: ${serverFriends.length}명`);
        console.log('👥 로드된 친구들:', serverFriends);
      } else {
        console.warn('❌ 친구 목록 조회 실패:', result.error);
        setFriends([]);
      }
    } catch (error) {
      console.error('❌ 친구 데이터 로드 실패:', error);
      setFriends([]);
    }
  };

  const handleTransfer = async () => {
    if (!selectedWallet) {
      alert('지갑을 선택해주세요.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    if (!toAddress) {
      alert('받는 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // Redis 기반 전송 - 개인키는 Redis에서 가져옴
      const fromAddress = selectedWallet.addresses[selectedCurrency] || '';
      
      // sessionStorage에서 전화번호 가져오기
      const phoneNumber = sessionStorage.getItem('userPhoneNumber');
      
      if (!phoneNumber) {
        throw new Error('사용자 전화번호를 찾을 수 없습니다. 다시 로그인해주세요.');
      }
      
      // 디버깅 정보 출력
      console.log('🔍 전송 디버깅 정보:', {
        selectedCurrency,
        fromAddress,
        toAddress,
        amount,
        phoneNumber: phoneNumber,
        walletAddresses: selectedWallet.addresses
      });

      // 전송 실행 (Redis에서 개인키 가져와서 서명)
      const result = await sendBlockchainTransaction(
        fromAddress,
        toAddress,
        amount,
        phoneNumber, // 개인키 대신 전화번호 전달
        selectedCurrency
      );

      if (result.success) {
        // 서버에 트랜잭션 기록
        try {
          const { recordTransactionToServer } = await import('../../lib/api/server-registration');
          const friend = friends.find(f => f.name === friendName);
          await recordTransactionToServer(
            selectedWallet.addresses[selectedCurrency] || '',
            toAddress,
            amount,
            selectedCurrency,
            result.transactionHash || '',
            friend?.id
          );
        } catch (error) {
          console.error('서버 기록 실패:', error);
        }

        // 전송 성공 시 채팅방에 메시지 추가
        if (friendName) {
          addTransferMessageToChat(friendName, amount, selectedCurrency, result.transactionHash);
        }

        alert(`전송이 완료되었습니다!\n트랜잭션 해시: ${result.transactionHash}`);
        router.push('/');
      } else {
        throw new Error(result.error || '전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('전송 실패:', error);
      alert(`전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addTransferMessageToChat = (friendName: string, amount: string, currency: string, txHash: string) => {
    // 채팅 메시지 생성
    const message = {
      id: `msg_${Date.now()}`,
      roomId: `room_${friendName}`,
      senderId: 'current_user',
      type: 'xrp_transfer',
      content: `${amount} ${currency} 전송`,
      metadata: {
        amount,
        currency,
        transactionHash: txHash,
      },
      timestamp: new Date(),
      isRead: false,
      sender: {
        id: 'current_user',
        name: '나',
        isOnline: true
      }
    };

    // localStorage에 메시지 저장
    const existingMessages = JSON.parse(localStorage.getItem('chatMessages') || '{}');
    const roomMessages = existingMessages[message.roomId] || [];
    roomMessages.push(message);
    existingMessages[message.roomId] = roomMessages;
    localStorage.setItem('chatMessages', JSON.stringify(existingMessages));

    // 채팅방 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('chatMessageAdded', { detail: message }));
  };

  const selectFriend = (friend: Friend) => {
    setToAddress(friend.xrplAddress);
    setFriendName(friend.name);
    setShowFriendSelector(false);
  };

  const availableCurrencies = useMemo(() => {
    console.log('🔍 자산 선택 디버그:', {
      selectedWallet: !!selectedWallet,
      enabledAssets,
      walletAddresses: selectedWallet?.addresses,
      isRedisWallet: selectedWallet?.redisData ? true : false
    });

    if (!selectedWallet) {
      console.log('❌ 선택된 지갑 없음');
      return [];
    }

    // 지갑에서 실제로 사용 가능한 모든 자산 찾기
    const walletAddresses = selectedWallet.addresses || {};

    console.log('📋 지갑 데이터:', {
      addressKeys: Object.keys(walletAddresses),
      enabledAssets,
      isRedisWallet: !!selectedWallet.redisData
    });

    // Redis 기반 지갑의 경우: 주소가 있고 개인키는 Redis에 저장되어 있으므로 주소만 체크
    // 개인키는 Redis에서 가져오므로 로컬에서는 체크하지 않음
    const allAvailableAssets = [];

    // XRP는 항상 체크 (주소만 확인)
    if (walletAddresses.XRP) {
      allAvailableAssets.push('XRP');
      console.log('✅ XRP 사용 가능 (Redis 지갑)');
    }

    // 다른 자산들도 체크 (주소만 확인)
    const otherAssets = ['USD', 'EUR', 'CNY', 'JPY', 'KRW'];
    for (const asset of otherAssets) {
      if (walletAddresses[asset]) {
        allAvailableAssets.push(asset);
        console.log(`✅ ${asset} 사용 가능 (Redis 지갑)`);
      }
    }

    console.log('🎯 모든 사용 가능한 자산:', allAvailableAssets);

    // enabledAssets가 비어있으면 모든 사용 가능한 자산 반환
    if (!enabledAssets.length) {
      console.log('⚠️ enabledAssets가 비어있음, 모든 사용 가능한 자산 반환');
      return allAvailableAssets;
    }

    // enabledAssets와 교집합 구하기
    const filteredAssets = enabledAssets.filter(asset =>
      allAvailableAssets.includes(asset)
    );

    console.log('✅ 최종 필터링된 자산:', filteredAssets);
    return filteredAssets;
  }, [selectedWallet, enabledAssets]);

  // 사용 가능한 자산이 로드되면 첫 번째 자산 자동 선택
  useEffect(() => {
    if (availableCurrencies.length > 0 && !selectedCurrency) {
      const defaultCurrency = availableCurrencies.includes('XRP') ? 'XRP' : availableCurrencies[0];
      setSelectedCurrency(defaultCurrency);
      console.log('🎯 기본 자산 선택:', defaultCurrency);
    }
  }, [availableCurrencies.length, selectedCurrency]);

  return (
    <div className="min-h-screen" style={{ background: '#1A1A1A' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <button 
          onClick={() => router.push('/')}
          className="text-white text-lg font-semibold"
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-white">전송</h1>
        <div className="w-16"></div>
      </div>

      {/* 전송 폼 */}
      <div className="p-6">
        <div className="space-y-6">
          {/* 자산 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              전송할 자산
            </label>
            {availableCurrencies.length > 0 ? (
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:border-[#F2A003] focus:outline-none"
              >
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-3 bg-gray-800 text-gray-400 rounded-xl border border-gray-700">
                <div className="text-center">
                  <div className="text-sm mb-2">사용 가능한 자산이 없습니다</div>
                  <div className="text-xs text-gray-500">
                    지갑에 주소와 개인키가 있는 자산이 없습니다.
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    지갑 설정을 확인해주세요.
                  </div>
                </div>
              </div>
            )}
            {availableCurrencies.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                선택 가능한 자산: {availableCurrencies.join(', ')}
              </div>
            )}
          </div>

          {/* 금액 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              전송 금액
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 받는 주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              받는 주소
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="XRPL 주소 입력"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => setShowFriendSelector(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                👥 친구
              </Button>
            </div>
            {friendName && (
              <div className="mt-2 text-sm text-[#F2A003]">
                친구: {friendName}
              </div>
            )}
          </div>

          {/* 전송 버튼 */}
          <Button
            onClick={handleTransfer}
            disabled={isLoading || !amount || !toAddress || !selectedCurrency || availableCurrencies.length === 0}
            className="w-full bg-[#F2A003] hover:bg-[#E09400] text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '전송 중...' :
             availableCurrencies.length === 0 ? '사용 가능한 자산 없음' :
             !selectedCurrency ? '자산을 선택하세요' :
             '전송하기'}
          </Button>
        </div>
      </div>

      {/* 친구 선택 모달 */}
      {showFriendSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-80 max-w-sm mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">친구 선택</h2>
            
            {/* 디버깅 정보 */}
            <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
              <div>현재 지갑: {selectedWallet?.addresses?.XRP || '없음'}</div>
              <div>친구 수: {friends.length}명</div>
              {friends.length === 0 && (
                <div className="mt-1 text-yellow-400">
                  💡 자동으로 친구 관계를 찾는 중...
                </div>
              )}
              {friends.length > 0 && (
                <div className="mt-1 text-blue-400">
                  💡 다른 지갑들의 친구들이 표시됩니다
                </div>
              )}
            </div>
            
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm mb-2">친구가 없습니다</p>
                <p className="text-gray-500 text-xs mb-2">현재 지갑: {selectedWallet?.addresses?.XRP || '없음'}</p>
                <p className="text-gray-500 text-xs mb-4">자동으로 친구 관계를 찾는 중...</p>
                <Button
                  onClick={() => setShowFriendSelector(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  닫기
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div 
                    key={friend.id}
                    onClick={() => selectFriend(friend)}
                    className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        {friend.name.charAt(0)}
                      </div>
                      {friend.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{friend.name}</div>
                      <div className="text-gray-400 text-sm">{friend.phoneNumber}</div>
                      <div className="text-gray-500 text-xs font-mono truncate">{friend.xrplAddress}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Button
                onClick={() => setShowFriendSelector(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              >
                취소
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1A' }}>
        <div className="text-gray-400">로딩 중...</div>
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}