"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatRoom } from '@/components/chat/ChatRoom';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [friendName, setFriendName] = useState<string>('');
  const [friendAddress, setFriendAddress] = useState<string>('');

  useEffect(() => {
    const roomIdParam = searchParams.get('roomId');
    const friendIdParam = searchParams.get('friendId');
    const friendNameParam = searchParams.get('friendName');
    const friendAddressParam = searchParams.get('friendAddress');

    if (roomIdParam && friendIdParam && friendNameParam) {
      setRoomId(roomIdParam);
      setFriendId(friendIdParam);
      setFriendName(decodeURIComponent(friendNameParam));
      if (friendAddressParam) {
        setFriendAddress(decodeURIComponent(friendAddressParam));
      }
    } else {
      // 필요한 정보가 없으면 친구 목록으로 이동
      router.push('/friends');
    }
  }, [searchParams, router]);

  if (!roomId || !friendId || !friendName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <ChatRoom roomId={roomId} friendName={friendName} friendAddress={friendAddress} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}