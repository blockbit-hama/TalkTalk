// 블록체인 잔액 조회 API 관련 함수들

// Infura API 설정 (실제 사용 시 환경변수로 관리)
const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY || 'your-infura-api-key';
const INFURA_ENDPOINTS = {
  ethereum: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  sepolia: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
  goerli: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
  polygon: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  bsc: 'https://bsc-dataseed1.binance.org/',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  baseMainnet: 'https://base-mainnet.g.allthatnode.com/archive/evm/006290a8b32b4a3e86cdc5c949333263',
  baseGoerli: 'https://goerli.base.org',
  baseSepolia: 'https://base-sepolia.g.allthatnode.com/full/evm/006290a8b32b4a3e86cdc5c949333263',
  solanaDevnet: 'https://solana-devnet.g.allthatnode.com/archive/json_rpc/006290a8b32b4a3e86cdc5c949333263',
  solanaTestnet: 'https://api.testnet.solana.com',
};

export interface BlockchainBalance {
  address: string;
  symbol: string;
  balance: string;
  decimals: number;
  network: string;
}

/**
 * 이더리움 잔액 조회
 */
export async function getEthereumBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.ethereum, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`이더리움 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`이더리움 API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'ETH',
      balance: balanceEth.toFixed(6),
      decimals: 18,
      network: 'ethereum'
    };
  } catch (error) {
    console.error('이더리움 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * Polygon (MATIC) 잔액 조회
 */
export async function getPolygonBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.polygon, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Polygon 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Polygon API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceMatic = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'MATIC',
      balance: balanceMatic.toFixed(6),
      decimals: 18,
      network: 'polygon'
    };
  } catch (error) {
    console.error('Polygon 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * BSC 잔액 조회
 */
export async function getBSCBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.bsc, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`BSC 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`BSC API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceBnb = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'BSC',
      balance: balanceBnb.toFixed(6),
      decimals: 18,
      network: 'bsc'
    };
  } catch (error) {
    console.error('BSC 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * Avalanche 잔액 조회
 */
export async function getAvalancheBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.avalanche, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Avalanche 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Avalanche API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceAvax = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'AVAX',
      balance: balanceAvax.toFixed(6),
      decimals: 18,
      network: 'avalanche'
    };
  } catch (error) {
    console.error('Avalanche 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * USDT (Tether ERC-20) 잔액 조회
 */
export async function getUSDTBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    // USDT ERC-20 컨트랙트 주소
    const USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    
    const response = await fetch(INFURA_ENDPOINTS.ethereum, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: USDT_CONTRACT_ADDRESS,
          data: `0x70a08231000000000000000000000000${address.slice(2)}`
        }, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`USDT 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`USDT API 오류: ${data.error.message}`);
    }

    const balanceHex = data.result;
    const balanceUsdt = parseInt(balanceHex, 16) / Math.pow(10, 6); // USDT는 6 decimals

    return {
      address,
      symbol: 'USDT',
      balance: balanceUsdt.toFixed(6),
      decimals: 6,
      network: 'ethereum'
    };
  } catch (error) {
    console.error('USDT 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * 솔라나 잔액 조회
 */
export async function getSolanaBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalance',
        params: [address],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`솔라나 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`솔라나 API 오류: ${data.error.message}`);
    }

    const balanceLamports = data.result.value;
    const balanceSol = balanceLamports / Math.pow(10, 9); // lamports to SOL

    return {
      address,
      symbol: 'SOL',
      balance: balanceSol.toFixed(6),
      decimals: 9,
      network: 'solana'
    };
  } catch (error) {
    console.error('솔라나 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * 비트코인 잔액 조회 (BlockCypher API 사용)
 */
export async function getBitcoinBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);
    
    if (!response.ok) {
      throw new Error(`비트코인 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    const balanceBtc = data.balance / Math.pow(10, 8); // satoshi to BTC

    return {
      address,
      symbol: 'BTC',
      balance: balanceBtc.toFixed(8),
      decimals: 8,
      network: 'bitcoin'
    };
  } catch (error) {
    console.error('비트코인 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * ETH Sepolia 테스트넷 잔액 조회
 */
export async function getSepoliaBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.sepolia, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sepolia 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Sepolia API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'ETH-SEPOLIA',
      balance: balanceEth.toFixed(6),
      decimals: 18,
      network: 'sepolia'
    };
  } catch (error) {
    console.error('Sepolia 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * ETH Goerli 테스트넷 잔액 조회
 */
export async function getGoerliBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.goerli, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Goerli 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Goerli API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'ETH-GOERLI',
      balance: balanceEth.toFixed(6),
      decimals: 18,
      network: 'goerli'
    };
  } catch (error) {
    console.error('Goerli 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * Base 메인넷 잔액 조회
 */
export async function getBaseBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.baseMainnet, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Base 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Base API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'BASE',
      balance: balanceEth.toFixed(6),
      decimals: 18,
      network: 'base'
    };
  } catch (error) {
    console.error('Base 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * Base Goerli 테스트넷 잔액 조회
 */
export async function getBaseGoerliBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.baseGoerli, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Base Goerli 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Base Goerli API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'BASE-GOERLI',
      balance: balanceEth.toFixed(6),
      decimals: 18,
      network: 'base-goerli'
    };
  } catch (error) {
    console.error('Base Goerli 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * Base Sepolia 테스트넷 잔액 조회
 */
export async function getBaseSepoliaBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.baseSepolia, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Base Sepolia 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Base Sepolia API 오류: ${data.error.message}`);
    }

    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);

    return {
      address,
      symbol: 'BASE-SEPOLIA',
      balance: balanceEth.toFixed(6),
      decimals: 18,
      network: 'base-sepolia'
    };
  } catch (error) {
    console.error('Base Sepolia 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * Solana Devnet 잔액 조회
 */
export async function getSolanaDevnetBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.solanaDevnet, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalance',
        params: [address],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`솔라나 Devnet 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`솔라나 Devnet API 오류: ${data.error.message}`);
    }

    const balanceLamports = data.result.value;
    const balanceSol = balanceLamports / Math.pow(10, 9);

    return {
      address,
      symbol: 'SOL-DEVNET',
      balance: balanceSol.toFixed(6),
      decimals: 9,
      network: 'solana-devnet'
    };
  } catch (error) {
    console.error('솔라나 Devnet 잔액 조회 중 오류:', error);
    return null;
  }
}

/**
 * Solana Testnet 잔액 조회
 */
export async function getSolanaTestnetBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(INFURA_ENDPOINTS.solanaTestnet, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalance',
        params: [address],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`솔라나 Testnet 잔액 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`솔라나 Testnet API 오류: ${data.error.message}`);
    }

    const balanceLamports = data.result.value;
    const balanceSol = balanceLamports / Math.pow(10, 9);

    return {
      address,
      symbol: 'SOL-TESTNET',
      balance: balanceSol.toFixed(6),
      decimals: 9,
      network: 'solana-testnet'
    };
  } catch (error) {
    console.error('솔라나 Testnet 잔액 조회 중 오류:', error);
    return null;
  }
}

// XRPL 클라이언트 임포트
import { xrplClient } from '../xrpl/xrpl-client';
import { MOCK_TOKENS } from '../xrpl/xrpl-amm';

/**
 * XRPL 자산 잔액 조회 (실제 XRPL 네트워크 연동)
 */
export async function getXRPLBalance(address: string, symbol: string): Promise<BlockchainBalance | null> {
  try {
    // XRPL 클라이언트 연결 상태 확인 및 연결
    if (!xrplClient.isConnected()) {
      const connected = await xrplClient.connect();
      if (!connected) {
        throw new Error('XRPL 네트워크 연결 실패');
      }
    }

    if (symbol.toUpperCase() === 'XRP') {
      // XRP 잔액 조회 - XRPL 내장 getXrpBalance 메서드 사용
      const client = xrplClient.getClient();
      if (!client) {
        throw new Error('XRPL 클라이언트가 연결되지 않음');
      }

      // XRPL 내장 getXrpBalance 메서드 사용 (빠른 조회)
      const balanceXRP = await client.getXrpBalance(address);

      return {
        address,
        symbol: 'XRP',
        balance: parseFloat(balanceXRP).toFixed(6),
        decimals: 6,
        network: 'xrpl'
      };
    } else {
      // 토큰 잔액 조회 (MOCK1, MOCK2 등)
      const accountTokens = await xrplClient.getAccountTokens(address);

      // Mock 토큰 정보 찾기
      const mockToken = MOCK_TOKENS.find(token =>
        token.currency === symbol.toUpperCase() ||
        token.symbol === symbol.toUpperCase()
      );

      if (!mockToken) {
        console.warn(`지원하지 않는 XRPL 토큰: ${symbol}`);
        return null;
      }

      // 해당 토큰의 Trust Line 찾기
      const tokenLine = accountTokens.find(token =>
        token.currency === mockToken.currency &&
        token.issuer === mockToken.issuer
      );

      const balance = tokenLine ? parseFloat(tokenLine.value) : 0;

      console.log(`${symbol} 토큰 잔액 조회 성공: ${balance}`);

      return {
        address,
        symbol: symbol.toUpperCase(),
        balance: balance.toFixed(mockToken.decimals),
        decimals: mockToken.decimals,
        network: 'xrpl'
      };
    }
  } catch (error: any) {
    // Account not found는 새 계정으로 처리
    if (error.message && error.message.includes('Account not found')) {
      return {
        address,
        symbol: symbol.toUpperCase(),
        balance: '0.000000',
        decimals: symbol.toUpperCase() === 'XRP' ? 6 : 2,
        network: 'xrpl'
      };
    }

    // 다른 에러는 기본값 반환
    return {
      address,
      symbol: symbol.toUpperCase(),
      balance: '0.000000',
      decimals: symbol.toUpperCase() === 'XRP' ? 6 : 2,
      network: 'xrpl'
    };
  }
}

/**
 * 심볼에 따른 블록체인 잔액 조회 (XRPL 전용)
 */
export async function getBlockchainBalance(address: string, symbol: string): Promise<BlockchainBalance | null> {
  return await getXRPLBalance(address, symbol);
}

/**
 * 여러 주소의 블록체인 잔액을 한 번에 조회
 */
export async function getBlockchainBalances(
  addresses: { address: string; symbol: string }[]
): Promise<BlockchainBalance[]> {
  const promises = addresses.map(({ address, symbol }) => 
    getBlockchainBalance(address, symbol)
  );
  
  const results = await Promise.all(promises);
  return results.filter(Boolean) as BlockchainBalance[];
} 