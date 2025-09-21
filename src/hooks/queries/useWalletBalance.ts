import { useQuery } from '@tanstack/react-query';
import { getCryptoPrice, getChangeColor, formatPrice, formatChangePercentage } from '@/lib/api/crypto-price';
import { getBlockchainBalance } from '@/lib/api/blockchain-balance';

// 지갑 잔액 정보 타입
interface WalletBalance {
  address: string;
  symbol: string;
  balance: string;
  usdValue: string;
  price: string;
  change: string;
  changeColor: string;
}

// 지갑 잔액 조회 hook (3초마다 자동 새로고침)
export const useWalletBalance = (address: string, symbol: string) => {
  console.log(`🎯 [useWalletBalance] Hook 호출됨:`, { address, symbol, enabled: !!address && !!symbol });

  const query = useQuery({
    queryKey: ['walletBalance', address, symbol],
    queryFn: async (): Promise<WalletBalance> => {
      console.log(`🔄 [useWalletBalance] QueryFn 실행됨: ${symbol} (${address?.slice(0, 8)}...)`);
      console.log('📋 [useWalletBalance] 파라미터:', { address, symbol, addressType: typeof address, symbolType: typeof symbol });

      // 실제 블록체인 잔액과 암호화폐 가격 API 호출
      const [blockchainBalance, cryptoPrice] = await Promise.all([
        getBlockchainBalance(address, symbol),
        getCryptoPrice(symbol)
      ]);

      console.log('📊 API 호출 결과:', {
        blockchainBalance,
        cryptoPrice: cryptoPrice ? { price: cryptoPrice.price, change: cryptoPrice.priceChangePercentage24h } : null
      });

      // 기본값 설정
      let balance = '0.00000';
      let price = 0;
      let priceChange = 0;

      // 블록체인 잔액이 있으면 사용
      if (blockchainBalance) {
        balance = blockchainBalance.balance;
        console.log(`💰 ${symbol} 잔액 업데이트: ${balance}`);
      } else {
        console.warn(`⚠️ ${symbol} 블록체인 잔액 조회 실패 - blockchainBalance:`, blockchainBalance);
      }

      // 암호화폐 가격이 있으면 사용
      if (cryptoPrice) {
        price = cryptoPrice.price;
        priceChange = cryptoPrice.priceChangePercentage24h;
      }

      // USD 가치 계산
      const balanceNum = parseFloat(balance);
      const usdValue = balanceNum * price;

      const result = {
        address,
        symbol,
        balance,
        usdValue: `$${usdValue.toFixed(2)}`,
        price: price > 0 ? formatPrice(price) : '$0.00',
        change: price > 0 ? formatChangePercentage(priceChange) : '0.00%',
        changeColor: price > 0 ? getChangeColor(priceChange) : '#A0A0B0'
      };

      console.log(`📊 최종 잔액 결과: ${symbol} = ${balance}`);
      console.log(`📊 최종 결과 객체:`, result);
      return result;
    },
    staleTime: 0, // 캐시 사용 안함 (항상 최신 데이터)
    refetchInterval: false, // 자동 새로고침 비활성화 (수동 갱신만)
    refetchIntervalInBackground: false, // 백그라운드 새로고침 비활성화
    enabled: !!address && !!symbol,
    retry: 1, // 재시도 1회로 제한
    retryDelay: 1000, // 1초 재시도 지연
  });

  return {
    ...query,
    // 수동 새로고침 함수 추가
    refresh: () => {
      console.log(`🔄 수동 새로고침: ${symbol}`);
      return query.refetch();
    }
  };
};

// 여러 지갑 잔액 조회 hook (3초마다 자동 새로고침)
export const useWalletBalances = (addresses: { address: string; symbol: string }[]) => {
  return useQuery({
    queryKey: ['walletBalances', addresses],
    queryFn: async (): Promise<WalletBalance[]> => {
      console.log(`🔄 다중 잔액 조회 중: ${addresses.length}개 주소`);

      // 고유한 심볼들 추출
      const uniqueSymbols = Array.from(new Set(addresses.map(addr => addr.symbol)));

      // 실제 블록체인 잔액과 암호화폐 가격 API 호출
      const [blockchainBalances, cryptoPrices] = await Promise.all([
        Promise.all(addresses.map(({ address, symbol }) => getBlockchainBalance(address, symbol))),
        Promise.all(uniqueSymbols.map(symbol => getCryptoPrice(symbol)))
      ]);

      // 심볼별 가격 매핑
      const priceMap = new Map();
      cryptoPrices.forEach((price, index) => {
        if (price) {
          priceMap.set(uniqueSymbols[index], price);
        }
      });

      return addresses.map(({ address, symbol }, index) => {
        const blockchainBalance = blockchainBalances[index];
        const cryptoPrice = priceMap.get(symbol);

        // 기본값 설정
        let balance = '0.00000';
        let price = 0;
        let priceChange = 0;

        // 블록체인 잔액이 있으면 사용
        if (blockchainBalance) {
          balance = blockchainBalance.balance;
          console.log(`💰 ${symbol} 잔액 업데이트: ${balance}`);
        }

        // 암호화폐 가격이 있으면 사용
        if (cryptoPrice) {
          price = cryptoPrice.price;
          priceChange = cryptoPrice.priceChangePercentage24h;
        }

        // USD 가치 계산
        const balanceNum = parseFloat(balance);
        const usdValue = balanceNum * price;

        return {
          address,
          symbol,
          balance,
          usdValue: `$${usdValue.toFixed(2)}`,
          price: price > 0 ? formatPrice(price) : '$0.00',
          change: price > 0 ? formatChangePercentage(priceChange) : '0.00%',
          changeColor: price > 0 ? getChangeColor(priceChange) : '#A0A0B0'
        };
      });
    },
    staleTime: 3000, // 3초로 단축
    refetchInterval: 3000, // 3초마다 자동 새로고침
    refetchIntervalInBackground: true, // 백그라운드에서도 새로고침
    enabled: addresses.length > 0,
  });
}; 