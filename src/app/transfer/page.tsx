"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { useEnabledAssets } from "../../hooks/useWalletAtoms";
import { sendBlockchainTransaction } from "../../lib/api/blockchain-transfer";
import { Button, Input, Card } from "../../components/ui";

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

  const { selectedWallet } = useWalletList();
  const { enabledAssets } = useEnabledAssets();

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

  // 친구 목록 로드
  useEffect(() => {
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      try {
        const friendsData = JSON.parse(savedFriends);
        setFriends(friendsData);
      } catch (error) {
        console.error('친구 데이터 로드 실패:', error);
      }
    }
  }, []);

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
      // 선택된 자산의 개인키 가져오기
      const privateKey = selectedWallet.privateKeys?.[selectedCurrency];
      if (!privateKey) {
        throw new Error(`${selectedCurrency} 개인키를 찾을 수 없습니다.`);
      }

      // 전송 실행
      const result = await sendBlockchainTransaction(
        selectedWallet.addresses[selectedCurrency] || '',
        toAddress,
        amount,
        privateKey,
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

  const getAvailableCurrencies = () => {
    console.log('🔍 자산 선택 디버그:', {
      selectedWallet: !!selectedWallet,
      enabledAssets,
      walletAddresses: selectedWallet?.addresses,
      walletPrivateKeys: selectedWallet?.privateKeys
    });

    // 추가 상세 디버그 로그
    if (selectedWallet) {
      console.log('📋 지갑 상세 정보:', {
        walletKeys: Object.keys(selectedWallet),
        addressesType: typeof selectedWallet.addresses,
        privateKeysType: typeof selectedWallet.privateKeys,
        fullWallet: selectedWallet
      });

      if (selectedWallet.addresses) {
        console.log('📍 주소 정보:', {
          addressKeys: Object.keys(selectedWallet.addresses),
          xrpAddress: selectedWallet.addresses.XRP,
          xrpAddressExists: !!selectedWallet.addresses.XRP
        });
      }

      if (selectedWallet.privateKeys) {
        console.log('🔑 개인키 정보:', {
          privateKeyKeys: Object.keys(selectedWallet.privateKeys),
          xrpPrivateKeyExists: !!selectedWallet.privateKeys.XRP,
          xrpPrivateKeyLength: selectedWallet.privateKeys.XRP?.length || 0
        });
      }
    }

    if (!selectedWallet) {
      console.log('❌ 선택된 지갑 없음');
      return [];
    }

    if (!enabledAssets.length) {
      console.log('❌ 활성화된 자산 없음, 기본값 사용');
      console.log('⚠️ enabledAssets가 비어있음, XRP 강제 반환 시도');
      // enabledAssets가 비어있어도 XRP가 실제로 있는지 확인
      if (selectedWallet.addresses?.XRP && selectedWallet.privateKeys?.XRP) {
        console.log('✅ XRP 발견 - 강제 반환');
        return ['XRP'];
      } else {
        console.log('❌ XRP 주소나 개인키가 없음');
        return [];
      }
    }

    const availableAssets = enabledAssets.filter(asset => {
      const hasAddress = selectedWallet.addresses && selectedWallet.addresses[asset];
      const hasPrivateKey = selectedWallet.privateKeys && selectedWallet.privateKeys[asset];

      console.log(`🔍 ${asset} 체크:`, {
        hasAddress: !!hasAddress,
        hasPrivateKey: !!hasPrivateKey,
        address: hasAddress,
        privateKeyExists: !!hasPrivateKey
      });

      // 실제로 주소와 개인키가 모두 있는 자산만 전송 가능
      const isAvailable = hasAddress && hasPrivateKey;

      if (isAvailable) {
        console.log(`✅ ${asset} 전송 가능 - 주소와 개인키 모두 존재`);
      } else {
        console.log(`❌ ${asset} 전송 불가 - 주소(${!!hasAddress}) 또는 개인키(${!!hasPrivateKey}) 없음`);
      }

      return isAvailable;
    });

    console.log('✅ 사용 가능한 자산:', availableAssets);

    // 주소와 개인키가 모두 있는 모든 자산 반환
    if (availableAssets.length > 0) {
      console.log('🎯 최종 반환 자산:', availableAssets);
      return availableAssets;
    }

    console.log('⚠️ 전송 가능한 자산이 없음');
    return [];
  };

  const availableCurrencies = getAvailableCurrencies();

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
                사용 가능한 자산이 없습니다. 지갑을 확인해주세요.
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
            
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">친구가 없습니다</p>
                <Button
                  onClick={() => {
                    setShowFriendSelector(false);
                    router.push('/friends');
                  }}
                  className="mt-4 bg-[#F2A003] hover:bg-[#E09400] text-white px-4 py-2 rounded-lg"
                >
                  친구 추가하기
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      {friend.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{friend.name}</div>
                      <div className="text-gray-400 text-sm">{friend.phoneNumber}</div>
                    </div>
                    {friend.isOnline && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
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