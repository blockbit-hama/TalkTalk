import React, { useEffect, useRef } from 'react';

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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTransferMessage = (message: Message) => {
    const { amount, currency, transactionHash } = message.metadata || {};
    
    return (
      <div className="bg-gradient-to-r from-[#F2A003] to-[#E09400] text-white p-4 rounded-2xl max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <span className="font-semibold text-sm">💰 전송 완료</span>
        </div>
        <div className="text-lg font-bold">{amount} {currency}</div>
        <div className="text-xs opacity-80 mt-1 font-mono">
          {transactionHash?.substring(0, 16)}...
        </div>
      </div>
    );
  };

  const renderTextMessage = (message: Message, isOwn: boolean) => {
    return (
      <div className={`p-3 rounded-2xl max-w-xs ${
        isOwn 
          ? 'bg-[#F2A003] text-white ml-auto' 
          : 'bg-white text-gray-900 border border-gray-200'
      }`}>
        <div className="text-sm">{message.content}</div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm">아직 메시지가 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">대화를 시작해보세요! 💬</p>
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          
          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className="flex items-end gap-2 max-w-xs">
                {/* 상대방 아바타 */}
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {message.sender.name.charAt(0)}
                  </div>
                )}
                
                {/* 메시지 내용 */}
                <div className="flex flex-col">
                  {message.type === 'xrp_transfer' || message.type === 'token_transfer' ? (
                    renderTransferMessage(message)
                  ) : (
                    renderTextMessage(message, isOwn)
                  )}
                  
                  {/* 시간 */}
                  <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                
                {/* 내 아바타 */}
                {isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    나
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}