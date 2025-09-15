import { useQuery } from '@tanstack/react-query';

// 전송 예상 정보 타입
interface TransferEstimate {
  estimatedFee: string;
  estimatedTime: string;
}

// 더미 데이터
const mockTransferEstimate: TransferEstimate = {
  estimatedFee: "0.000012",
  estimatedTime: "2-3분"
};

// 전송 예상 정보 조회 hook
export const useTransferEstimate = () => {
  return useQuery({
    queryKey: ['transferEstimate'],
    queryFn: async (): Promise<TransferEstimate> => {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockTransferEstimate;
    },
    staleTime: 10000,
  });
}; 