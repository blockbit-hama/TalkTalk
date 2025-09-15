import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'xrp_transfer' | 'token_transfer', metadata?: any) => void;
  isLoading?: boolean;
  recipientAddress?: string;
}

export function MessageInput({ onSendMessage, isLoading = false, recipientAddress }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showXRPModal, setShowXRPModal] = useState(false);
  const [xrpAmount, setXrpAmount] = useState('');

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
    <div className="bg-white border-t border-gray-200 p-4" style={{ background: '#FFFFFF' }}>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* XRP 전송 버튼 */}
        <button
          type="button"
          className="p-2 hover:bg-orange-100 rounded-full transition-colors text-[#F2A003]"
          onClick={() => setShowXRPModal(true)}
          title="XRP 전송"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>

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
            className="w-full px-4 py-3 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#F2A003] focus:bg-white transition-colors"
          />
        </div>

        {/* 전송 버튼 */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`p-3 rounded-full transition-colors ${
            message.trim() && !isLoading
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

      {/* XRP 전송 모달 */}
      {showXRPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">XRP 전송</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">전송 금액 (XRP)</label>
                <input
                  type="number"
                  value={xrpAmount}
                  onChange={(e) => setXrpAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2A003] text-gray-900"
                  step="0.000001"
                  min="0.000001"
                />
              </div>

              {recipientAddress && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">받는 사람</label>
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-600 font-mono">{recipientAddress}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowXRPModal(false);
                  setXrpAmount('');
                }}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (xrpAmount && parseFloat(xrpAmount) > 0) {
                    onSendMessage(
                      `${xrpAmount} XRP 전송`,
                      'xrp_transfer',
                      {
                        amount: xrpAmount,
                        currency: 'XRP',
                        recipient: recipientAddress || 'Unknown'
                      }
                    );
                    setShowXRPModal(false);
                    setXrpAmount('');
                  }
                }}
                disabled={!xrpAmount || parseFloat(xrpAmount) <= 0}
                className="flex-1 py-3 px-4 bg-[#F2A003] text-white rounded-lg font-medium hover:bg-[#E09400] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}