'use client';

import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { currentUserAtom } from '@/store/chatAtoms';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { FriendList } from '@/components/chat/FriendList';

type ViewMode = 'chat' | 'room' | 'friends';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize current user (simplified)
    if (!currentUser) {
      setCurrentUser({
        id: 'user1',
        name: 'Alice',
        avatar: '/avatars/alice.jpg',
        xrplAddress: 'rAlice123456789012345678901234567890123456',
        isOnline: true,
        lastSeen: new Date(),
      });
    }
  }, [currentUser, setCurrentUser]);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setViewMode('room');
  };

  const handleFriendSelect = (friendId: string) => {
    // Create or navigate to direct chat room
    setSelectedRoomId(`room_${friendId}`);
    setViewMode('room');
  };

  const handleBackToChat = () => {
    setViewMode('chat');
    setSelectedRoomId(null);
  };

  const handleBackToFriends = () => {
    setViewMode('friends');
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (viewMode === 'room') {
                handleBackToChat();
              } else if (viewMode === 'friends') {
                setViewMode('chat');
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">
            {viewMode === 'chat' && '채팅'}
            {viewMode === 'room' && '대화'}
            {viewMode === 'friends' && '친구'}
          </h1>
          
          <button
            onClick={() => setViewMode('friends')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white">
          <div className="h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setViewMode('chat')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  viewMode === 'chat'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                채팅
              </button>
              <button
                onClick={() => setViewMode('friends')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  viewMode === 'friends'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                친구
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'chat' && (
                <ChatList onRoomSelect={handleRoomSelect} />
              )}
              {viewMode === 'friends' && (
                <FriendList onFriendSelect={handleFriendSelect} />
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {viewMode === 'room' && selectedRoomId ? (
            <ChatRoom roomId={selectedRoomId} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p>채팅방을 선택하세요</p>
                <p className="text-sm">친구와 대화를 시작해보세요!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full">
        {viewMode === 'chat' && (
          <ChatList onRoomSelect={handleRoomSelect} />
        )}
        {viewMode === 'room' && selectedRoomId && (
          <ChatRoom roomId={selectedRoomId} />
        )}
        {viewMode === 'friends' && (
          <FriendList onFriendSelect={handleFriendSelect} />
        )}
      </div>
    </div>
  );
}