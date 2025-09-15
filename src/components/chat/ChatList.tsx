'use client';

import React from 'react';
import { useAtom } from 'jotai';
import { 
  chatRoomsAtom, 
  currentUserAtom, 
  unreadMessageCountAtom 
} from '@/store/chatAtoms';
import { ChatRoom } from '@/types/chat';

interface ChatListProps {
  onRoomSelect: (roomId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onRoomSelect }) => {
  const [chatRooms] = useAtom(chatRoomsAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [unreadCount] = useAtom(unreadMessageCountAtom);

  const formatLastMessageTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return '방금 전';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}분 전`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}시간 전`;
    } else if (diff < 604800000) { // Less than 1 week
      const days = Math.floor(diff / 86400000);
      return `${days}일 전`;
    } else {
      return timestamp.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getRoomTitle = (room: ChatRoom) => {
    if (room.type === 'direct') {
      // For direct chats, show the other participant's name
      const otherParticipant = room.participants.find(id => id !== currentUser?.id);
      return otherParticipant || room.name;
    }
    return room.name;
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'direct') {
      const otherParticipant = room.participants.find(id => id !== currentUser?.id);
      return otherParticipant?.charAt(0).toUpperCase() || '?';
    }
    return room.name.charAt(0).toUpperCase();
  };

  const getUnreadCount = (room: ChatRoom) => {
    // This would typically come from the API
    // For now, we'll simulate it
    return Math.floor(Math.random() * 5);
  };

  if (chatRooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p>아직 채팅방이 없습니다</p>
          <p className="text-sm">친구를 추가하고 대화를 시작해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">채팅</h1>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {unreadCount}
            </div>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.map((room) => {
          const unreadCount = getUnreadCount(room);
          const lastMessage = room.lastMessage;
          
          return (
            <div
              key={room.id}
              onClick={() => onRoomSelect(room.id)}
              className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {getRoomAvatar(room)}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>

              {/* Room Info */}
              <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {getRoomTitle(room)}
                  </h3>
                  {lastMessage && (
                    <span className="text-xs text-gray-500 ml-2">
                      {formatLastMessageTime(lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage ? (
                      lastMessage.type === 'xrp_transfer' ? (
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span>{lastMessage.metadata?.amount} XRP 전송</span>
                        </span>
                      ) : lastMessage.type === 'token_transfer' ? (
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          <span>{lastMessage.metadata?.tokenAmount} {lastMessage.metadata?.tokenId} 전송</span>
                        </span>
                      ) : lastMessage.type === 'image' ? (
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>사진</span>
                        </span>
                      ) : (
                        lastMessage.content
                      )
                    ) : (
                      '메시지가 없습니다'
                    )}
                  </p>
                  
                  {unreadCount > 0 && (
                    <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};