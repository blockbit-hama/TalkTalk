'use client';

import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { 
  currentChatRoomAtom, 
  currentRoomMessagesAtom, 
  currentUserAtom,
  markMessagesAsReadAtom 
} from '@/store/chatAtoms';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';

interface ChatRoomProps {
  roomId: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  const [currentRoom, setCurrentRoom] = useAtom(currentChatRoomAtom);
  const [messages, setMessages] = useAtom(currentRoomMessagesAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [, markMessagesAsRead] = useAtom(markMessagesAsReadAtom);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load room data and messages
    // This would typically call the API
    const room = {
      id: roomId,
      name: 'Alice & Bob',
      type: 'direct' as const,
      participants: ['user1', 'user2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const roomMessages = [
      {
        id: 'msg1',
        roomId: roomId,
        senderId: 'user1',
        type: 'text' as const,
        content: '안녕하세요! XRP를 보내드릴게요.',
        timestamp: new Date(Date.now() - 300000),
        isRead: true,
        sender: { id: 'user1', name: 'Alice', isOnline: true },
      },
      {
        id: 'msg2',
        roomId: roomId,
        senderId: 'user2',
        type: 'text' as const,
        content: '감사합니다! 받았어요.',
        timestamp: new Date(Date.now() - 180000),
        isRead: true,
        sender: { id: 'user2', name: 'Bob', isOnline: true },
      },
      {
        id: 'msg3',
        roomId: roomId,
        senderId: 'user1',
        type: 'xrp_transfer' as const,
        content: 'XRP 전송',
        metadata: {
          amount: '10',
          currency: 'XRP',
          transactionHash: 'tx1234567890abcdef',
        },
        timestamp: new Date(Date.now() - 120000),
        isRead: false,
        sender: { id: 'user1', name: 'Alice', isOnline: true },
      },
    ];

    setCurrentRoom(room);
    setMessages(roomMessages);
  }, [roomId, setCurrentRoom, setMessages]);

  useEffect(() => {
    // Mark messages as read when room changes
    if (currentRoom && currentUser) {
      markMessagesAsRead(currentRoom.id);
    }
  }, [currentRoom, currentUser, markMessagesAsRead]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentRoom || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">채팅방을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <ChatHeader room={currentRoom} />
      
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} currentUserId={currentUser.id} />
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput roomId={roomId} />
    </div>
  );
};