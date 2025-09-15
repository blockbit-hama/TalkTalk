"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatRoom } from '@/components/chat/ChatRoom';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [friendId, setFriendId] = useState<string | null>(null);
  const [friendName, setFriendName] = useState<string>('');

  useEffect(() => {
    const friendIdParam = searchParams.get('friendId');
    const friendNameParam = searchParams.get('friendName');
    
    if (friendIdParam && friendNameParam) {
      setFriendId(friendIdParam);
      setFriendName(decodeURIComponent(friendNameParam));
    } else {
      // 친구 정보가 없으면 채팅방 리스트로 이동
      router.push('/chat-list');
    }
  }, [searchParams, router]);

  if (!friendId || !friendName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <ChatRoom roomId={`room_${friendId}`} friendName={friendName} />
    </div>
  );
}