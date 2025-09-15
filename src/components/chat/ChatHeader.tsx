import React from 'react';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  roomId: string;
  friendName?: string;
}

export function ChatHeader({ roomId, friendName }: ChatHeaderProps) {
  const router = useRouter();

  const handleSendMoney = () => {
    if (friendName) {
      router.push(`/transfer?friendName=${encodeURIComponent(friendName)}`);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.push('/chat-list')}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 친구 정보 */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {friendName?.charAt(0) || '👤'}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{friendName || '친구'}</h1>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">온라인</span>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSendMoney}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="돈 보내기"
        >
          <svg className="w-6 h-6 text-[#F2A003]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </button>
        
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="더보기"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}