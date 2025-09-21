// XRPL 라이브러리 직접 사용 (XRPL 폴더 예제와 동일)
import { Client, Wallet } from 'xrpl';

export interface FaucetRequest {
  address: string;
  destinationTag?: number;
}

export interface FaucetResponse {
  success: boolean;
  message: string;
  txHash?: string;
  amount?: number;
  balance?: number;
}

// XRPL 라이브러리의 fundWallet 사용 (XRPL 폴더 예제와 동일)
export async function requestDevnetXRP(address: string): Promise<FaucetResponse> {
  const client = new Client("wss://s.devnet.rippletest.net:51233");

  try {
    console.log('🚰 XRPL 네이티브 Faucet 요청:', address);

    await client.connect();

    // 주소로부터 지갑 객체 생성 (Faucet용)
    // fundWallet은 지갑 객체를 받지만 주소만 있으면 동작
    const dummyWallet = { address } as any;

    // XRPL 라이브러리의 fundWallet 메서드 사용 (예제와 동일)
    const faucetResult = await client.fundWallet(dummyWallet);

    console.log('✅ XRPL 네이티브 Faucet 성공:', {
      address: faucetResult.wallet.address,
      balance: faucetResult.balance
    });

    const balanceXRP = faucetResult.balance / 1000000; // drops to XRP

    return {
      success: true,
      message: `${balanceXRP} XRP가 성공적으로 전송되었습니다!`,
      amount: balanceXRP,
      balance: balanceXRP
    };

  } catch (error) {
    console.error('❌ XRPL 네이티브 Faucet 실패:', error);

    // 대체 방법 1: 공식 Devnet Faucet API
    try {
      console.log('🔄 공식 Devnet Faucet API 시도...');

      const response = await fetch('https://faucet.devnet.rippletest.net/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: address,
          xrpAmount: 1000 // 1,000 XRP 요청
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 공식 Devnet Faucet 성공:', result);

        return {
          success: true,
          message: '1,000 XRP가 성공적으로 전송되었습니다!',
          txHash: result.hash,
          amount: 1000,
          balance: result.balance
        };
      }
    } catch (httpError) {
      console.error('❌ 공식 Devnet Faucet 실패:', httpError);
    }

    // 대체 방법 2: 다른 Devnet Faucet
    try {
      console.log('🔄 대체 Devnet Faucet 시도...');

      const altResponse = await fetch('https://hooks-testnet-v3.xrpl-labs.com/newcreds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: address
        })
      });

      if (altResponse.ok) {
        const altResult = await altResponse.json();
        console.log('✅ 대체 Devnet Faucet 성공:', altResult);

        return {
          success: true,
          message: 'XRP가 성공적으로 전송되었습니다!',
          amount: 1000
        };
      }
    } catch (altError) {
      console.error('❌ 대체 Devnet Faucet도 실패:', altError);
    }

    // 대체 방법 3: Bithomp 테스트넷 Faucet (devnet과 호환 가능)
    try {
      console.log('🔄 Bithomp Faucet 시도...');

      const bithompResponse = await fetch(
        `https://test.bithomp.com/api/faucet?address=${address}&amount=100`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (bithompResponse.ok) {
        const bithompResult = await bithompResponse.json();
        console.log('✅ Bithomp Faucet 성공:', bithompResult);

        return {
          success: true,
          message: '100 XRP가 성공적으로 전송되었습니다!',
          txHash: bithompResult.hash,
          amount: 100
        };
      }
    } catch (bithompError) {
      console.error('❌ Bithomp Faucet도 실패:', bithompError);
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Faucet 요청에 실패했습니다.'
    };
  } finally {
    await client.disconnect();
    console.log('🔄 Faucet 클라이언트 연결 종료');
  }
}

// Testnet용 Faucet (필요시)
export async function requestTestnetXRP(address: string): Promise<FaucetResponse> {
  try {
    console.log('🚰 Testnet XRP Faucet 요청:', address);

    const response = await fetch(
      `https://test.bithomp.com/api/faucet?address=${address}&amount=100`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Testnet Faucet API 오류: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Testnet Faucet 성공:', result);

    return {
      success: true,
      message: '100 XRP가 성공적으로 전송되었습니다!',
      txHash: result.hash,
      amount: 100
    };

  } catch (error) {
    console.error('❌ Testnet Faucet 실패:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Faucet 요청에 실패했습니다.'
    };
  }
}

// 현재 네트워크에 따른 Faucet 선택
export async function requestXRPFromFaucet(address: string, network: 'devnet' | 'testnet' = 'devnet'): Promise<FaucetResponse> {
  if (network === 'devnet') {
    return await requestDevnetXRP(address);
  } else {
    return await requestTestnetXRP(address);
  }
}