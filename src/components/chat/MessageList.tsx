'use client';

import React from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const groupMessages = (messages: Message[]) => {
    const grouped: Message[][] = [];
    let currentGroup: Message[] = [];
    
    messages.forEach((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      
      // Start a new group if:
      // 1. First message
      // 2. Different sender
      // 3. Time gap > 5 minutes
      if (
        !prevMessage ||
        message.senderId !== prevMessage.senderId ||
        message.timestamp.getTime() - prevMessage.timestamp.getTime() > 300000
      ) {
        if (currentGroup.length > 0) {
          grouped.push([...currentGroup]);
        }
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      grouped.push(currentGroup);
    }
    
    return grouped;
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 86400000) { // Less than 1 day
      return timestamp.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return timestamp.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  const groupedMessages = groupMessages(messages);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p>아직 메시지가 없습니다</p>
          <p className="text-sm">첫 메시지를 보내보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {groupedMessages.map((group, groupIndex) => {
        const firstMessage = group[0];
        const isCurrentUser = firstMessage.senderId === currentUserId;
        
        return (
          <div key={groupIndex} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
              {/* Sender info for other users */}
              {!isCurrentUser && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {firstMessage.sender.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {firstMessage.sender.name}
                  </span>
                </div>
              )}
              
              {/* Message bubbles */}
              <div className="space-y-1">
                {group.map((message, messageIndex) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={isCurrentUser}
                    showTime={messageIndex === group.length - 1}
                    timeText={formatTime(message.timestamp)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};