"use client";

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  type?: 'info' | 'success' | 'error' | 'warning';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
  showCloseButton = true
}) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 모바일에서 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          borderColor: 'border-green-500',
          iconBg: 'bg-green-500/20',
          iconColor: 'text-green-400'
        };
      case 'error':
        return {
          icon: '❌',
          borderColor: 'border-red-500',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-400'
        };
      case 'warning':
        return {
          icon: '⚠️',
          borderColor: 'border-yellow-500',
          iconBg: 'bg-yellow-500/20',
          iconColor: 'text-yellow-400'
        };
      default:
        return {
          icon: 'ℹ️',
          borderColor: 'border-blue-500',
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-400'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm custom-modal-overlay"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div
        className={`
          relative w-full max-w-sm mx-auto bg-gray-800 rounded-2xl shadow-2xl
          border ${typeStyles.borderColor} custom-modal-content
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              {/* 아이콘 */}
              <div className={`
                w-10 h-10 rounded-full ${typeStyles.iconBg}
                flex items-center justify-center text-lg
              `}>
                {typeStyles.icon}
              </div>
              {title && (
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="닫기"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="px-6 pb-6">
          <div className="text-gray-300 leading-relaxed">
            {children}
          </div>
        </div>

        {/* 하단 그라데이션 */}
        <div className={`
          absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl
          bg-gradient-to-r from-transparent via-${typeStyles.borderColor.replace('border-', '')} to-transparent
        `} />
      </div>
    </div>
  );
};

// 간단한 알럼 훅
interface UseModalReturn {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useModal = (): UseModalReturn => {
  const [isOpen, setIsOpen] = React.useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal
  };
};

// 알럼용 컴포넌트
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  title?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  message,
  type = 'info',
  title
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} type={type} title={title}>
      <div className="whitespace-pre-line">
        {message}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-[#F2A003] hover:bg-[#E09400] text-white font-medium rounded-lg transition-colors"
        >
          확인
        </button>
      </div>
    </Modal>
  );
};