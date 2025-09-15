// 서명 관련 유틸리티 함수들

/**
 * SHA-256 해시를 생성합니다.
 * @param message - 해시할 메시지
 * @returns 해시된 문자열
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}


// ===== 블록체인 트랜잭션 서명 (2번 방식) =====

/**
 * 블록체인 트랜잭션 서명
 * raw transaction을 해당 계정의 개인키로 서명
 * @param rawTransaction - 서명할 raw transaction
 * @param privateKey - 해당 계정의 개인키
 * @returns 서명된 트랜잭션
 */
export async function signTransaction(
  rawTransaction: string,
  privateKey: string
): Promise<string> {
  try {
    // 실제로는 블록체인 라이브러리를 사용하여 raw transaction을 서명해야 합니다.
    // 예: ethers.js, web3.js 등을 사용
    
    // 임시 구현: 실제로는 적절한 블록체인 라이브러리 사용 필요
    console.warn('실제 구현에서는 적절한 블록체인 라이브러리를 사용해야 합니다.');
    return rawTransaction; // 실제로는 서명된 트랜잭션 반환
  } catch (error) {
    console.error('트랜잭션 서명 실패:', error);
    throw new Error('트랜잭션 서명에 실패했습니다.');
  }
}

/**
 * 이더리움 트랜잭션 서명
 * @param transaction - 이더리움 트랜잭션 객체
 * @param privateKey - 개인키
 * @returns 서명된 트랜잭션
 */
export async function signEthereumTransaction(
  transaction: {
    to: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
    nonce: number;
    chainId: number;
  },
  privateKey: string
): Promise<string> {
  try {
    // 실제로는 ethers.js나 web3.js를 사용하여 서명
    // 예시: const signedTx = await wallet.signTransaction(transaction);
    
    console.warn('실제 구현에서는 ethers.js나 web3.js를 사용해야 합니다.');
    return `0x${'0'.repeat(130)}`; // 더미 서명
  } catch (error) {
    console.error('이더리움 트랜잭션 서명 실패:', error);
    throw new Error('이더리움 트랜잭션 서명에 실패했습니다.');
  }
}
