"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "../../components/molecules/TabBar";
import { deleteWallet } from "../../lib/wallet-utils";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { WalletInfo } from "../../components/WalletInfo";
import { requestXRPFromFaucet } from "../../lib/api/faucet";

export default function SettingsPage() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [faucetLoading, setFaucetLoading] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{phoneNumber: string, userName: string} | null>(null);

  // 새로운 atoms hooks 사용
  const { walletList, refreshWalletList } = useWalletList();

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = () => {
      const phoneNumber = sessionStorage.getItem('userPhoneNumber');
      const userName = sessionStorage.getItem('userName');
      
      if (phoneNumber && userName) {
        setUserInfo({ phoneNumber, userName });
      }
    };

    loadUserInfo();

    // 사용자 정보 업데이트 이벤트 리스너
    const handleUserInfoUpdate = () => {
      loadUserInfo();
    };

    window.addEventListener('userInfoUpdated', handleUserInfoUpdate);
    return () => {
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate);
    };
  }, []);

  // 전화번호 등록 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenPhoneModal = () => {
      // 홈페이지로 이동하여 전화번호 등록 모달 열기
      router.push('/');
      // 약간의 지연 후 모달 열기
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openPhoneModal'));
      }, 100);
    };

    window.addEventListener('openPhoneModal', handleOpenPhoneModal);
    return () => {
      window.removeEventListener('openPhoneModal', handleOpenPhoneModal);
    };
  }, [router]);

  const handleDeleteWallet = (walletId: string) => {
    try {
      deleteWallet(walletId);
      refreshWalletList(); // 지갑 목록 새로고침
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('지갑 삭제 실패:', error);
    }
  };

  const handleFaucetRequest = async (wallet: any) => {
    try {
      setFaucetLoading(wallet.id);

      const address = wallet.masterAddress || wallet.addresses?.XRP;
      if (!address) {
        alert('지갑 주소를 찾을 수 없습니다.');
        return;
      }

      console.log('🚰 Faucet 요청:', address);
      const result = await requestXRPFromFaucet(address, 'devnet');

      if (result.success) {
        alert(`성공! ${result.message}`);
        refreshWalletList(); // 잔액 새로고침을 위해 호출
      } else {
        alert(`실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Faucet 요청 실패:', error);
      alert('Faucet 요청 중 오류가 발생했습니다.');
    } finally {
      setFaucetLoading(null);
    }
  };

  const settingsOptions = [
    {
      title: "사용자 정보",
      items: [
        {
          label: "전화번호",
          description: userInfo ? userInfo.phoneNumber : "등록되지 않음",
          icon: "📱",
          action: () => {
            if (!userInfo) {
              // 전화번호 등록 모달 열기
              window.dispatchEvent(new CustomEvent('openPhoneModal'));
            }
          },
          color: userInfo ? "#26A17B" : "#F2A003"
        },
        {
          label: "사용자 이름",
          description: userInfo ? userInfo.userName : "등록되지 않음",
          icon: "👤",
          action: () => {
            if (!userInfo) {
              // 전화번호 등록 모달 열기
              window.dispatchEvent(new CustomEvent('openPhoneModal'));
            }
          },
          color: userInfo ? "#26A17B" : "#F2A003"
        }
      ]
    },
    {
      title: "지갑 관리",
      items: [
        {
          label: "계정 등록",
          description: "전화번호와 이름으로 계정을 등록합니다",
          icon: "📱",
          action: () => {
            // 전화번호 등록 모달 열기
            window.dispatchEvent(new CustomEvent('openPhoneModal'));
          },
          color: "#F2A003"
        },
        {
          label: "지갑 복구",
          description: "기존 니모닉으로 지갑을 복구합니다",
          icon: "🔓",
          action: () => router.push('/recover-wallet'),
          color: "#26A17B"
        }
      ]
    },
    {
      title: "개발자 도구",
      items: [
        {
          label: "Faucet (테스트용 XRP)",
          description: "개발용 XRP를 무료로 받아보세요",
          icon: "🚰",
          action: () => {
            // Faucet 기능은 지갑별로 처리되므로 여기서는 안내만
            alert('아래 지갑 목록에서 각 지갑별로 Faucet 버튼을 눌러주세요.');
          },
          color: "#3B82F6"
        }
      ]
    },
    {
      title: "보안",
      items: [
        {
          label: "니모닉 백업",
          description: "지갑의 복구 문구를 확인합니다",
          icon: "🔐",
          action: () => alert('니모닉 백업 기능은 추후 구현 예정입니다.'),
          color: "#F2A003"
        },
        {
          label: "지갑 잠금",
          description: "지갑을 잠그고 로그아웃합니다",
          icon: "🔒",
          action: () => alert('지갑 잠금 기능은 추후 구현 예정입니다.'),
          color: "#EB5757"
        }
      ]
    },
    {
      title: "앱 정보",
      items: [
        {
          label: "버전 정보",
          description: "앱 버전: 1.0.0",
          icon: "ℹ️",
          action: () => {},
          color: "#A0A0B0"
        },
        {
          label: "개발자 정보",
          description: "BlockBit Team",
          icon: "👨‍💻",
          action: () => {},
          color: "#A0A0B0"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col relative font-inherit" style={{ background: '#1A1A1A' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <button 
          onClick={() => router.back()}
          className="text-white text-lg font-bold"
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-white">설정</h1>
        <div className="w-8"></div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 p-6 max-w-md mx-auto w-full space-y-8">
        {/* 지갑 정보 컴포넌트 */}
        <WalletInfo />
        {/* 설정 옵션들 */}
        {settingsOptions.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <h2 className="text-lg font-bold text-white">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.action}
                  className="w-full bg-gray-800 p-4 rounded-xl text-left hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{item.label}</div>
                      <div className="text-gray-400 text-sm">{item.description}</div>
                    </div>
                    <div className="text-gray-400">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 지갑 목록 */}
        {walletList.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">내 지갑</h2>
            <div className="space-y-3">
              {walletList.map((wallet) => (
                <div
                  key={wallet.id}
                  className="bg-gray-800 p-4 rounded-xl border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{wallet.name}</div>
                      <div className="text-gray-400 text-sm">
                        생성: {new Date(wallet.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500 text-xs font-mono mt-1 break-all">
                        {wallet.masterAddress || wallet.addresses?.XRP || 'No address'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Faucet 버튼 */}
                      <button
                        onClick={() => handleFaucetRequest(wallet)}
                        disabled={faucetLoading === wallet.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        {faucetLoading === wallet.id ? '🔄' : '🚰 Faucet'}
                      </button>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => setShowDeleteConfirm(wallet.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* 삭제 확인 다이얼로그 */}
                  {showDeleteConfirm === wallet.id && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                      <div className="text-red-400 text-sm mb-3">
                        정말로 이 지갑을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 bg-gray-600 text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleDeleteWallet(wallet.id)}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 탭바 */}
      <TabBar />
    </div>
  );
} 