"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ChatRoom {
  id: string;
  friendName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  friendId: string;
}

export default function ChatListPage() {
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    loadChatRooms();
    loadFriends();
  }, []);

  const loadFriends = () => {
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      try {
        const friendsData = JSON.parse(savedFriends);
        setFriends(friendsData);
      } catch (error) {
        console.error('친구 데이터 로드 실패:', error);
      }
    }
  };

  const loadChatRooms = () => {
    // 친구 목록을 기반으로 채팅방 생성
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      try {
        const friendsData = JSON.parse(savedFriends);
        const rooms: ChatRoom[] = friendsData.map((friend: any) => ({
          id: `room_${friend.id}`,
          friendName: friend.name,
          lastMessage: '아직 메시지가 없습니다',
          lastMessageTime: new Date(),
          unreadCount: 0,
          friendId: friend.id
        }));
        setChatRooms(rooms);
      } catch (error) {
        console.error('채팅방 데이터 로드 실패:', error);
      }
    }
  };

  const enterChatRoom = (room: ChatRoom) => {
    router.push(`/chat?friendId=${room.friendId}&friendName=${encodeURIComponent(room.friendName)}`);
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
        <h1 className="text-xl font-bold text-white">채팅</h1>
        <div className="w-16"></div>
      </div>

      {/* 채팅방 리스트 */}
      <div className="p-6">
        {chatRooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">채팅방이 없습니다</h3>
            <p className="text-gray-400 text-sm mb-4">친구를 추가하고 대화를 시작해보세요!</p>
            <button
              onClick={() => router.push('/friends')}
              className="bg-[#F2A003] hover:bg-[#E09400] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              친구 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {chatRooms.map((room) => (
              <div 
                key={room.id}
                onClick={() => enterChatRoom(room)}
                className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* 친구 아바타 */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {room.friendName.charAt(0)}
                    </div>
                    {room.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {room.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {/* 채팅방 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-semibold text-lg">{room.friendName}</h3>
                      <span className="text-gray-400 text-sm">
                        {room.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">{room.lastMessage}</p>
                  </div>
                  
                  {/* 화살표 아이콘 */}
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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