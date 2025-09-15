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
import { Wallet } from 'xrpl';

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

// XRPL 전송 함수 (실제 XRPL 네트워크 연동)
export async function sendXRPLTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  privateKey: string,
  currency: string
): Promise<TransferResult> {
  try {
    console.log(`실제 XRPL 전송 시작: ${amount} ${currency} from ${fromAddress} to ${toAddress}`);

    // currency가 undefined이거나 null인 경우 처리
    if (!currency) {
      throw new Error('통화 정보가 제공되지 않았습니다.');
    }

    // amount가 undefined이거나 빈 문자열인 경우 처리
    if (!amount || amount.trim() === '') {
      throw new Error('전송 금액이 제공되지 않았습니다.');
    }

    // amount가 유효한 숫자인지 확인
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('유효하지 않은 전송 금액입니다.');
    }

    // XRPL 클라이언트 연결
    await xrplClient.connect();

    // 지갑 설정
    const wallet = Wallet.fromSeed(privateKey);
    if (wallet.address !== fromAddress) {
      throw new Error('지갑 주소가 일치하지 않습니다.');
    }

    let txResult;

    if (currency.toUpperCase() === 'XRP') {
      // XRP 전송
      const amountDrops = Math.floor(amountNum * 1000000).toString(); // XRP to drops

      txResult = await xrplClient.sendXRP({
        to: toAddress,
        amount: amountDrops,
        memo: `xTalk-Wallet transfer: ${amount} XRP`
      });
    } else {
      // 토큰 전송 (USD, EUR, JPY, KRW)
      const mockToken = MOCK_TOKENS.find(token =>
        token.currency === currency.toUpperCase() ||
        token.symbol === currency.toUpperCase()
      );

      if (!mockToken) {
        throw new Error(`지원하지 않는 XRPL 토큰: ${currency}`);
      }

      txResult = await xrplClient.sendToken(
        {
          to: toAddress,
          amount: amount,
          memo: `xTalk-Wallet transfer: ${amount} ${currency}`
        },
        mockToken.currency,
        mockToken.issuer
      );
    }

    if (txResult && txResult.status === 'success') {
      console.log(`XRPL 전송 성공: ${txResult.hash}`);

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
    } else {
      throw new Error('트랜잭션 실행 실패');
    }

  } catch (error) {
    console.error('XRPL 전송 실패:', error);

    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('funds') || error.message.includes('balance')) {
        errorMessage = '잔액이 부족합니다. 수수료와 전솨 금액을 확인해주세요.';
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

// 통합 전송 함수 (XRPL 전용)
export async function sendBlockchainTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  privateKey: string,
  currency: string
): Promise<TransferResult> {
  return await sendXRPLTransaction(fromAddress, toAddress, amount, privateKey, currency);
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