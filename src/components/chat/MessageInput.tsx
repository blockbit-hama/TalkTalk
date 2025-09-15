'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  messageInputAtom, 
  sendMessageAtom, 
  currentUserAtom,
  sendXRPAtom 
} from '@/store/chatAtoms';
import { sendXRPAtom as sendXRPLAtom } from '@/store/xrplAtoms';

interface MessageInputProps {
  roomId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ roomId }) => {
  const [inputValue, setInputValue] = useAtom(messageInputAtom);
  const [, sendMessage] = useAtom(sendMessageAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [, sendXRP] = useAtom(sendXRPLAtom);
  
  const [showXRPTransfer, setShowXRPTransfer] = useState(false);
  const [xrpAmount, setXrpAmount] = useState('');
  const [isSendingXRP, setIsSendingXRP] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    await sendMessage({
      roomId,
      content: inputValue.trim(),
      type: 'text',
    });

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendXRP = async () => {
    if (!xrpAmount || !currentUser || isSendingXRP) return;

    setIsSendingXRP(true);
    
    try {
      // Get the other participant's address (simplified)
      const recipientAddress = 'rBob123456789012345678901234567890123456';
      
      const transaction = await sendXRP({
        to: recipientAddress,
        amount: xrpAmount,
        memo: `채팅에서 전송: ${xrpAmount} XRP`,
      });

      if (transaction) {
        await sendMessage({
          roomId,
          content: `${xrpAmount} XRP 전송`,
          type: 'xrp_transfer',
          metadata: {
            amount: xrpAmount,
            currency: 'XRP',
            transactionHash: transaction.hash,
          },
        });
      }

      setXrpAmount('');
      setShowXRPTransfer(false);
    } catch (error) {
      console.error('XRP 전송 실패:', error);
    } finally {
      setIsSendingXRP(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle file upload (simplified)
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
      sendMessage({
        roomId,
        content: '이미지',
        type: 'image',
        metadata: { imageUrl },
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* XRP Transfer Modal */}
      {showXRPTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">XRP 전송</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전송할 XRP 양
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={xrpAmount}
                  onChange={(e) => setXrpAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.000000"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                수수료: 0.000012 XRP
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowXRPTransfer(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSendingXRP}
              >
                취소
              </button>
              <button
                onClick={handleSendXRP}
                disabled={!xrpAmount || isSendingXRP}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingXRP ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="w-full px-4 py-3 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* XRP Transfer Button */}
        <button
          onClick={() => setShowXRPTransfer(true)}
          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
          title="XRP 전송"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </button>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};