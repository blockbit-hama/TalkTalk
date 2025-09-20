import { ASSET_CONSTANTS } from '@/config/constants';

// 자산 정보 타입
export interface AssetInfo {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  decimals: number;
  type: 'native' | 'token';
  issuer?: string;
}

// Redis 자산 데이터 타입
export interface RedisAssetData {
  xrp: {
    balance: string;
    address: string;
  };
  tokens: Array<{
    currency: string;
    issuer: string;
    balance: string;
  }>;
}

// 로컬 자산 데이터 타입
export interface LocalAssetData {
  symbol: string;
  balance: string;
  usdValue: string;
  change: string;
  changeColor: string;
}

// 자산 정보 가져오기 (로컬 메모리)
export function getAssetInfo(symbol: string): AssetInfo | null {
  return ASSET_CONSTANTS.ASSET_INFO[symbol as keyof typeof ASSET_CONSTANTS.ASSET_INFO] || null;
}

// 모든 자산 정보 가져오기 (로컬 메모리)
export function getAllAssetInfo(): Record<string, AssetInfo> {
  return ASSET_CONSTANTS.ASSET_INFO;
}

// 활성화된 자산 목록 가져오기 (로컬 메모리)
export function getEnabledAssets(): string[] {
  return ASSET_CONSTANTS.DEFAULT_ENABLED_ASSETS;
}

// Redis 자산 데이터를 로컬 형식으로 변환
export function convertRedisToLocalAssets(redisData: RedisAssetData): LocalAssetData[] {
  const localAssets: LocalAssetData[] = [];

  // XRP 처리
  if (redisData.xrp) {
    const xrpInfo = getAssetInfo('XRP');
    if (xrpInfo) {
      localAssets.push({
        symbol: 'XRP',
        balance: redisData.xrp.balance,
        usdValue: calculateUSDValue(redisData.xrp.balance, 'XRP'),
        change: '+0.00%',
        changeColor: '#4CAF50'
      });
    }
  }

  // 토큰들 처리
  if (redisData.tokens) {
    redisData.tokens.forEach(token => {
      const assetInfo = getAssetInfo(token.currency);
      if (assetInfo) {
        localAssets.push({
          symbol: token.currency,
          balance: token.balance,
          usdValue: calculateUSDValue(token.balance, token.currency),
          change: '+0.00%',
          changeColor: '#4CAF50'
        });
      }
    });
  }

  return localAssets;
}

// USD 가치 계산 (간단한 Mock 가격)
function calculateUSDValue(balance: string, symbol: string): string {
  const balanceNum = parseFloat(balance);
  
  // Mock 가격 (실제로는 API에서 가져와야 함)
  const mockPrices: Record<string, number> = {
    'XRP': 3.03,
    'USD': 1.00,
    'CNY': 0.14,
    'EUR': 1.08,
    'TST': 0.10
  };

  const price = mockPrices[symbol] || 0;
  const usdValue = balanceNum * price;
  
  return `$${usdValue.toFixed(2)}`;
}

// 자산 잔액 업데이트 (Redis → 로컬 동기화)
export async function syncAssetsFromRedis(phoneNumber: string): Promise<LocalAssetData[]> {
  try {
    const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    const result = await response.json();
    
    if (response.ok && result.success && result.user && result.user.assets) {
      return convertRedisToLocalAssets(result.user.assets);
    }
    
    return [];
  } catch (error) {
    console.error('❌ Redis 자산 동기화 실패:', error);
    return [];
  }
}

// 자산 잔액 업데이트 (Redis에 저장)
export async function updateAssetsInRedis(phoneNumber: string, assetUpdates: Partial<RedisAssetData>): Promise<boolean> {
  try {
    // 현재 Redis 데이터 가져오기
    const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    const result = await response.json();
    
    if (!response.ok || !result.success || !result.user) {
      return false;
    }

    // 자산 데이터 업데이트
    const updatedAssets = {
      ...result.user.assets,
      ...assetUpdates
    };

    // Redis에 업데이트된 데이터 저장
    const updateResponse = await fetch('/api/phone-mapping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...result.user,
        assets: updatedAssets,
        updatedAt: new Date().toISOString()
      }),
    });

    return updateResponse.ok;
  } catch (error) {
    console.error('❌ Redis 자산 업데이트 실패:', error);
    return false;
  }
}

// 자산 추가/제거 (로컬 enabledAssets 관리)
export function toggleAsset(symbol: string, enabledAssets: string[]): string[] {
  if (enabledAssets.includes(symbol)) {
    return enabledAssets.filter(asset => asset !== symbol);
  } else {
    return [...enabledAssets, symbol];
  }
}

// 자산 검증 (지원되는 자산인지 확인)
export function isValidAsset(symbol: string): boolean {
  return symbol in ASSET_CONSTANTS.ASSET_INFO;
}