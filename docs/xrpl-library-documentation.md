# XRPL 라이브러리 문서 - TalkTalk 프로젝트

## 개요

**XRPL (XRP Ledger)** 라이브러리는 XRP Ledger 블록체인과 상호작용하기 위한 JavaScript 라이브러리입니다. 이 프로젝트에서는 **xrpl v3.1.0**을 사용하여 다음 세 가지 주요 기능을 구현했습니다:

### 🏦 지갑 관리 (Wallet Management)
디지털 지갑을 만들고 관리하는 기능입니다. 실제 지갑처럼 돈(XRP)을 보관하고, 다른 사람에게 보낼 수 있습니다.

### 💸 거래 전송 (Transaction)
친구에게 돈을 송금하는 것처럼, XRP나 다른 디지털 토큰을 다른 사람의 지갑으로 보내는 기능입니다.

### 🔄 AMM (Automated Market Maker) - 자동 거래소
**쉽게 말하면**: 24시간 운영되는 자동 환전소입니다!

**실생활 예시로 이해하기**:
- **일반 환전소**: 사람이 운영하고, 영업시간이 있고, 환전 직원이 필요함
- **AMM 자동 환전소**: 컴퓨터가 24시간 자동으로 운영하는 환전소

**어떻게 작동하나요?**
1. **거대한 수영장(풀) 두 개가 있다고 생각해보세요**
   - 한쪽 풀에는 XRP가 가득 🏊‍♂️
   - 다른 쪽 풀에는 USD가 가득 💵

2. **환전하고 싶을 때**:
   - XRP 100개를 풀에 넣으면 → USD 50개를 받아갈 수 있음
   - 풀의 양에 따라 환율이 자동으로 정해짐

3. **수수료**: 환전할 때마다 작은 수수료(보통 0.3%)를 지불

**왜 좋은가요?**
- ⏰ **24시간 언제든지** 환전 가능
- 🤖 **사람 없이 자동으로** 처리
- 🌍 **전 세계 어디서든** 이용 가능
- 💰 **여러 종류의 디지털 돈** 서로 바꿀 수 있음

**실제 사용 예시**:
"한국에서 XRP를 가지고 있는데, 미국 달러가 필요해! → AMM에서 XRP를 USD로 바로 환전"

### 설치된 라이브러리
```json
{
  "xrpl": "^3.1.0"
}
```

## 주요 구성요소

### 1. 핵심 클래스 및 인터페이스

#### Client
XRPL 네트워크에 WebSocket 연결을 관리하는 클래스
```typescript
import { Client } from 'xrpl';

const client = new Client('wss://s.devnet.rippletest.net:51233');
await client.connect();
```

#### Wallet
XRPL 지갑 생성 및 관리 클래스
```typescript
import { Wallet } from 'xrpl';

// 새 지갑 생성
const wallet = Wallet.generate();

// 기존 시드로 지갑 복원
const wallet = Wallet.fromSeed('sYourSeedHere');
```

#### Transaction Types
다양한 거래 유형 지원
- **Payment**: XRP 및 토큰 전송
- **TrustSet**: 토큰 신뢰선 설정
- **OfferCreate**: 거래 주문 생성
- **OfferCancel**: 거래 주문 취소
- **AccountSet**: 계정 설정 변경

## 프로젝트 구조

### 타입 정의 (`src/types/xrpl.ts`)

```typescript
// XRPL 계정 정보
export interface XRPLAccount {
  address: string;
  secret?: string;
  balance: string;
  sequence: number;
  reserve: string;
}

// XRPL 토큰 정보
export interface XRPLToken {
  currency: string;
  issuer?: string;
  value: string;
  balance?: string;
}

// XRPL 거래 정보
export interface XRPLTransaction {
  hash: string;
  type: 'Payment' | 'TrustSet' | 'OfferCreate' | 'OfferCancel' | 'AccountSet';
  from: string;
  to?: string;
  amount: string;
  currency: string;
  fee: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
  metadata?: {
    destinationTag?: number;
    memo?: string;
    invoiceId?: string;
  };
}

// 네트워크 정보
export interface XRPLNetworkInfo {
  network: 'mainnet' | 'testnet' | 'devnet';
  server: string;
  fee: string;
  reserve: string;
}
```

### 메인 클라이언트 (`src/lib/xrpl/xrpl-client.ts`)

#### 네트워크 설정
```typescript
class XRPLClient {
  private networkInfo: XRPLNetworkInfo = {
    network: 'devnet',
    server: 'wss://s.devnet.rippletest.net:51233',
    fee: '0.000012',
    reserve: '10',
  };

  setNetwork(network: 'mainnet' | 'testnet' | 'devnet'): void {
    switch (network) {
      case 'mainnet':
        this.networkInfo = {
          network: 'mainnet',
          server: 'wss://xrplcluster.com',
          fee: '0.000012',
          reserve: '10',
        };
        break;
      case 'testnet':
        this.networkInfo = {
          network: 'testnet',
          server: 'wss://s.altnet.rippletest.net:51233',
          fee: '0.000012',
          reserve: '10',
        };
        break;
      case 'devnet':
        this.networkInfo = {
          network: 'devnet',
          server: 'wss://s.devnet.rippletest.net:51233',
          fee: '0.000012',
          reserve: '10',
        };
        break;
    }
  }
}
```

#### 주요 기능

**1. 연결 관리**
```typescript
// 연결
async connect(): Promise<boolean> {
  this.client = new Client(this.networkInfo.server);
  await this.client.connect();
  return true;
}

// 연결 해제
async disconnect(): Promise<void> {
  if (this.client) {
    await this.client.disconnect();
    this.client = null;
  }
}
```

**2. 지갑 생성 및 가져오기**
```typescript
// 새 지갑 생성
async createWallet(): Promise<XRPLAccount | null> {
  const wallet = Wallet.generate();
  const accountInfo = await this.client.request({
    command: 'account_info',
    account: wallet.address,
  });

  return {
    address: wallet.address,
    secret: wallet.seed,
    balance: accountInfo.result.account_data.Balance || '0',
    sequence: accountInfo.result.account_data.Sequence || 0,
    reserve: this.networkInfo.reserve,
  };
}

// 기존 지갑 가져오기
async importWallet(secret: string): Promise<XRPLAccount | null> {
  const wallet = Wallet.fromSeed(secret);
  // ... 계정 정보 조회 로직
}
```

**3. XRP 전송**
```typescript
async sendXRP(request: XRPLTransferRequest): Promise<XRPLTransaction | null> {
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: this.wallet.address,
    Destination: request.to,
    Amount: request.amount,
    Fee: this.networkInfo.fee,
  };

  // 선택적 필드 추가
  if (request.destinationTag) {
    payment.DestinationTag = request.destinationTag;
  }

  if (request.memo) {
    payment.Memos = [{
      Memo: {
        MemoData: Buffer.from(request.memo, 'utf8').toString('hex').toUpperCase(),
      },
    }];
  }

  const prepared = await this.client.autofill(payment);
  const signed = this.wallet.sign(prepared);
  const result = await this.client.submitAndWait(signed);

  return {
    hash: result.result.hash,
    type: 'Payment',
    from: this.wallet.address,
    to: request.to,
    amount: request.amount,
    currency: 'XRP',
    fee: this.networkInfo.fee,
    timestamp: new Date(),
    status: result.result.validated ? 'success' : 'failed',
  };
}
```

**4. 토큰 전송**
```typescript
async sendToken(
  request: XRPLTransferRequest,
  currency: string,
  issuer: string
): Promise<XRPLTransaction | null> {
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: this.wallet.address,
    Destination: request.to,
    Amount: {
      currency: currency,
      issuer: issuer,
      value: request.amount,
    },
    Fee: this.networkInfo.fee,
  };
  // ... 실행 로직
}
```

### Faucet 관리 (`src/lib/xrpl/xrpl-faucet.ts`)

테스트넷과 데브넷에서 무료 XRP를 받기 위한 클래스

```typescript
export class XRPLFaucet {
  private devnetFaucetUrl = 'https://faucet.devnet.rippletest.net/accounts';
  private testnetFaucetUrl = 'https://faucet.altnet.rippletest.net/accounts';

  // 데브넷에서 XRP 요청
  async requestDevnetXRP(address: string): Promise<FaucetResult> {
    const response = await fetch(this.devnetFaucetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: address,
        amount: '1000' // 1000 XRP 요청
      })
    });

    const data = await response.json();
    return {
      success: true,
      account: {
        classicAddress: data.account?.classicAddress || address,
        xAddress: data.account?.xAddress || '',
        secret: data.account?.secret || ''
      },
      balance: data.balance || '1000000000' // 1000 XRP in drops
    };
  }

  // 일일 제한 확인
  async checkFaucetAvailability(address: string): Promise<{
    available: boolean;
    remainingTime?: number;
    reason?: string;
  }> {
    const lastFaucetTime = localStorage.getItem(`faucet_${address}`);
    if (lastFaucetTime) {
      const timeSinceLastRequest = Date.now() - parseInt(lastFaucetTime);
      const oneDay = 24 * 60 * 60 * 1000;

      if (timeSinceLastRequest < oneDay) {
        return {
          available: false,
          remainingTime: oneDay - timeSinceLastRequest,
          reason: '일일 한도 초과 (24시간마다 1회만 가능)'
        };
      }
    }
    return { available: true };
  }
}
```

### AMM (Automated Market Maker) (`src/lib/xrpl/xrpl-amm.ts`)

DEX(분산 거래소) 기능을 위한 AMM 관리 클래스

```typescript
export class XRPLAMMManager {
  // 지원 토큰 정의 (Devnet)
  private static MOCK_TOKENS = [
    {
      currency: 'USD',
      issuer: 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX',
      name: 'Devnet USD',
      symbol: 'USD',
      decimals: 2
    },
    {
      currency: 'CNY',
      issuer: 'rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x',
      name: 'Devnet CNY',
      symbol: 'CNY',
      decimals: 2
    },
    // ... 더 많은 토큰
  ];

  // Trust Line 생성 (토큰 수신을 위해 필요)
  async createTrustLine(
    currency: string,
    issuer: string,
    limit: string = '1000000'
  ): Promise<string | null> {
    const trustSetTx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: this.wallet.address,
      LimitAmount: {
        currency,
        issuer,
        value: limit
      }
    };

    const prepared = await this.client.autofill(trustSetTx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return result.result.validated ? result.result.hash : null;
  }

  // AMM 풀 정보 조회
  async getAMMInfo(
    asset1: { currency: string; issuer?: string },
    asset2: { currency: string; issuer?: string }
  ): Promise<AMMPoolInfo | null> {
    const ammInfoRequest: AMMInfoRequest = {
      command: 'amm_info',
      asset: asset1.currency === 'XRP'
        ? { currency: 'XRP' }
        : { currency: asset1.currency, issuer: asset1.issuer! },
      asset2: asset2.currency === 'XRP'
        ? { currency: 'XRP' }
        : { currency: asset2.currency, issuer: asset2.issuer! }
    };

    const response = await this.client.request(ammInfoRequest);
    return response.result?.amm || null;
  }

  // 스왑 견적 계산 (Constant Product Formula)
  calculateSwapQuote(
    inputAmount: number,
    poolReserve1: number,
    poolReserve2: number,
    fee: number = 0.003
  ): SwapQuote {
    const inputWithFee = inputAmount * (1 - fee);
    const k = poolReserve1 * poolReserve2;
    const newPoolReserve1 = poolReserve1 + inputWithFee;
    const newPoolReserve2 = k / newPoolReserve1;
    const outputAmount = poolReserve2 - newPoolReserve2;

    return {
      inputAmount: inputAmount.toFixed(6),
      outputAmount: outputAmount.toFixed(6),
      price: (inputAmount / outputAmount).toFixed(6),
      priceImpact: (((newPoolReserve1 / newPoolReserve2) / (poolReserve1 / poolReserve2) - 1) * 100).toFixed(2),
      fee: (inputAmount * fee).toFixed(6),
      slippage: Math.min(((newPoolReserve1 / newPoolReserve2) / (poolReserve1 / poolReserve2) - 1) * 200, 10).toFixed(2)
    };
  }

  // 스왑 실행
  async executeSwap(
    fromAsset: { currency: string; issuer?: string; amount: string },
    toAsset: { currency: string; issuer?: string; minAmount: string }
  ): Promise<string | null> {
    const payment: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Destination: this.wallet.address, // 자기 자신에게 전송 (스왑)
      Amount: toAsset.currency === 'XRP'
        ? toAsset.minAmount
        : {
            currency: toAsset.currency,
            issuer: toAsset.issuer!,
            value: toAsset.minAmount
          },
      SendMax: fromAsset.currency === 'XRP'
        ? fromAsset.amount
        : {
            currency: fromAsset.currency,
            issuer: fromAsset.issuer!,
            value: fromAsset.amount
          },
      Flags: 0x00020000 // tfPartialPayment
    };

    const prepared = await this.client.autofill(payment);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return result.result.validated ? result.result.hash : null;
  }
}
```

### 상태 관리 (Jotai Atoms) (`src/store/xrplAtoms.ts`)

React 상태 관리를 위한 Jotai 아톰들

```typescript
// 기본 상태 아톰
export const xrplAccountAtom = atom<XRPLAccount | null>(null);
export const xrplTokensAtom = atom<XRPLToken[]>([]);
export const xrplTransactionsAtom = atom<XRPLTransaction[]>([]);
export const isXRPLConnectedAtom = atom<boolean>(false);
export const isXRPLLoadingAtom = atom<boolean>(false);
export const xrplErrorAtom = atom<string | null>(null);

// 파생 아톰 (계산된 값)
export const xrplBalanceAtom = atom((get) => {
  const account = get(xrplAccountAtom);
  return account?.balance || '0';
});

export const availableBalanceAtom = atom((get) => {
  const account = get(xrplAccountAtom);
  const reserve = get(xrplReserveAtom);

  if (!account) return '0';

  const balance = parseFloat(account.balance);
  const reserveAmount = parseFloat(reserve);

  return Math.max(0, balance - reserveAmount).toString();
});

// 액션 아톰 (비동기 작업)
export const sendXRPAtom = atom(
  null,
  async (get, set, { to, amount, memo }: {
    to: string;
    amount: string;
    memo?: string;
  }) => {
    set(isXRPLLoadingAtom, true);
    set(xrplErrorAtom, null);

    try {
      // XRP 전송 로직 실행
      const transaction = await xrplClient.sendXRP({ to, amount, memo });

      // 거래 내역 업데이트
      set(xrplTransactionsAtom, [transaction, ...get(xrplTransactionsAtom)]);

      // 잔액 업데이트
      const account = get(xrplAccountAtom);
      const newBalance = (parseFloat(account.balance) - parseFloat(amount) - 0.000012).toString();
      set(xrplAccountAtom, { ...account, balance: newBalance });

      set(isXRPLLoadingAtom, false);
      return transaction;
    } catch (error) {
      set(xrplErrorAtom, error.message);
      set(isXRPLLoadingAtom, false);
      throw error;
    }
  }
);
```

## 사용 예시

### 1. 기본 설정
```typescript
import { xrplClient } from '@/lib/xrpl/xrpl-client';

// 네트워크 설정
xrplClient.setNetwork('devnet');

// 연결
await xrplClient.connect();
```

### 2. 지갑 생성
```typescript
// 새 지갑 생성
const newAccount = await xrplClient.createWallet();
console.log('새 지갑 주소:', newAccount.address);

// 기존 지갑 가져오기
const existingAccount = await xrplClient.importWallet('your-seed-here');
```

### 3. XRP 전송
```typescript
const transferRequest = {
  to: 'rDestinationAddress...',
  amount: '1000000', // 1 XRP (단위: drops)
  memo: '거래 메모',
  destinationTag: 12345
};

const transaction = await xrplClient.sendXRP(transferRequest);
console.log('거래 해시:', transaction.hash);
```

### 4. Faucet 사용 (테스트넷/데브넷)
```typescript
import { xrplFaucet } from '@/lib/xrpl/xrpl-faucet';

// 가용성 확인
const availability = await xrplFaucet.checkFaucetAvailability(address);

if (availability.available) {
  // XRP 요청
  const result = await xrplFaucet.requestDevnetXRP(address);
  if (result.success) {
    console.log('Faucet XRP 수신 완료:', result.balance);
  }
}
```

### 5. AMM 스왑
```typescript
import { xrplAMM } from '@/lib/xrpl/xrpl-amm';

// Trust Line 생성 (토큰 수신용)
await xrplAMM.createTrustLine('USD', 'rIssuerAddress...');

// AMM 정보 조회
const ammInfo = await xrplAMM.getAMMInfo(
  { currency: 'XRP' },
  { currency: 'USD', issuer: 'rIssuerAddress...' }
);

// 스왑 견적 계산
const quote = xrplAMM.calculateSwapQuote(
  100,      // 입력 금액
  10000,    // 풀 리저브 1
  50000,    // 풀 리저브 2
  0.003     // 수수료 (0.3%)
);

// 스왑 실행
const swapResult = await xrplAMM.executeSwap(
  { currency: 'XRP', amount: '100000000' },
  { currency: 'USD', issuer: 'rIssuerAddress...', minAmount: '50' }
);
```

## 네트워크 정보

### Mainnet
- **서버**: `wss://xrplcluster.com`
- **용도**: 실제 거래, 프로덕션 환경

### Testnet
- **서버**: `wss://s.altnet.rippletest.net:51233`
- **Faucet**: `https://faucet.altnet.rippletest.net/accounts`
- **용도**: 통합 테스트, 스테이징 환경

### Devnet
- **서버**: `wss://s.devnet.rippletest.net:51233`
- **Faucet**: `https://faucet.devnet.rippletest.net/accounts`
- **용도**: 개발, 실험

## 주요 특징

### 1. 자동 연결 관리
- WebSocket 연결 상태 자동 감지
- 재연결 로직 내장
- 연결 실패 시 적절한 에러 처리

### 2. 통합 에러 처리
- 계정을 찾을 수 없는 경우 (새 계정) 적절한 안내
- 네트워크 오류 시 재시도 로직
- 사용자 친화적인 에러 메시지

### 3. 싱글톤 패턴
```typescript
// 전역에서 하나의 인스턴스만 사용
export const xrplClient = new XRPLClient();
export const xrplFaucet = new XRPLFaucet();
export const xrplAMM = new XRPLAMMManager('devnet');
```

### 4. TypeScript 완전 지원
- 모든 인터페이스와 타입 정의
- 컴파일 타임 타입 안전성
- IntelliSense 지원

## 보안 고려사항

### 1. 개인키 관리
- 시드/시크릿은 안전한 저장소에 보관
- 프론트엔드에서 평문 저장 금지
- 프로덕션에서는 하드웨어 지갑 연동 권장

### 2. 네트워크 보안
- HTTPS/WSS 연결만 사용
- 신뢰할 수 있는 XRPL 서버에만 연결
- Rate limiting 및 요청 제한 적용

### 3. 거래 검증
- 거래 전송 전 금액과 수수료 검증
- 수신 주소 형식 검증
- 거래 완료 후 블록체인에서 확인

이 문서는 TalkTalk 프로젝트에서 사용하는 XRPL 라이브러리의 모든 기능과 사용법을 포함합니다. 추가 질문이나 상세한 구현 방법이 필요하시면 언제든지 문의해 주세요.