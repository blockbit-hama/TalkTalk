"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletList } from "../../hooks/useWalletAtoms";
import { useEnabledAssets } from "../../hooks/useWalletAtoms";
import { xrplBatch, BatchPaymentItem } from "../../lib/xrpl/xrpl-batch";
import { Button, Input, Card } from "../../components/ui";

interface BatchRecipient {
  id: string;
  name: string;
  address: string;
  amount: string;
  currency: string;
  memo: string;
}

export default function BatchPaymentPage() {
  const router = useRouter();
  const { selectedWallet } = useWalletList();
  const { enabledAssets } = useEnabledAssets();

  const [recipients, setRecipients] = useState<BatchRecipient[]>([
    { id: '1', name: '', address: '', amount: '', currency: 'XRP', memo: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // 수신자 추가
  const addRecipient = () => {
    const newId = (recipients.length + 1).toString();
    setRecipients([...recipients, {
      id: newId,
      name: '',
      address: '',
      amount: '',
      currency: 'XRP',
      memo: ''
    }]);
  };

  // 수신자 제거
  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter(r => r.id !== id));
    }
  };

  // 수신자 정보 업데이트
  const updateRecipient = (id: string, field: keyof BatchRecipient, value: string) => {
    setRecipients(recipients.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  // 총 금액 계산
  const calculateTotal = () => {
    const totals = recipients.reduce((acc, recipient) => {
      const amount = parseFloat(recipient.amount) || 0;
      if (!acc[recipient.currency]) {
        acc[recipient.currency] = 0;
      }
      acc[recipient.currency] += amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(totals).map(([currency, amount]) =>
      `${amount.toFixed(6)} ${currency}`
    ).join(' + ');
  };

  // 일괄 전송 실행
  const executeBatchPayment = async () => {
    if (!selectedWallet?.privateKeys.XRP) {
      alert('지갑 정보를 찾을 수 없습니다.');
      return;
    }

    // 유효성 검사
    const validRecipients = recipients.filter(r => r.address && r.amount);
    if (validRecipients.length === 0) {
      alert('최소 하나의 유효한 수신자 정보를 입력해주세요.');
      return;
    }

    const invalidRecipients = validRecipients.filter(r =>
      !r.address.startsWith('r') || parseFloat(r.amount) <= 0
    );
    if (invalidRecipients.length > 0) {
      alert('잘못된 주소나 금액이 포함되어 있습니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📦 일괄 전송 시작');

      // 지갑 설정
      await xrplBatch.setWallet(selectedWallet.privateKeys.XRP);

      // BatchPaymentItem 배열 생성
      const batchItems: BatchPaymentItem[] = validRecipients.map(recipient => ({
        to: recipient.address,
        amount: recipient.amount,
        currency: recipient.currency,
        memo: recipient.memo || `Batch payment to ${recipient.name || 'recipient'}`
      }));

      console.log('전송할 항목들:', batchItems);

      // 일괄 전송 실행
      const result = await xrplBatch.executeBatchPayments(batchItems);

      console.log('일괄 전송 결과:', result);
      setBatchResult(result);
      setShowResults(true);

      // 성공한 경우 잔액 새로고침 이벤트 발생
      if (result.totalSuccessful > 0) {
        window.dispatchEvent(new CustomEvent('transferCompleted', {
          detail: { type: 'batch', result }
        }));
      }

    } catch (error) {
      console.error('일괄 전송 오류:', error);
      alert(`일괄 전송 중 오류가 발생했습니다: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 결과 화면 닫기
  const closeResults = () => {
    setShowResults(false);
    setBatchResult(null);
    // 성공한 항목들 제거
    if (batchResult?.results) {
      const failedRecipients = recipients.filter((_, index) => {
        const result = batchResult.results.find((r: any) => r.index === index);
        return result && !result.success;
      });
      if (failedRecipients.length > 0) {
        setRecipients(failedRecipients.length > 0 ? failedRecipients : [
          { id: '1', name: '', address: '', amount: '', currency: 'XRP', memo: '' }
        ]);
      } else {
        // 모두 성공했으면 초기화
        setRecipients([
          { id: '1', name: '', address: '', amount: '', currency: 'XRP', memo: '' }
        ]);
      }
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
  if (showResults && batchResult) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={closeResults} className="text-[#F2A003] text-2xl">
              ←
            </button>
            <h1 className="text-xl font-bold">일괄 전송 결과</h1>
            <div></div>
          </div>

          {/* 전체 결과 요약 */}
          <Card className="mb-6 p-4 bg-[#2A2A2A] border-[#F2A003]">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {batchResult.totalSuccessful > 0 ? '✅' : '❌'}
              </div>
              <div className="text-lg font-bold mb-1">
                총 {recipients.length}건 중
              </div>
              <div className="text-[#F2A003] text-lg">
                성공 {batchResult.totalSuccessful}건 / 실패 {batchResult.totalFailed}건
              </div>
            </div>
          </Card>

          {/* 개별 결과 목록 */}
          <div className="space-y-3 mb-6">
            {batchResult.results.map((result: any, index: number) => {
              const recipient = recipients[index];
              return (
                <Card key={index} className={`p-4 ${
                  result.success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {recipient?.name || `수신자 ${index + 1}`}
                    </div>
                    <div className="text-lg">
                      {result.success ? '✅' : '❌'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 mb-1">
                    {recipient?.address.slice(0, 8)}...{recipient?.address.slice(-6)}
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    {recipient?.amount} {recipient?.currency}
                  </div>
                  {result.success ? (
                    <div className="text-xs text-green-400 break-all">
                      해시: {result.transactionHash?.slice(0, 20)}...
                    </div>
                  ) : (
                    <div className="text-xs text-red-400">
                      오류: {result.error}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

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
          <h1 className="text-xl font-bold">일괄 전송</h1>
          <div></div>
        </div>

        {/* 설명 */}
        <Card className="mb-6 p-4 bg-[#2A2A2A]">
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-lg font-bold mb-2">여러 명에게 한 번에 송금</div>
            <div className="text-sm text-gray-300">
              급여, 상금, 용돈 등을 여러 사람에게<br/>
              한 번에 전송할 수 있습니다
            </div>
          </div>
        </Card>

        {/* 수신자 목록 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">수신자 목록</h2>
            <button
              onClick={addRecipient}
              className="text-[#F2A003] text-2xl font-bold"
            >
              +
            </button>
          </div>

          {recipients.map((recipient, index) => (
            <Card key={recipient.id} className="mb-4 p-4 bg-[#2A2A2A]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">수신자 {index + 1}</span>
                {recipients.length > 1 && (
                  <button
                    onClick={() => removeRecipient(recipient.id)}
                    className="text-red-400 text-lg"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* 이름 */}
                <Input
                  placeholder="이름 (선택사항)"
                  value={recipient.name}
                  onChange={(e) => updateRecipient(recipient.id, 'name', e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600"
                />

                {/* 주소 */}
                <Input
                  placeholder="XRPL 주소 (r로 시작)"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600"
                />

                {/* 금액과 통화 */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="금액"
                    value={recipient.amount}
                    onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                    className="bg-[#1A1A1A] border-gray-600 flex-1"
                  />
                  <select
                    value={recipient.currency}
                    onChange={(e) => updateRecipient(recipient.id, 'currency', e.target.value)}
                    className="bg-[#1A1A1A] border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    {enabledAssets.map(asset => (
                      <option key={asset} value={asset}>{asset}</option>
                    ))}
                  </select>
                </div>

                {/* 메모 */}
                <Input
                  placeholder="메모 (선택사항)"
                  value={recipient.memo}
                  onChange={(e) => updateRecipient(recipient.id, 'memo', e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600"
                />
              </div>
            </Card>
          ))}
        </div>

        {/* 총 금액 */}
        <Card className="mb-6 p-4 bg-[#2A2A2A] border-[#F2A003]">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">총 전송 금액</div>
            <div className="text-lg font-bold text-[#F2A003]">
              {calculateTotal() || '0 XRP'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              수수료: 약 {recipients.filter(r => r.address && r.amount).length * 0.000012} XRP
            </div>
          </div>
        </Card>

        {/* 실행 버튼 */}
        <Button
          onClick={executeBatchPayment}
          disabled={isLoading || recipients.filter(r => r.address && r.amount).length === 0}
          className="w-full bg-[#F2A003] hover:bg-[#E09400] disabled:bg-gray-600"
        >
          {isLoading ? '전송 중...' : `${recipients.filter(r => r.address && r.amount).length}건 일괄 전송`}
        </Button>
      </div>
    </div>
  );
}