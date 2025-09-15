'use client';

import React from 'react';
import { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showTime: boolean;
  timeText: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser, 
  showTime, 
  timeText 
}) => {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        );
        
      case 'xrp_transfer':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <span className="font-medium text-blue-600">XRP 전송</span>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-blue-900">
                    {message.metadata?.amount} XRP
                  </div>
                  <div className="text-sm text-blue-700">
                    {message.metadata?.transactionHash && (
                      <span>TX: {message.metadata.transactionHash.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600">
                    {isCurrentUser ? '전송됨' : '받음'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'token_transfer':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="font-medium text-green-600">토큰 전송</span>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-green-900">
                    {message.metadata?.tokenAmount} {message.metadata?.tokenId}
                  </div>
                  <div className="text-sm text-green-700">
                    {message.metadata?.transactionHash && (
                      <span>TX: {message.metadata.transactionHash.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">
                    {isCurrentUser ? '전송됨' : '받음'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-2">
            <div className="relative">
              <img 
                src={message.metadata?.imageUrl} 
                alt="이미지" 
                className="max-w-xs rounded-lg"
              />
            </div>
            {message.content && (
              <div className="text-sm text-gray-600">
                {message.content}
              </div>
            )}
          </div>
        );
        
      case 'system':
        return (
          <div className="text-center text-sm text-gray-500 italic">
            {message.content}
          </div>
        );
        
      default:
        return <div>{message.content}</div>;
    }
  };

  const getBubbleStyles = () => {
    const baseStyles = "px-4 py-2 rounded-2xl max-w-full";
    
    if (message.type === 'system') {
      return "px-2 py-1 text-center";
    }
    
    if (isCurrentUser) {
      return `${baseStyles} bg-blue-500 text-white rounded-br-md`;
    } else {
      return `${baseStyles} bg-gray-100 text-gray-900 rounded-bl-md`;
    }
  };

  return (
    <div className="flex flex-col">
      <div className={getBubbleStyles()}>
        {renderMessageContent()}
      </div>
      
      {showTime && (
        <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {timeText}
        </div>
      )}
    </div>
  );
};