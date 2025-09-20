"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { useEnabledAssets } from "../../hooks/useWalletAtoms";
import { xrplTransferV2, TransferRequest } from "../../lib/xrpl/xrpl-transfer-v2";
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
    loadFriendsFromServer();
  }, []);

  const loadFriendsFromServer = async () => {
    try {
      console.log('🔍 친구 목록 조회 시작');
      
      // 현재 사용자의 전화번호 가져오기 (sessionStorage에서)
      const userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
      if (!userPhoneNumber) {
        console.warn('❌ 사용자 전화번호를 찾을 수 없습니다. 먼저 계정을 등록해주세요.');
        setFriends([]);
        return;
      }
      
      console.log('📍 현재 사용자 전화번호:', userPhoneNumber);
      
      // 전화번호로 친구 목록 조회
      const apiUrl = `/api/friends?userPhone=${encodeURIComponent(userPhoneNumber)}`;
      console.log('🌐 API 호출 URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      console.log('📡 친구 목록 API 응답:', {
        status: response.status,
        success: result.success,
        storage: result.storage,
        count: result.count,
        friends: result.friends
      });
      
      // 친구 데이터 상세 로그
      if (result.friends && result.friends.length > 0) {
        console.log('🔍 친구 데이터 상세:', result.friends[0]);
      }

      if (response.ok && result.success) {
        // 서버 데이터를 친구 인터페이스 형식으로 변환
        const serverFriends = result.friends.map((friend: any, index: number) => ({
          id: `friend_${index}`, // 임시 ID 생성
          name: friend.userName,
          phoneNumber: friend.phoneNumber,
          xrplAddress: friend.walletAddress,
          isOnline: friend.isOnline || false
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
      // 현재 사용자의 전화번호 가져오기
      const userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
      if (!userPhoneNumber) {
        alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // Redis에서 개인키 가져오기
      const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(userPhoneNumber)}`);
      const userResult = await response.json();
      
      if (!response.ok || !userResult.success || !userResult.user?.privateKey) {
        alert('개인키를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 표준 방식으로 지갑 설정
      await xrplTransferV2.setWallet(userResult.user.privateKey);

      // 표준 방식 전송 요청 생성
      const transferRequest: TransferRequest = {
        fromAddress: selectedWallet.addresses[selectedCurrency] || '',
        toAddress: toAddress,
        amount: amount,
        currency: selectedCurrency,
        memo: `친구 ${friendName || '알 수 없음'}에게 전송`
      };

      const result = await xrplTransferV2.sendTransfer(transferRequest);

      if (result.success) {
        alert(`표준 방식 전송 성공!\n트랜잭션 해시: ${result.transactionHash}\n잔액: ${result.balance} XRP`);
        
        // 서버에 트랜잭션 기록
        try {
          const { recordTransactionToServer } = await import('../../lib/api/server-registration');
          const friend = friends.find(f => f.name === friendName);
          await recordTransactionToServer(
            selectedWallet.addresses[selectedCurrency] || '',
            toAddress,
            amount,
            selectedCurrency,
            friend?.phoneNumber || '',
            friend?.name || '',
            result.transactionHash || ''
          );
        } catch (error) {
          console.error('서버 기록 실패:', error);
        }

        // 전송 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('transferCompleted', {
          detail: { 
            from: selectedWallet.addresses[selectedCurrency],
            to: toAddress,
            amount: amount,
            currency: selectedCurrency,
            hash: result.transactionHash
          }
        }));

        // 홈으로 이동
        router.push('/');
      } else {
        alert(`전송 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('표준 방식 전송 실패:', error);
      alert(`표준 방식 전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFriend = (friend: Friend) => {
    setFriendName(friend.name);
    setToAddress(friend.xrplAddress);
    setShowFriendSelector(false);
  };

  const selectCurrency = (currency: string) => {
    setSelectedCurrency(currency);
  };

  // 활성화된 자산 목록 생성
  const availableAssets = useMemo(() => {
    if (!enabledAssets || enabledAssets.length === 0) {
      return [];
    }

    return enabledAssets.map(asset => ({
      symbol: asset,
      name: asset === 'XRP' ? 'XRP' : asset,
      balance: '0', // 실제 잔액은 별도로 조회
    }));
  }, [enabledAssets]);

  if (isWalletLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col relative font-inherit" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-lg">지갑 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!selectedWallet) {
    return (
      <div className="min-h-screen w-full flex flex-col relative font-inherit" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-lg">지갑을 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative font-inherit" style={{ background: '#1A1A1A' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <button 
          onClick={() => router.back()}
          className="text-white text-lg font-bold"
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-white">전송</h1>
        <div className="w-8"></div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <div className="space-y-6">
          {/* 자산 선택 */}
          <div>
            <label className="block text-white font-semibold mb-3">자산 선택</label>
            <div className="grid grid-cols-2 gap-3">
              {availableAssets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => selectCurrency(asset.symbol)}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    selectedCurrency === asset.symbol
                      ? 'border-[#F2A003] bg-[#F2A003]/10'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="text-white font-bold text-lg">{asset.symbol}</div>
                  <div className="text-gray-400 text-sm">{asset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 금액 입력 */}
          <div>
            <label className="block text-white font-semibold mb-2">금액</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
          </div>

          {/* 받는 주소 */}
          <div>
            <label className="block text-white font-semibold mb-2">받는 주소</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="XRPL 주소 입력"
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
            disabled={!amount || !toAddress || !selectedCurrency || isLoading}
            isLoading={isLoading}
            className="w-full"
          >
            {isLoading ? '전송 중...' : '전송하기'}
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
              <div>친구 수: {friends.length}명</div>
              {friends.length > 0 && (
                <div className="mt-1 text-blue-400">
                  💡 첫 번째 친구: {friends[0]?.name || '이름 없음'} ({friends[0]?.phoneNumber || '전화번호 없음'})
                </div>
              )}
              {friends.length === 0 && (
                <div className="mt-1 text-yellow-400">
                  💡 친구를 먼저 추가해주세요
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
                <p className="text-gray-500 text-xs mb-4">먼저 친구를 추가해주세요</p>
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
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">{friend.name}</div>
                        <div className="text-gray-400 text-sm">{friend.phoneNumber}</div>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {friend.isOnline ? '🟢 온라인' : '🔴 오프라인'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-600">
              <Button
                onClick={() => setShowFriendSelector(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                닫기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function TransferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}

export default TransferPage;