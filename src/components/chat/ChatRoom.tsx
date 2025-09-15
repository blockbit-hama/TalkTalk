import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { ChatHeader } from './ChatHeader';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'xrp_transfer' | 'token_transfer' | 'image' | 'system';
  content: string;
  metadata?: {
    amount?: string;
    currency?: string;
    transactionHash?: string;
    imageUrl?: string;
    tokenId?: string;
    tokenAmount?: string;
  };
  timestamp: Date;
  isRead: boolean;
  sender: {
    id: string;
    name: string;
    isOnline: boolean;
  };
}

interface ChatRoomProps {
  roomId: string;
  friendName?: string;
}

export function ChatRoom({ roomId, friendName }: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId] = useState('current_user');

  useEffect(() => {
    loadMessages();
    
    // 채팅 메시지 추가 이벤트 리스너
    const handleMessageAdded = (event: CustomEvent) => {
      const newMessage = event.detail;
      if (newMessage.roomId === roomId) {
        setMessages(prev => [...prev, newMessage]);
      }
    };

    window.addEventListener('chatMessageAdded', handleMessageAdded as EventListener);
    return () => {
      window.removeEventListener('chatMessageAdded', handleMessageAdded as EventListener);
    };
  }, [roomId]);

  const loadMessages = () => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const allMessages = JSON.parse(savedMessages);
        const roomMessages = allMessages[roomId] || [];
        setMessages(roomMessages);
      } catch (error) {
        console.error('메시지 로드 실패:', error);
      }
    }
  };

  const handleSendMessage = async (content: string, type: 'text' | 'xrp_transfer' | 'token_transfer' = 'text', metadata?: any) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      roomId,
      senderId: currentUserId,
      type,
      content,
      metadata,
      timestamp: new Date(),
      isRead: false,
      sender: {
        id: currentUserId,
        name: '나',
        isOnline: true
      }
    };

    // localStorage에 메시지 저장
    const savedMessages = localStorage.getItem('chatMessages');
    const allMessages = savedMessages ? JSON.parse(savedMessages) : {};
    const roomMessages = allMessages[roomId] || [];
    roomMessages.push(newMessage);
    allMessages[roomId] = roomMessages;
    localStorage.setItem('chatMessages', JSON.stringify(allMessages));

    // 상태 업데이트
    setMessages(prev => [...prev, newMessage]);

    // 메시지 추가 이벤트 발생
    window.dispatchEvent(new CustomEvent('chatMessageAdded', { detail: newMessage }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ChatHeader roomId={roomId} friendName={friendName} />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}