import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'xrp_transfer' | 'token_transfer', metadata?: any) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* 이모지 버튼 */}
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => {
            const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            setMessage(prev => prev + randomEmoji);
          }}
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* 메시지 입력 */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="w-full px-4 py-3 bg-gray-100 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#F2A003] focus:bg-white transition-colors"
          />
        </div>

        {/* 전송 버튼 */}
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-3 rounded-full transition-colors ${
            message.trim()
              ? 'bg-[#F2A003] hover:bg-[#E09400] text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      {/* 빠른 응답 버튼들 */}
      <div className="flex gap-2 mt-3">
        {['👍', '❤️', '😂', '🎉'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendMessage(emoji)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <span className="text-lg">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}