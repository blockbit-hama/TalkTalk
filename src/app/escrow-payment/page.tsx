"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { useEnabledAssets } from "../../hooks/useWalletAtoms";
import { xrplEscrowV2, EscrowPayment } from "../../lib/xrpl/xrpl-escrow-v2";
import { Button, Input, Card } from "../../components/ui";

interface Friend {
  id: string;
  name: string;
  phoneNumber: string;
  xrplAddress: string;
  avatar?: string;
  isOnline: boolean;
}

export default function EscrowPaymentPage() {
  const router = useRouter();
  const { selectedWallet, isLoading: isWalletLoading } = useWalletList();
  const { enabledAssets } = useEnabledAssets();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("XRP");
  const [memo, setMemo] = useState("");
  const [finishAfterHours, setFinishAfterHours] = useState("1");
  const [cancelAfterHours, setCancelAfterHours] = useState("24");
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [escrowResult, setEscrowResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // 친구 목록 로드
  useEffect(() => {
    loadFriendsFromServer();
  }, []);

  const loadFriendsFromServer = async () => {
    try {
      console.log('🔍 Escrow용 친구 목록 조회 시작');

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
        console.log(`✅ Escrow용 친구 목록 로드 완료: ${serverFriends.length}명`);
      } else {
        console.warn('❌ 친구 목록 조회 실패:', result.error);
        setFriends([]);
      }
    } catch (error) {
      console.error('❌ 친구 데이터 로드 실패:', error);
      setFriends([]);
    }
  };

  const selectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowFriendSelector(false);
  };

  // 완료/취소 시간 계산
  const calculateTimes = () => {
    const now = new Date();
    const finishAfter = new Date(now.getTime() + (parseFloat(finishAfterHours) * 60 * 60 * 1000));
    const cancelAfter = new Date(now.getTime() + (parseFloat(cancelAfterHours) * 60 * 60 * 1000));

    return {
      finishAfter: xrplEscrowV2.getRippleTimestamp(finishAfter),
      cancelAfter: xrplEscrowV2.getRippleTimestamp(cancelAfter),
      finishAfterDate: finishAfter,
      cancelAfterDate: cancelAfter
    };
  };

  // 간소화된 Escrow 생성 실행
  const createEscrow = async () => {
    if (!selectedWallet) {
      alert('지갑 정보를 찾을 수 없습니다.');
      return;
    }

    if (!selectedFriend) {
      alert('받는 친구를 선택해주세요.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    if (parseFloat(finishAfterHours) >= parseFloat(cancelAfterHours)) {
      alert('취소 시간은 완료 시간보다 늦어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔒 표준 방식 Escrow 생성 시작');

      // 현재 사용자의 전화번호 가져오기
      const userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
      if (!userPhoneNumber) {
        alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // Redis에서 개인키 가져오기
      const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(userPhoneNumber)}`);
      const userResult = await response.json();
      
      if (!response.ok || !userResult.success || !userResult.user?.privateKey) {
        alert('개인키를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 표준 방식으로 지갑 설정
      await xrplEscrowV2.setWallet(userResult.user.privateKey);

      // 시간 계산
      const times = calculateTimes();

      // 간소화된 EscrowPayment 생성
      const escrowPayment: EscrowPayment = {
        destination: selectedFriend.xrplAddress,
        amount: amount,
        currency: selectedCurrency,
        finishAfter: times.finishAfter,
        cancelAfter: times.cancelAfter,
        memo: memo || `Escrow payment to ${selectedFriend.name}`
      };

      console.log('표준 방식 Escrow 생성 파라미터:', escrowPayment);

      // 표준 방식 Escrow 생성 실행
      const result = await xrplEscrowV2.createEscrow(escrowPayment);

      console.log('표준 방식 Escrow 생성 결과:', result);
      setEscrowResult({
        ...result,
        selectedFriend,
        amount,
        selectedCurrency,
        memo,
        finishAfterHours,
        cancelAfterHours,
        times
      });
      setShowResults(true);

      // 성공한 경우 잔액 새로고침 이벤트 발생
      if (result.success) {
        window.dispatchEvent(new CustomEvent('transferCompleted', {
          detail: { type: 'escrow', result }
        }));
      }

    } catch (error) {
      console.error('Escrow 생성 오류:', error);
      alert(`Escrow 생성 중 오류가 발생했습니다: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 결과 화면 닫기
  const closeResults = () => {
    setShowResults(false);
    setEscrowResult(null);

    // 성공했으면 폼 초기화
    if (escrowResult?.success) {
      setSelectedFriend(null);
      setAmount('');
      setSelectedCurrency('XRP');
      setMemo('');
      setFinishAfterHours('1');
      setCancelAfterHours('24');
    }
  };

  if (isWalletLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col relative font-inherit" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-lg">지갑 로딩 중...</div>
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

  // 결과 화면
  if (showResults && escrowResult) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={closeResults} className="text-[#F2A003] text-2xl">
              ←
            </button>
            <h1 className="text-xl font-bold">Escrow 생성 결과</h1>
            <div></div>
          </div>

          {/* 결과 상태 */}
          <Card className={`mb-6 p-4 ${
            escrowResult.success
              ? 'bg-green-900/30 border-green-500'
              : 'bg-red-900/30 border-red-500'
          }`}>
            <div className="text-center">
              <div className="text-3xl mb-3">
                {escrowResult.success ? '🔒✅' : '🔒❌'}
              </div>
              <div className="text-lg font-bold mb-2">
                {escrowResult.success ? 'Escrow 생성 성공!' : 'Escrow 생성 실패'}
              </div>
              {escrowResult.success ? (
                <div>
                  <div className="text-[#F2A003] text-lg mb-2">
                    {amount} {selectedCurrency}가 안전하게 보관되었습니다
                  </div>
                  <div className="text-sm text-gray-300">
                    Escrow 번호: {escrowResult.escrowSequence}
                  </div>
                </div>
              ) : (
                <div className="text-red-400">
                  {escrowResult.error}
                </div>
              )}
            </div>
          </Card>

          {escrowResult.success && (
            <>
              {/* 수신자 정보 */}
              <Card className="mb-4 p-4 bg-[#2A2A2A]">
                <h3 className="font-bold mb-3">📋 Escrow 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">수신자:</span>
                    <span>{selectedFriend?.name || '익명'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">주소:</span>
                    <span className="text-xs">{selectedFriend?.xrplAddress.slice(0, 8)}...{selectedFriend?.xrplAddress.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">금액:</span>
                    <span className="text-[#F2A003]">{amount} {selectedCurrency}</span>
                  </div>
                  {memo && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">메모:</span>
                      <span>{memo}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* 시간 조건 */}
              <Card className="mb-4 p-4 bg-[#2A2A2A]">
                <h3 className="font-bold mb-3">⏰ 시간 조건</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">완료 가능 시간:</div>
                    <div className="text-green-400">
                      {escrowResult.times.finishAfterDate.toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">취소 가능 시간:</div>
                    <div className="text-red-400">
                      {escrowResult.times.cancelAfterDate.toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 거래 해시 */}
              <Card className="mb-6 p-4 bg-[#2A2A2A]">
                <h3 className="font-bold mb-3">🔗 거래 정보</h3>
                <div className="text-xs text-gray-300 break-all">
                  해시: {escrowResult.transactionHash}
                </div>
              </Card>

              {/* 안내 메시지 */}
              <Card className="mb-6 p-4 bg-blue-900/30 border-blue-500">
                <div className="text-center text-sm">
                  <div className="text-blue-400 font-bold mb-2">📱 다음 단계</div>
                  <div className="text-gray-300">
                    • 수신자에게 조건 충족 시 완료 요청<br/>
                    • 완료 시간 이후 Escrow 완료 가능<br/>
                    • 취소 시간 이후 자동 취소 가능
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* 완료 버튼 */}
          <Button
            onClick={closeResults}
            className="w-full bg-[#F2A003] hover:bg-[#E09400]"
          >
            완료
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="text-[#F2A003] text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold">조건부 전송</h1>
          <div></div>
        </div>

        {/* 설명 */}
        <Card className="mb-6 p-4 bg-[#2A2A2A]">
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-lg font-bold mb-2">안전한 조건부 지불</div>
            <div className="text-sm text-gray-300">
              조건이 충족되면 자동으로 송금되는<br/>
              안전 보관소입니다
            </div>
          </div>
        </Card>

        {/* 폼 */}
        <div className="space-y-4 mb-6">
          {/* 수신자 선택 */}
          <Card className="p-4 bg-[#2A2A2A]">
            <h3 className="font-bold mb-3">👥 받는 친구</h3>
            <div className="space-y-3">
              {selectedFriend ? (
                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-[#F2A003]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F2A003] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold">{selectedFriend.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{selectedFriend.name}</div>
                      <div className="text-sm text-gray-400">{selectedFriend.phoneNumber}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFriendSelector(true)}
                    className="text-[#F2A003] text-sm px-3 py-1 border border-[#F2A003] rounded"
                  >
                    변경
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowFriendSelector(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-[#F2A003] hover:text-[#F2A003] transition-colors"
                >
                  + 친구 선택하기
                </button>
              )}
            </div>
          </Card>

          {/* 금액 정보 */}
          <Card className="p-4 bg-[#2A2A2A]">
            <h3 className="font-bold mb-3">💰 금액 정보</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="금액"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600 flex-1"
                />
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="bg-[#1A1A1A] border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  {enabledAssets.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="메모 (선택사항)"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="bg-[#1A1A1A] border-gray-600"
              />
            </div>
          </Card>

          {/* 시간 조건 */}
          <Card className="p-4 bg-[#2A2A2A]">
            <h3 className="font-bold mb-3">⏰ 시간 조건</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  완료 가능 시간 (시간 후)
                </label>
                <Input
                  type="number"
                  placeholder="1"
                  value={finishAfterHours}
                  onChange={(e) => setFinishAfterHours(e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {finishAfterHours &&
                    `${new Date(Date.now() + parseFloat(finishAfterHours) * 60 * 60 * 1000).toLocaleString('ko-KR')} 이후 완료 가능`
                  }
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  취소 가능 시간 (시간 후)
                </label>
                <Input
                  type="number"
                  placeholder="24"
                  value={cancelAfterHours}
                  onChange={(e) => setCancelAfterHours(e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {cancelAfterHours &&
                    `${new Date(Date.now() + parseFloat(cancelAfterHours) * 60 * 60 * 1000).toLocaleString('ko-KR')} 이후 취소 가능`
                  }
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 미리보기 */}
        <Card className="mb-6 p-4 bg-[#2A2A2A] border-[#F2A003]">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Escrow 생성 예정</div>
            <div className="text-lg font-bold text-[#F2A003] mb-2">
              {amount || '0'} {selectedCurrency}
            </div>
            <div className="text-xs text-gray-300">
              수신자: {selectedFriend?.name || '미선택'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              수수료: 약 0.000012 XRP
            </div>
          </div>
        </Card>

        {/* 생성 버튼 */}
        <Button
          onClick={createEscrow}
          disabled={isLoading || !selectedFriend || !amount}
          className="w-full bg-[#F2A003] hover:bg-[#E09400] disabled:bg-gray-600"
        >
          {isLoading ? '생성 중...' : 'Escrow 생성하기'}
        </Button>

        {/* 친구 선택 모달 */}
        {showFriendSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2A2A2A] p-6 rounded-lg max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">친구 선택</h3>
                <button
                  onClick={() => setShowFriendSelector(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => selectFriend(friend)}
                      className="w-full p-3 bg-[#1A1A1A] rounded-lg hover:bg-[#3A3A3A] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F2A003] rounded-full flex items-center justify-center">
                          <span className="text-black font-bold">{friend.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{friend.name}</div>
                          <div className="text-sm text-gray-400">{friend.phoneNumber}</div>
                        </div>
                        {friend.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    <div>등록된 친구가 없습니다</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}