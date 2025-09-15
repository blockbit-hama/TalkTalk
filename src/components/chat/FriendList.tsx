'use client';

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { 
  friendsAtom, 
  currentUserAtom, 
  onlineFriendsAtom,
  createChatRoomAtom 
} from '@/store/chatAtoms';

interface FriendListProps {
  onFriendSelect?: (friendId: string) => void;
}

export const FriendList: React.FC<FriendListProps> = ({ onFriendSelect }) => {
  const [friends] = useAtom(friendsAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [onlineFriends] = useAtom(onlineFriendsAtom);
  const [, createChatRoom] = useAtom(createChatRoomAtom);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendAddress, setNewFriendAddress] = useState('');

  const filteredFriends = friends.filter(friend =>
    friend.friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.friend.xrplAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async (friend: any) => {
    if (onFriendSelect) {
      onFriendSelect(friend.friend.id);
    } else {
      // Create direct chat room
      const room = await createChatRoom({
        name: friend.friend.name,
        type: 'direct',
        participants: [friend.friend.id],
      });
      
      if (room) {
        // Navigate to chat room
        console.log('Created chat room:', room);
      }
    }
  };

  const handleAddFriend = () => {
    if (!newFriendAddress.trim()) return;
    
    // This would typically call the API to add a friend
    console.log('Adding friend with address:', newFriendAddress);
    setNewFriendAddress('');
    setShowAddFriend(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">친구</h1>
          <button
            onClick={() => setShowAddFriend(true)}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="친구 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Online Friends Section */}
      {onlineFriends.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 mb-3">온라인 친구</h2>
          <div className="flex space-x-3 overflow-x-auto">
            {onlineFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => handleStartChat(friend)}
                className="flex flex-col items-center space-y-2 cursor-pointer min-w-[60px]"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {friend.friend.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs text-gray-600 text-center truncate w-full">
                  {friend.friend.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Friends */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p>친구가 없습니다</p>
              <p className="text-sm">친구를 추가해보세요!</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => handleStartChat(friend)}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {friend.friend.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {friend.friend.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 ml-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {friend.nickname || friend.friend.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {friend.friend.isOnline ? '온라인' : '오프라인'}
                    </span>
                  </div>
                  
                  {friend.friend.xrplAddress && (
                    <p className="text-sm text-gray-600 truncate">
                      {friend.friend.xrplAddress.slice(0, 20)}...
                    </p>
                  )}
                </div>
                
                <button className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">친구 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  XRPL 주소 또는 사용자명
                </label>
                <input
                  type="text"
                  value={newFriendAddress}
                  onChange={(e) => setNewFriendAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="rFriend123456789012345678901234567890123456"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddFriend(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddFriend}
                disabled={!newFriendAddress.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};