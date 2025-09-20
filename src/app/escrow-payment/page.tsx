"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { useEnabledAssets } from "../../hooks/useWalletAtoms";
import { xrplBatch, EscrowPayment } from "../../lib/xrpl/xrpl-batch";
import { Button, Input, Card } from "../../components/ui";

interface EscrowFormData {
  recipientName: string;
  recipientAddress: string;
  amount: string;
  currency: string;
  memo: string;
  conditionType: 'time' | 'manual';
  finishAfterHours: string;
  cancelAfterHours: string;
}

export default function EscrowPaymentPage() {
  const router = useRouter();
  const { selectedWallet } = useWalletList();
  const { enabledAssets } = useEnabledAssets();

  const [formData, setFormData] = useState<EscrowFormData>({
    recipientName: '',
    recipientAddress: '',
    amount: '',
    currency: 'XRP',
    memo: '',
    conditionType: 'time',
    finishAfterHours: '1',
    cancelAfterHours: '24'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [escrowResult, setEscrowResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // 폼 데이터 업데이트
  const updateFormData = (field: keyof EscrowFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 완료/취소 시간 계산
  const calculateTimes = () => {
    const now = new Date();
    const finishAfter = new Date(now.getTime() + (parseFloat(formData.finishAfterHours) * 60 * 60 * 1000));
    const cancelAfter = new Date(now.getTime() + (parseFloat(formData.cancelAfterHours) * 60 * 60 * 1000));

    return {
      finishAfter: xrplBatch.getRippleTimestamp(finishAfter),
      cancelAfter: xrplBatch.getRippleTimestamp(cancelAfter),
      finishAfterDate: finishAfter,
      cancelAfterDate: cancelAfter
    };
  };

  // Escrow 생성 실행
  const createEscrow = async () => {
    if (!selectedWallet?.privateKeys.XRP) {
      alert('지갑 정보를 찾을 수 없습니다.');
      return;
    }

    // 유효성 검사
    if (!formData.recipientAddress.startsWith('r')) {
      alert('올바른 XRPL 주소를 입력해주세요 (r로 시작).');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    if (parseFloat(formData.finishAfterHours) >= parseFloat(formData.cancelAfterHours)) {
      alert('취소 시간은 완료 시간보다 늦어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔒 Escrow 생성 시작');

      // 지갑 설정
      await xrplBatch.setWallet(selectedWallet.privateKeys.XRP);

      // 시간 계산
      const times = calculateTimes();

      // EscrowPayment 생성
      const escrowPayment: EscrowPayment = {
        destination: formData.recipientAddress,
        amount: formData.amount,
        currency: formData.currency,
        finishAfter: times.finishAfter,
        cancelAfter: times.cancelAfter,
        memo: formData.memo || `Escrow payment to ${formData.recipientName || 'recipient'}`
      };

      console.log('Escrow 생성 파라미터:', escrowPayment);

      // Escrow 생성 실행
      const result = await xrplBatch.createEscrow(escrowPayment);

      console.log('Escrow 생성 결과:', result);
      setEscrowResult({
        ...result,
        formData,
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
      setFormData({
        recipientName: '',
        recipientAddress: '',
        amount: '',
        currency: 'XRP',
        memo: '',
        conditionType: 'time',
        finishAfterHours: '1',
        cancelAfterHours: '24'
      });
    }
  };

  if (!selectedWallet) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">지갑을 찾을 수 없습니다</div>
          <Button onClick={() => router.push('/')}>
            홈으로 돌아가기
          </Button>
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
                    {formData.amount} {formData.currency}가 안전하게 보관되었습니다
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
                    <span>{formData.recipientName || '익명'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">주소:</span>
                    <span className="text-xs">{formData.recipientAddress.slice(0, 8)}...{formData.recipientAddress.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">금액:</span>
                    <span className="text-[#F2A003]">{formData.amount} {formData.currency}</span>
                  </div>
                  {formData.memo && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">메모:</span>
                      <span>{formData.memo}</span>
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
          {/* 수신자 정보 */}
          <Card className="p-4 bg-[#2A2A2A]">
            <h3 className="font-bold mb-3">📋 수신자 정보</h3>
            <div className="space-y-3">
              <Input
                placeholder="수신자 이름 (선택사항)"
                value={formData.recipientName}
                onChange={(e) => updateFormData('recipientName', e.target.value)}
                className="bg-[#1A1A1A] border-gray-600"
              />
              <Input
                placeholder="XRPL 주소 (r로 시작)"
                value={formData.recipientAddress}
                onChange={(e) => updateFormData('recipientAddress', e.target.value)}
                className="bg-[#1A1A1A] border-gray-600"
              />
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
                  value={formData.amount}
                  onChange={(e) => updateFormData('amount', e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600 flex-1"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => updateFormData('currency', e.target.value)}
                  className="bg-[#1A1A1A] border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  {enabledAssets.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="메모 (선택사항)"
                value={formData.memo}
                onChange={(e) => updateFormData('memo', e.target.value)}
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
                  value={formData.finishAfterHours}
                  onChange={(e) => updateFormData('finishAfterHours', e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.finishAfterHours &&
                    `${new Date(Date.now() + parseFloat(formData.finishAfterHours) * 60 * 60 * 1000).toLocaleString('ko-KR')} 이후 완료 가능`
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
                  value={formData.cancelAfterHours}
                  onChange={(e) => updateFormData('cancelAfterHours', e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.cancelAfterHours &&
                    `${new Date(Date.now() + parseFloat(formData.cancelAfterHours) * 60 * 60 * 1000).toLocaleString('ko-KR')} 이후 취소 가능`
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
              {formData.amount || '0'} {formData.currency}
            </div>
            <div className="text-xs text-gray-300">
              수신자: {formData.recipientName || formData.recipientAddress.slice(0, 10) + '...' || '미입력'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              수수료: 약 0.000012 XRP
            </div>
          </div>
        </Card>

        {/* 생성 버튼 */}
        <Button
          onClick={createEscrow}
          disabled={isLoading || !formData.recipientAddress || !formData.amount}
          className="w-full bg-[#F2A003] hover:bg-[#E09400] disabled:bg-gray-600"
        >
          {isLoading ? '생성 중...' : 'Escrow 생성하기'}
        </Button>
      </div>
    </div>
  );
}