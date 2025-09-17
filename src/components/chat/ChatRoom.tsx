import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { ChatHeader } from './ChatHeader';
import { useWallet } from '../../hooks/useWallet';

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
  friendAddress?: string;
}

export function ChatRoom({ roomId, friendName, friendAddress }: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string>();
  const { wallet } = useWallet();

  // 현재 사용자 ID 설정 (지갑 주소)
  useEffect(() => {
    if (wallet?.addresses?.XRP) {
      setCurrentUserId(wallet.addresses.XRP);
      console.log('현재 사용자 ID 설정:', wallet.addresses.XRP);
    }
  }, [wallet]);

  // 친구 주소를 수신자 주소로 설정
  useEffect(() => {
    if (friendAddress) {
      setRecipientAddress(friendAddress);
      console.log('수신자 주소 설정:', friendAddress);
    }
  }, [friendAddress]);

  useEffect(() => {
    if (currentUserId && roomId) {
      loadMessages();

      // 폴링으로 메시지 동기화 (2초마다)
      const pollInterval = setInterval(() => {
        loadMessages();
      }, 2000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [roomId, currentUserId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const roomMessages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(roomMessages);

          // 상대방의 XRP 주소 추출 (자신이 아닌 다른 사용자)
          const otherUsers = roomMessages
            .filter((msg: any) => msg.senderId !== currentUserId)
            .map((msg: any) => msg.sender);

          if (otherUsers.length > 0 && otherUsers[0].xrpAddress) {
            setRecipientAddress(otherUsers[0].xrpAddress);
          }
        }
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    }
  };

  const handleSendMessage = async (content: string, type: 'text' | 'xrp_transfer' | 'token_transfer' = 'text', metadata?: any) => {
    if (isLoading || !currentUserId) return;

    setIsLoading(true);

    try {
      const messageData = {
        senderId: currentUserId,
        senderName: wallet?.name || '나',
        senderXrpAddress: currentUserId, // currentUserId가 이미 XRP 주소
        type,
        content,
        metadata
      };

      console.log('메시지 전송 데이터:', messageData);

      const response = await fetch(`/api/chat/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 메시지 전송 성공 후 즉시 새로고침
          await loadMessages();
        } else {
          console.error('메시지 전송 실패:', data.error);
        }
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ChatHeader roomId={roomId} friendName={friendName} />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} recipientAddress={recipientAddress} />
    </div>
  );
}