"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { useEnabledAssets } from "../../hooks/useWalletAtoms";
import { xrplBatchV2, BatchPaymentItem } from "../../lib/xrpl/xrpl-batch-v2";
import { walletUtilsV2 } from "../../lib/xrpl/wallet-utils-v2";
import { Button, Input, Card } from "../../components/ui";

interface Friend {
  id: string;
  name: string;
  phoneNumber: string;
  xrplAddress: string;
  isOnline: boolean;
}

interface SelectedFriend extends Friend {
  amount: string;
  isSelected: boolean;
}

type BatchMode = 'Independent' | 'AllOrNothing' | 'UntilFailure';

export default function BatchPaymentV2Page() {
  const router = useRouter();
  const { selectedWallet, isLoading: isWalletLoading } = useWalletList();
  const { enabledAssets } = useEnabledAssets();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<SelectedFriend[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedMode, setSelectedMode] = useState<BatchMode>('Independent');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  // 친구 목록 로드
  useEffect(() => {
    loadFriendsFromServer();
  }, []);

  // 잔액 검증
  useEffect(() => {
    if (selectedFriends.length > 0 && selectedCurrency) {
      validateBalances();
    }
  }, [selectedFriends, selectedCurrency]);

  const loadFriendsFromServer = async () => {
    try {
      setIsLoadingFriends(true);
      console.log('🔍 일괄전송용 친구 목록 조회 시작');
      
      const userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
      if (!userPhoneNumber) {
        console.warn('❌ 사용자 전화번호를 찾을 수 없습니다.');
        setFriends([]);
        return;
      }
      
      const apiUrl = `/api/friends?userPhone=${encodeURIComponent(userPhoneNumber)}`;
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      if (response.ok && result.success) {
        const serverFriends = result.friends.map((friend: any, index: number) => ({
          id: `friend_${index}`,
          name: friend.userName,
          phoneNumber: friend.phoneNumber,
          xrplAddress: friend.walletAddress,
          isOnline: friend.isOnline || false
        }));

        setFriends(serverFriends);
        console.log(`✅ 친구 목록 로드 완료: ${serverFriends.length}명`);
      } else {
        console.warn('❌ 친구 목록 조회 실패:', result.error);
        setFriends([]);
      }
    } catch (error) {
      console.error('❌ 친구 데이터 로드 실패:', error);
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const validateBalances = async () => {
    if (!selectedWallet || selectedFriends.length === 0 || !selectedCurrency) {
      setValidationResult(null);
      return;
    }

    try {
      const batchPayments: BatchPaymentItem[] = selectedFriends.map(friend => ({
        to: friend.xrplAddress,
        amount: friend.amount,
        currency: selectedCurrency,
        memo: `${friend.name}에게 일괄전송`
      }));

      const result = await xrplBatchV2.validateBalances(batchPayments);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ valid: false, error: '잔액 검증 실패' });
    }
  };

  const toggleFriendSelection = (friend: Friend) => {
    setSelectedFriends(prev => {
      const existing = prev.find(f => f.id === friend.id);
      if (existing) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, {
          ...friend,
          amount: '',
          isSelected: true
        }];
      }
    });
  };

  const updateFriendAmount = (friendId: string, amount: string) => {
    setSelectedFriends(prev => 
      prev.map(friend => 
        friend.id === friendId 
          ? { ...friend, amount }
          : friend
      )
    );
  };

  const removeSelectedFriend = (friendId: string) => {
    setSelectedFriends(prev => prev.filter(f => f.id !== friendId));
  };

  // 표준 예제 기반 일괄 전송 실행
  const handleBatchTransfer = async () => {
    if (!selectedWallet) {
      alert('지갑을 선택해주세요.');
      return;
    }

    if (!selectedCurrency) {
      alert('자산을 선택해주세요.');
      return;
    }

    if (selectedFriends.length === 0) {
      alert('전송할 친구를 선택해주세요.');
      return;
    }

    // 금액 검증
    const invalidFriends = selectedFriends.filter(f => !f.amount || parseFloat(f.amount) <= 0);
    if (invalidFriends.length > 0) {
      alert('모든 친구의 금액을 입력해주세요.');
      return;
    }

    // 잔액 검증
    if (validationResult && !validationResult.valid) {
      alert(`잔액 검증 실패: ${validationResult.error}`);
      return;
    }

    setIsLoading(true);

    try {
      // 현재 사용자의 전화번호 가져오기
      const userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
      if (!userPhoneNumber) {
        alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // Redis에서 개인키 가져오기
      const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(userPhoneNumber)}`);
      const result = await response.json();
      
      if (!response.ok || !result.success || !result.user?.privateKey) {
        alert('개인키를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      console.log('🚀 XRPL 네이티브 Batch 전송 시작:', {
        친구수: selectedFriends.length,
        자산: selectedCurrency,
        모드: selectedMode,
        개인키존재: !!result.user.privateKey
      });

      // XRPL Batch Payment 아이템 생성
      const batchPayments: BatchPaymentItem[] = selectedFriends.map(friend => ({
        to: friend.xrplAddress,
        amount: friend.amount,
        currency: selectedCurrency,
        memo: `${friend.name}에게 일괄전송`
      }));

      // XRPL 네이티브 Batch 전송 실행
      await xrplBatchV2.setWallet(result.user.privateKey);
      
      const batchResult = await xrplBatchV2.executeBatchPayments(batchPayments, selectedMode);

      console.log('📦 XRPL 네이티브 Batch 전송 결과:', batchResult);

      // 결과 표시
      const message = `XRPL 네이티브 Batch 전송 완료!\n모드: ${selectedMode}\n성공: ${batchResult.totalSuccessful}명\n실패: ${batchResult.totalFailed}명\n트랜잭션 해시: ${batchResult.batchTransactionHash}`;
      alert(message);

      // 전송 완료 이벤트 발생
      window.dispatchEvent(new CustomEvent('transferCompleted', {
        detail: { 
          type: 'batch-v2',
          mode: selectedMode,
          successCount: batchResult.totalSuccessful,
          failCount: batchResult.totalFailed,
          results: batchResult.results,
          batchTransactionHash: batchResult.batchTransactionHash
        }
      }));

      // 홈으로 이동
      router.push('/');

    } catch (error) {
      console.error('XRPL 네이티브 Batch 전송 실패:', error);
      alert(`XRPL 네이티브 Batch 전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 활성화된 자산 목록 생성
  const availableAssets = enabledAssets.map(asset => ({
    symbol: asset,
    name: asset === 'XRP' ? 'XRP' : asset,
  }));

  // Batch 모드 설명
  const batchModeDescriptions = {
    'Independent': '모든 전송을 독립적으로 실행 (일부 실패해도 나머지는 계속 실행)',
    'AllOrNothing': '모든 전송이 성공해야만 커밋 (하나라도 실패하면 전체 롤백)',
    'UntilFailure': '순차 실행하다가 첫 실패 시 중단 (실패 지점까지는 실행됨)'
  };

  if (isWalletLoading || isLoadingFriends) {
    return (
      <div className="min-h-screen w-full flex flex-col relative font-inherit" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!selectedWallet) {
    return (
      <div className="min-h-screen w-full flex flex-col relative font-inherit" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-lg">지갑을 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-xl font-bold text-white">일괄 전송 V2 (표준)</h1>
        <div className="w-8"></div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <div className="space-y-6">
          {/* Batch 모드 선택 */}
          <div>
            <label className="block text-white font-semibold mb-3">Batch 모드 선택</label>
            <div className="space-y-2">
              {(['Independent', 'AllOrNothing', 'UntilFailure'] as BatchMode[]).map((mode) => (
                <div key={mode} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id={mode}
                    name="batchMode"
                    value={mode}
                    checked={selectedMode === mode}
                    onChange={() => setSelectedMode(mode)}
                    className="w-4 h-4 text-[#F2A003] bg-gray-700 border-gray-600 rounded focus:ring-[#F2A003] focus:ring-2 mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor={mode} className="text-white font-medium cursor-pointer">
                      {mode}
                    </label>
                    <p className="text-gray-400 text-sm mt-1">
                      {batchModeDescriptions[mode]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 자산 선택 */}
          <div>
            <label className="block text-white font-semibold mb-3">자산 선택</label>
            <div className="grid grid-cols-2 gap-3">
              {availableAssets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedCurrency(asset.symbol)}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    selectedCurrency === asset.symbol
                      ? 'border-[#F2A003] bg-[#F2A003]/10'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="text-white font-bold text-lg">{asset.symbol}</div>
                  <div className="text-gray-400 text-sm">{asset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 친구 목록 */}
          <div>
            <label className="block text-white font-semibold mb-3">친구 선택</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">친구가 없습니다</div>
                  <div className="text-gray-500 text-xs mt-1">먼저 친구를 추가해주세요</div>
                </div>
              ) : (
                friends.map((friend) => (
                  <div 
                    key={friend.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedFriends.find(f => f.id === friend.id)
                        ? 'border-[#F2A003] bg-[#F2A003]/10'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                    }`}
                    onClick={() => toggleFriendSelection(friend)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={!!selectedFriends.find(f => f.id === friend.id)}
                          onChange={() => toggleFriendSelection(friend)}
                          className="w-4 h-4 text-[#F2A003] bg-gray-700 border-gray-600 rounded focus:ring-[#F2A003] focus:ring-2"
                        />
                        <div>
                          <div className="text-white font-semibold">{friend.name}</div>
                          <div className="text-gray-400 text-sm">{friend.phoneNumber}</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {friend.isOnline ? '🟢' : '🔴'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 선택된 친구들 */}
          {selectedFriends.length > 0 && (
            <div>
              <label className="block text-white font-semibold mb-3">
                선택된 친구 ({selectedFriends.length}명)
              </label>
              <div className="space-y-3">
                {selectedFriends.map((friend) => (
                  <div key={friend.id} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-white font-semibold">{friend.name}</div>
                        <div className="text-gray-400 text-sm">{friend.phoneNumber}</div>
                      </div>
                      <button
                        onClick={() => removeSelectedFriend(friend.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <Input
                      type="number"
                      value={friend.amount}
                      onChange={(e) => updateFriendAmount(friend.id, e.target.value)}
                      placeholder="금액 입력"
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 잔액 검증 결과 */}
          {validationResult && (
            <div className={`p-3 rounded-lg ${
              validationResult.valid 
                ? 'bg-green-900/20 border border-green-500' 
                : 'bg-red-900/20 border border-red-500'
            }`}>
              <div className={`text-sm ${
                validationResult.valid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validationResult.valid ? '✅ 잔액 검증 통과' : `❌ ${validationResult.error}`}
              </div>
            </div>
          )}

          {/* 전송 버튼 */}
          <Button
            onClick={handleBatchTransfer}
            disabled={!selectedCurrency || selectedFriends.length === 0 || isLoading || (validationResult && !validationResult.valid)}
            isLoading={isLoading}
            className="w-full"
          >
            {isLoading ? '전송 중...' : `${selectedFriends.length}명에게 ${selectedMode} 모드로 전송하기`}
          </Button>
        </div>
      </div>
    </div>
  );
}