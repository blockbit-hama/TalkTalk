"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "../../components/ui";
import { useWallet } from "../../hooks/useWallet";

interface Friend {
  id: string;
  name: string;
  phoneNumber: string;
  xrplAddress: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export default function FriendsPage() {
  const router = useRouter();
  const { wallet } = useWallet();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendPhone, setNewFriendPhone] = useState("");
  const [newFriendName, setNewFriendName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 서버에서 친구 데이터 로드
  useEffect(() => {
    if (wallet?.addresses?.XRP) {
      loadFriends();
    }
  }, [wallet]);

  const loadFriends = async () => {
    try {
      // useWallet에서 현재 사용자 주소 가져오기
      if (!wallet?.addresses?.XRP) {
        console.warn('지갑 정보가 아직 로드되지 않았습니다.');
        return;
      }

      const currentUserId = wallet.addresses.XRP;
      console.log(`[${new Date().toLocaleTimeString()}] 친구 목록 조회 시작:`, currentUserId);

      // 서버에서 친구 목록 조회
      const response = await fetch(`/api/friends?userId=${encodeURIComponent(currentUserId)}`);
      const result = await response.json();

      console.log(`[${new Date().toLocaleTimeString()}] 서버 응답:`, {
        status: response.status,
        storage: result.storage,
        count: result.count
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

        // 이전 친구 수와 비교
        if (friends.length !== serverFriends.length) {
          console.log(`📊 친구 목록 변경: ${friends.length} → ${serverFriends.length}`);
          if (serverFriends.length === 0 && friends.length > 0) {
            console.error('⚠️ 경고: 친구 목록이 갑자기 비워졌습니다!');
          }
        }

        setFriends(serverFriends);
        console.log(`✅ 친구 목록 로드 완료: ${serverFriends.length}명`);
      } else {
        console.warn('친구 목록 조회 실패:', result.error);
      }
    } catch (error) {
      console.error('친구 데이터 로드 실패:', error);
    }
  };


  const addFriend = async () => {
    if (!newFriendPhone || !newFriendName) {
      alert('전화번호와 이름을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      // useWallet에서 현재 사용자 주소 가져오기
      if (!wallet?.addresses?.XRP) {
        throw new Error('지갑 정보를 찾을 수 없습니다.');
      }

      const currentUserId = wallet.addresses.XRP;

      // 1. 전화번호로 실제 지갑 주소 검색
      const phoneSearchResponse = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(newFriendPhone)}`);
      const phoneSearchResult = await phoneSearchResponse.json();

      let friendAddress: string;
      let actualFriendName: string = newFriendName;

      if (phoneSearchResponse.ok && phoneSearchResult.success) {
        // 전화번호에 등록된 실제 지갑 주소 사용
        friendAddress = phoneSearchResult.walletAddress;
        actualFriendName = phoneSearchResult.userName; // 등록된 실제 이름 사용
        console.log(`✅ 전화번호로 친구 찾기 성공: ${actualFriendName} (${friendAddress})`);
      } else {
        // 등록된 사용자가 없으면 에러 처리
        throw new Error(`전화번호 ${newFriendPhone}는 등록되지 않은 사용자입니다. 먼저 해당 사용자가 앱에 가입해야 합니다.`);
      }

      // 2. 친구 데이터 생성
      const friendData: Friend = {
        id: `friend_${Date.now()}`,
        name: actualFriendName,
        phoneNumber: newFriendPhone,
        xrplAddress: friendAddress,
        isOnline: Math.random() > 0.5,
        lastSeen: new Date()
      };

      // 3. 서버에 친구 관계 등록
      const friendResponse = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          friendId: friendData.id,
          friendName: actualFriendName,
          friendPhone: newFriendPhone,
          friendAddress: friendAddress
        }),
      });

      const friendResult = await friendResponse.json();

      if (friendResponse.ok && friendResult.success) {
        // 백그라운드에서 친구 목록 새로고침 먼저 진행
        await loadFriends();

        // 폼 초기화 및 모달 닫기
        setNewFriendPhone("");
        setNewFriendName("");
        setShowAddFriend(false);

        alert(`${actualFriendName} 친구가 추가되었습니다!`);
      } else {
        throw new Error(friendResult.error || '친구 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('친구 추가 실패:', error);
      alert(`친구 추가에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (confirm('정말로 친구를 삭제하시겠습니까?')) {
      try {
        // useWallet에서 현재 사용자 주소 가져오기
        if (!wallet?.addresses?.XRP) {
          throw new Error('지갑 정보를 찾을 수 없습니다.');
        }

        const currentUserId = wallet.addresses.XRP;

        // 서버에서 친구 삭제
        const response = await fetch(`/api/friends?userId=${encodeURIComponent(currentUserId)}&friendId=${encodeURIComponent(friendId)}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // 친구 목록 새로고침
          await loadFriends();
          alert('친구가 삭제되었습니다.');
        } else {
          throw new Error(result.error || '친구 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('친구 삭제 실패:', error);
        alert(`친구 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
  };

  const startChat = (friend: Friend) => {
    // useWallet에서 현재 사용자 주소 가져오기
    if (!wallet?.addresses?.XRP) {
      alert('지갑 정보를 찾을 수 없습니다.');
      return;
    }

    const currentUserId = wallet.addresses.XRP;
    const roomId = generateRoomId(currentUserId, friend.xrplAddress);
    router.push(`/chat?roomId=${roomId}&friendId=${friend.id}&friendName=${encodeURIComponent(friend.name)}&friendAddress=${encodeURIComponent(friend.xrplAddress)}`);
  };

  // 두 사용자 간의 일관된 채팅방 ID 생성
  const generateRoomId = (userId1: string, userId2: string) => {
    const sortedIds = [userId1, userId2].sort();
    return `room_${sortedIds[0]}_${sortedIds[1]}`.replace(/[^a-zA-Z0-9_]/g, '_');
  };

  const sendMoney = (friend: Friend) => {
    // 전송 페이지로 이동 (친구 정보와 함께)
    router.push(`/transfer?to=${friend.xrplAddress}&friendName=${encodeURIComponent(friend.name)}`);
  };

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
        <h1 className="text-xl font-bold text-white">친구</h1>
        <button 
          onClick={() => setShowAddFriend(true)}
          className="text-[#F2A003] text-lg font-semibold"
        >
          + 추가
        </button>
      </div>

      {/* 친구 추가 모달 */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-80 max-w-sm mx-4">
            <h2 className="text-xl font-bold text-white mb-4">친구 추가</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이름
                </label>
                <Input
                  type="text"
                  placeholder="친구 이름"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  전화번호
                </label>
                <Input
                  type="tel"
                  placeholder="010-1234-5678"
                  value={newFriendPhone}
                  onChange={(e) => setNewFriendPhone(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowAddFriend(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                취소
              </Button>
              <Button
                onClick={addFriend}
                disabled={isLoading}
                className="flex-1 bg-[#F2A003] hover:bg-[#E09400] text-white"
              >
                {isLoading ? '추가 중...' : '추가'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 친구 리스트 */}
      <div className="p-6">
        {friends.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">친구가 없습니다</h3>
            <p className="text-gray-400 text-sm mb-4">전화번호로 친구를 추가해보세요!</p>
            <Button
              onClick={() => setShowAddFriend(true)}
              className="bg-[#F2A003] hover:bg-[#E09400] text-white px-6 py-2 rounded-lg"
            >
              친구 추가하기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div 
                key={friend.id}
                className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* 친구 정보 */}
                  <div className="flex items-center gap-4">
                    {/* 아바타 */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {friend.name.charAt(0)}
                      </div>
                      {friend.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    
                    {/* 친구 정보 */}
                    <div>
                      <div className="text-white font-semibold">{friend.name}</div>
                      <div className="text-gray-400 text-sm">{friend.phoneNumber}</div>
                      <div className="text-gray-500 text-xs font-mono">{friend.xrplAddress}</div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => startChat(friend)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      💬 채팅
                    </button>
                    <button
                      onClick={() => sendMoney(friend)}
                      className="px-3 py-2 bg-[#F2A003] hover:bg-[#E09400] text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      💰 전송
                    </button>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}