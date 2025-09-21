import { ethers } from 'ethers';
import {
  createEthereumTransaction,
  signTransaction,
  sendSignedTransaction,
  sendEthereumTransaction
} from '../ethereum/transaction';
import { sendSolanaTransaction, getSolanaBalance } from '../solana/transaction';
import { Connection } from '@solana/web3.js';
import { xrplClient } from '../xrpl/xrpl-client';
import { MOCK_TOKENS } from '../xrpl/xrpl-amm';
import { Wallet, Client } from 'xrpl';

// Redis에서 사용자 정보 가져오기 (개인키 + 시드)
async function getUserDataFromRedis(phoneNumber: string): Promise<{privateKey?: string, seed?: string} | null> {
  try {
    const response = await fetch(`/api/phone-mapping?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    const result = await response.json();

    if (response.ok && result.success && result.user) {
      console.log('✅ Redis에서 사용자 정보 조회 성공');
      return {
        privateKey: result.user.privateKey,
        seed: result.user.seed
      };
    }

    console.error('❌ Redis에서 사용자 정보를 찾을 수 없습니다');
    return null;
  } catch (error) {
    console.error('❌ Redis 사용자 정보 조회 실패:', error);
    return null;
  }
}

// XRPL 시드 구문 검증 함수
function isValidXRPLSeed(seed: string): boolean {
  const allowedChars = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
  return seed.split('').every(char => allowedChars.includes(char));
}

// 견고한 XRPL 지갑 생성 함수 (권장 방식)
function createWalletFromRedisData(privateKey?: string, seed?: string): Wallet {
  console.log('🔑 지갑 생성 시도:', {
    hasPrivateKey: !!privateKey,
    hasSeed: !!seed,
    privateKeyLength: privateKey?.length,
    seedLength: seed?.length,
    privateKeyPreview: privateKey?.substring(0, 10) + '...',
    seedPreview: seed?.substring(0, 10) + '...'
  });

  try {
    // 1순위: 개인키 직접 사용 (가장 안전)
    if (privateKey) {
      console.log('📍 1순위: privateKey로 지갑 생성 시도');
      return Wallet.fromPrivateKey(privateKey);
    }
  } catch (error) {
    console.warn('⚠️ privateKey로 지갑 생성 실패:', error);
  }

  try {
    // 2순위: 시드 구문 사용 (올바른 형식인 경우만)
    if (seed && isValidXRPLSeed(seed)) {
      console.log('📍 2순위: seed로 지갑 생성 시도');
      return Wallet.fromSeed(seed);
    }
  } catch (error) {
    console.warn('⚠️ seed로 지갑 생성 실패:', error);
  }

  throw new Error('지갑 생성 실패: 개인키와 시드 모두 유효하지 않음');
}

// API 키들
const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY || 'your-infura-api-key';
const BLOCKCYPHER_TOKEN = process.env.NEXT_PUBLIC_BLOCKCYPHER_TOKEN || 'your-blockcypher-token';

// RPC 엔드포인트들
const RPC_ENDPOINTS = {
  ethereum: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  polygon: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  bsc: 'https://bsc-dataseed1.binance.org/',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  solana: 'https://api.mainnet-beta.solana.com',
  goerli: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
  sepolia: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
};

// 전송 결과 타입
export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  receipt?: any;
}

// 이더리움 기반 체인 전송 (ETH, Polygon, BSC, Avalanche)
export async function sendEthereumBasedTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  privateKey: string,
  network: 'ethereum' | 'polygon' | 'bsc' | 'avalanche' | 'goerli' | 'sepolia'
): Promise<TransferResult> {
  try {
    const rpcUrl = RPC_ENDPOINTS[network];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // 잔액 확인
    const balance = await provider.getBalance(fromAddress);
    const amountWei = ethers.utils.parseUnits(amount, 'ether');
    
    if (balance.lt(amountWei)) {
      throw new Error('잔액이 부족합니다.');
    }

    // 트랜잭션 전송
    const txResponse = await sendEthereumTransaction(
      fromAddress,
      toAddress,
      amount,
      privateKey,
      provider
    );

    return {
      success: true,
      transactionHash: txResponse.hash,
      receipt: txResponse,
    };
  } catch (error) {
    console.error(`${network} 전송 실패:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

// 비트코인 전송 (BlockCypher API 사용)
export async function sendBitcoinTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string, // BTC amount
  privateKey: string
): Promise<TransferResult> {
  try {
    // BlockCypher API를 사용한 비트코인 전송
    const response = await fetch('https://api.blockcypher.com/v1/btc/main/txs/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${BLOCKCYPHER_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: [{ addresses: [fromAddress] }],
        outputs: [{ addresses: [toAddress], value: Math.floor(parseFloat(amount) * 100000000) }], // BTC to satoshis
      }),
    });

    if (!response.ok) {
      throw new Error(`비트코인 전송 실패: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      transactionHash: data.tx.hash,
      receipt: data,
    };
  } catch (error) {
    console.error('비트코인 전송 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

// XRPL 전송 함수 (Redis 기반 개인키 사용)
export async function sendXRPLTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  phoneNumber: string, // 개인키 대신 전화번호 사용
  currency: string
): Promise<TransferResult> {
  try {
    console.log(`🚀 XRPL 전송 시작: ${amount} ${currency} from ${fromAddress} to ${toAddress}`);

    // 입력값 검증
    if (!currency || !amount || parseFloat(amount) <= 0) {
      throw new Error('유효하지 않은 전송 정보입니다.');
    }

    // Redis에서 사용자 정보 가져오기 (개인키 + 시드)
    const userData = await getUserDataFromRedis(phoneNumber);
    if (!userData || (!userData.privateKey && !userData.seed)) {
      throw new Error('Redis에서 지갑 정보를 찾을 수 없습니다');
    }

    // 개인키와 시드 추출
    const privateKey = userData.privateKey;
    const seed = userData.seed;

    console.log('🔑 Redis 사용자 정보 확인 완료:', {
      address: fromAddress,
      phoneNumber: phoneNumber,
      hasPrivateKey: !!privateKey,
      hasSeed: !!seed,
      privateKeyLength: privateKey?.length,
      seedLength: seed?.length
    });

    // XRPL 클라이언트 연결
    const client = new Client('wss://s.devnet.rippletest.net:51233');
    await client.connect();

    try {
      // 계정 존재 여부 확인
      const accountInfo = await client.request({
        command: 'account_info',
        account: fromAddress,
        ledger_index: 'validated'
      });

      console.log('✅ 계정 활성화 확인:', {
        address: fromAddress,
        balance: accountInfo.result.account_data.Balance,
        sequence: accountInfo.result.account_data.Sequence
      });

      // 견고한 XRPL 지갑 생성 (권장 방식: privateKey 1순위, seed 2순위)
      const signingWallet = createWalletFromRedisData(privateKey, seed);
      console.log('✅ 서명 지갑 생성 완료:', signingWallet.address);

      let transaction;
      let txResult;

      if (currency.toUpperCase() === 'XRP') {
        // XRP 전송
        const amountDrops = Math.floor(parseFloat(amount) * 1000000).toString();
        console.log(`💰 XRP 전송: ${amount} XRP (${amountDrops} drops)`);

        // 잔액 확인
        const balance = accountInfo.result.account_data.Balance;
        if (parseFloat(balance) < parseFloat(amountDrops)) {
          throw new Error('잔액이 부족합니다.');
        }

        // 트랜잭션 준비
        transaction = {
          TransactionType: 'Payment',
          Account: fromAddress,
          Amount: amountDrops,
          Destination: toAddress,
          Memos: [{
            Memo: {
              MemoData: Buffer.from(`xTalk-Wallet transfer: ${amount} XRP`).toString('hex').toUpperCase()
            }
          }]
        };
      } else {
        // 토큰 전송
        const tokenIssuers = {
          'USD': 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX',
          'EUR': 'rBXYWgAg6z5NxCshzGkNuX3YjHFyN26cgj',
          'CNY': 'rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x',
          'JPY': 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX'
        };
        
        const issuer = tokenIssuers[currency.toUpperCase()];
        if (!issuer) {
          throw new Error(`지원하지 않는 토큰: ${currency}`);
        }

        transaction = {
          TransactionType: 'Payment',
          Account: fromAddress,
          Amount: {
            currency: currency.toUpperCase(),
            value: amount,
            issuer: issuer
          },
          Destination: toAddress,
          Memos: [{
            Memo: {
              MemoData: Buffer.from(`xTalk-Wallet transfer: ${amount} ${currency}`).toString('hex').toUpperCase()
            }
          }]
        };
      }

      // 트랜잭션 준비 및 서명 (개인키로 직접 서명)
      const prepared = await client.autofill(transaction);
      const signed = signingWallet.sign(prepared);
      console.log('✅ 트랜잭션 서명 완료 (개인키 직접 사용)');

      // 트랜잭션 제출
      const result = await client.submitAndWait(signed.tx_blob);
      console.log('✅ 트랜잭션 제출 완료:', result.result.hash);

      txResult = {
        status: 'success',
        hash: result.result.hash,
        timestamp: new Date().toISOString(),
        from: fromAddress,
        to: toAddress,
        amount: amount,
        currency: currency
      };

      console.log('🎉 XRPL 전송 성공:', txResult);

      return {
        success: true,
        transactionHash: txResult.hash,
        receipt: {
          transactionHash: txResult.hash,
          from: fromAddress,
          to: toAddress,
          amount: amount,
          currency: currency,
          status: 'success',
          timestamp: txResult.timestamp
        }
      };

    } finally {
      await client.disconnect();
    }

  } catch (error) {
    console.error('❌ XRPL 전송 실패:', error);

    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('Account not found')) {
        errorMessage = '계정이 활성화되지 않았습니다. Faucet에서 XRP를 받아주세요.';
      } else if (error.message.includes('funds') || error.message.includes('balance')) {
        errorMessage = '잔액이 부족합니다. 수수료와 전송 금액을 확인해주세요.';
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        errorMessage = '네트워크 연결 오류. XRPL Devnet 연결을 확인해주세요.';
      } else if (error.message.includes('destination')) {
        errorMessage = '수신자 주소가 올바르지 않습니다.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// 통합 전송 함수 (Redis 기반)
export async function sendBlockchainTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  phoneNumber: string, // 개인키 대신 전화번호 사용
  currency: string
): Promise<TransferResult> {
  return await sendXRPLTransaction(fromAddress, toAddress, amount, phoneNumber, currency);
}

// 가스 가격 조회
export async function getGasPrice(network: string): Promise<string> {
  try {
    const rpcUrl = RPC_ENDPOINTS[network as keyof typeof RPC_ENDPOINTS];
    if (!rpcUrl) {
      throw new Error(`지원하지 않는 네트워크: ${network}`);
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const gasPrice = await provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  } catch (error) {
    console.error('가스 가격 조회 실패:', error);
    throw error;
  }
}

// 잔액 조회
export async function getBalance(address: string, network: string): Promise<string> {
  try {
    // 솔라나는 별도 처리
    if (network.toLowerCase() === 'solana' || network.toLowerCase() === 'sol') {
      const connection = new Connection(RPC_ENDPOINTS.solana);
      return await getSolanaBalance(address, connection);
    }

    const rpcUrl = RPC_ENDPOINTS[network as keyof typeof RPC_ENDPOINTS];
    if (!rpcUrl) {
      throw new Error(`지원하지 않는 네트워크: ${network}`);
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('잔액 조회 실패:', error);
    throw error;
  }
}

// 직접 전송을 위한 간단한 API 함수 (Infura API 키와 서명된 트랜잭션만 전송)
export async function sendDirectTransaction(
  apiKey: string,
  signedTransaction: string,
  network: string
): Promise<TransferResult> {
  try {
    const rpcUrl = `https://${network}.infura.io/v3/${apiKey}`;
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // 서명된 트랜잭션 전송
    const tx = await provider.sendTransaction(signedTransaction);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      receipt: receipt,
    };
  } catch (error) {
    console.error('직접 전송 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}