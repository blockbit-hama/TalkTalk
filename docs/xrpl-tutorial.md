# XRPL 개발자 튜토리얼 📚

> **XRPL (XRP Ledger) 개발을 위한 종합 가이드**
> 
> XRPL의 핵심 개념, 토큰 시스템, 원장 구조, 그리고 실제 개발 방법을 단계별로 설명합니다.

---

## 📋 **목차**

1. [XRPL 기본 개념](#xrpl-기본-개념)
2. [XRPL 토큰 시스템](#xrpl-토큰-시스템)
3. [원장 구조와 데이터 저장](#원장-구조와-데이터-저장)
4. [TrustSet과 RippleState](#trustset과-ripplestate)
5. [개발 환경 설정](#개발-환경-설정)
6. [실제 코드 예제](#실제-코드-예제)
7. [API 참조](#api-참조)
8. [문제 해결](#문제-해결)

---

## 🌟 **XRPL 기본 개념**

### XRPL이란?

XRPL (XRP Ledger)은 분산 원장 기술을 기반으로 한 블록체인 네트워크입니다.

**핵심 특징:**
- **합의 알고리즘**: Ripple Protocol Consensus Algorithm (RPCA)
- **네이티브 토큰**: XRP
- **트랜잭션 타입**: Payment, TrustSet, OfferCreate 등
- **네트워크**: Mainnet, Testnet, Devnet

### 네트워크 구성

```
┌─────────────────────────────────────┐
│           XRPL 네트워크             │
├─────────────────────────────────────┤
│                                     │
│  Mainnet (실제 네트워크)            │
│  ├─ wss://xrplcluster.com          │
│  ├─ wss://s1.ripple.com            │
│  └─ 실제 XRP 사용                  │
│                                     │
│  Testnet (테스트 네트워크)          │
│  ├─ wss://s.altnet.rippletest.net:51233 │
│  └─ 테스트 XRP 사용                │
│                                     │
│  Devnet (개발 네트워크)             │
│  ├─ wss://s.devnet.rippletest.net:51233 │
│  └─ 개발용 XRP 사용                │
│                                     │
└─────────────────────────────────────┘
```

---

## 💰 **XRPL 토큰 시스템**

### 토큰 식별 방식

XRPL에서 토큰은 **토큰 코드 + 발행자 주소** 조합으로 식별됩니다.

```
토큰 식별자 = {
  currency: "USD",           // 토큰 코드 (3자리)
  issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo"  // 발행자 주소
}
```

**중요한 점:**
- 동일한 토큰 코드("USD")라도 발행자가 다르면 **완전히 다른 자산**입니다
- 예: Bank A의 USD ≠ Bank B의 USD

### 토큰 타입

#### 1. **XRP (네이티브 토큰)**
```javascript
{
  currency: "XRP",  // 또는 생략
  issuer: null      // 발행자 없음
}
```

#### 2. **IOU 토큰 (발행된 토큰)**
```javascript
{
  currency: "USD",
  issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo"
}
```

### 토큰 수신 과정

```
1. TrustSet 트랜잭션 실행
   ↓
2. RippleState 원장 객체 생성/갱신
   ↓
3. Payment 트랜잭션으로 토큰 수신 가능
   ↓
4. RippleState.balance 업데이트
```

---

## 🗄️ **원장 구조와 데이터 저장**

### 이더리움 vs XRPL 데이터 저장 방식

#### **이더리움 방식**
```
스마트 컨트랙트 스토리지
├─ mapping(address => uint256) balances
├─ mapping(address => mapping(address => uint256)) allowances
└─ 컨트랙트 코드 내부에 데이터 저장
```

#### **XRPL 방식**
```
원장 상태트리 (SHAMap)
├─ AccountRoot (계정 정보)
├─ RippleState (신뢰선 정보)
├─ Offer (오더북 정보)
├─ DirectoryNode (인덱스)
└─ 프로토콜 레벨에서 데이터 관리
```

### 원장 객체 (Ledger Objects)

XRPL의 모든 데이터는 **원장 객체**로 저장됩니다.

#### **주요 원장 객체 타입**

1. **AccountRoot**
   ```javascript
   {
     LedgerEntryType: "AccountRoot",
     Account: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
     Balance: "1000000000",  // XRP 잔액 (drops)
     Sequence: 123,
     Flags: 0
   }
   ```

2. **RippleState**
   ```javascript
   {
     LedgerEntryType: "RippleState",
     Balance: {
       currency: "USD",
       issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
       value: "100.00"  // 토큰 잔액
     },
     HighLimit: {
       currency: "USD",
       issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
       value: "1000.00"  // 신뢰선 한도
     },
     LowLimit: {
       currency: "USD",
       issuer: "rUserAccount123456789012345678901234",
       value: "0.00"
     }
   }
   ```

3. **DirectoryNode**
   ```javascript
   {
     LedgerEntryType: "DirectoryNode",
     Owner: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
     Indexes: [
       "ABC123...",  // 다른 원장 객체들의 해시
       "DEF456...",
       "GHI789..."
     ]
   }
   ```

### 상태트리 구조

```
원장 버전 N
├─ SHAMap (상태트리)
│  ├─ AccountRoot 해시들
│  ├─ RippleState 해시들
│  ├─ Offer 해시들
│  └─ DirectoryNode 해시들
└─ 루트 해시 (Ledger Hash)
```

---

## 🔗 **TrustSet과 RippleState**

### TrustSet 트랜잭션

사용자가 특정 발행자의 토큰을 받기 위해 신뢰선을 설정하는 트랜잭션입니다.

#### **TrustSet 트랜잭션 구조**
```javascript
{
  TransactionType: "TrustSet",
  Account: "rUserAccount123456789012345678901234",
  LimitAmount: {
    currency: "USD",
    issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
    value: "1000.00"  // 신뢰선 한도
  },
  Flags: 0  // 또는 TrustSetFlags
}
```

#### **TrustSet 실행 과정**
```
1. 트랜잭션 검증
   ↓
2. RippleState 객체 생성/갱신
   ↓
3. 원장에 상태 변경 기록
   ↓
4. 계정 예약금 증가 (2 XRP)
```

### RippleState 원장 객체

신뢰선 정보를 저장하는 원장 객체입니다.

#### **RippleState 생성 규칙**
```javascript
// 키 생성: (계정A, 계정B, 통화) 조합
// 계정A < 계정B (알파벳 순서)
const key = {
  accountA: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",  // 작은 주소
  accountB: "rUserAccount123456789012345678901234", // 큰 주소
  currency: "USD"
}
```

#### **RippleState 구조**
```javascript
{
  LedgerEntryType: "RippleState",
  Balance: {
    currency: "USD",
    issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
    value: "0.00"  // 현재 잔액
  },
  HighLimit: {
    currency: "USD",
    issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
    value: "1000.00"  // 발행자 → 사용자 한도
  },
  LowLimit: {
    currency: "USD",
    issuer: "rUserAccount123456789012345678901234",
    value: "0.00"  // 사용자 → 발행자 한도
  },
  Flags: 0
}
```

### Payment 트랜잭션과 RippleState 업데이트

#### **IOU Payment 트랜잭션**
```javascript
{
  TransactionType: "Payment",
  Account: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",  // 발행자
  Destination: "rUserAccount123456789012345678901234",  // 수신자
  Amount: {
    currency: "USD",
    issuer: "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
    value: "100.00"
  }
}
```

#### **RippleState 업데이트**
```javascript
// Payment 전
Balance: { value: "0.00" }

// Payment 후
Balance: { value: "100.00" }  // +100 USD
```

---

## 💰 **XRPL 리저브 시스템**

### 리저브란?

XRPL에서 계정을 유지하기 위해 필요한 최소 XRP 잔액을 **리저브(Reserve)**라고 합니다.

#### **리저브 구성 요소**

```
총 리저브 = 기본 리저브 + 소유자 리저브
총 리저브 = Base Reserve + (OwnerCount × Owner Reserve)
```

#### **리저브 계산 예시**

```javascript
// 현재 XRPL 리저브 설정 (2024년 기준)
const baseReserve = 10;        // 기본 리저브: 10 XRP
const ownerReserve = 2;        // 소유자 리저브: 2 XRP per object

// 예시: Trust Line 3개를 가진 계정
const ownerCount = 3;          // 소유한 원장 객체 개수
const totalReserve = baseReserve + (ownerCount * ownerReserve);
// 총 리저브 = 10 + (3 × 2) = 16 XRP
```

### OwnerCount (소유자 카운트)

**OwnerCount**는 계정이 원장에 소유하고 있는 객체(ledger objects)의 개수입니다.

#### **소유한 객체 타입들**

```javascript
// 계정이 소유할 수 있는 원장 객체들
const ownedObjects = {
  // 1. Trust Line (RippleState)
  trustLines: [
    { currency: "USD", issuer: "rBankA..." },
    { currency: "EUR", issuer: "rBankB..." }
  ],
  
  // 2. Offer (DEX 주문)
  offers: [
    { offerId: "123", pair: "XRP/USD" },
    { offerId: "456", pair: "XRP/EUR" }
  ],
  
  // 3. Escrow (에스크로)
  escrows: [
    { escrowId: "789", amount: "100 XRP" }
  ],
  
  // 4. Payment Channel (결제 채널)
  paymentChannels: [
    { channelId: "abc", destination: "rUser..." }
  ],
  
  // 5. Check (수표형 결제)
  checks: [
    { checkId: "def", amount: "50 XRP" }
  ],
  
  // 6. SignerList (멀티시그)
  signerLists: [
    { signerListId: "ghi", signers: 3 }
  ],
  
  // 7. Ticket (시퀀스 선점)
  tickets: [
    { ticketId: "jkl", sequence: 100 }
  ],
  
  // 8. DepositPreauth (사전 입금 허용)
  depositPreauths: [
    { depositPreauthId: "mno", authorizedAccount: "rAuth..." }
  ],
  
  // 9. NFT 관련 객체들
  nftPages: [
    { nftPageId: "pqr", nftCount: 32 }
  ],
  nftOffers: [
    { nftOfferId: "stu", nftId: "NFT123" }
  ]
};
```

### 실제 코드에서 OwnerCount 확인

#### **계정 정보 조회**

```javascript
async function getAccountOwnerCount() {
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();

  const accountInfo = await client.request({
    command: 'account_info',
    account: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo'
  });

  const accountData = accountInfo.result.account_data;
  
  console.log('계정 정보:', {
    balance: accountData.Balance,           // 현재 XRP 잔액
    ownerCount: accountData.OwnerCount,     // 소유한 객체 개수
    reserveBase: accountData.ReserveBase,   // 기본 리저브
    reserveIncrement: accountData.ReserveIncrement, // 증분 리저브
    sequence: accountData.Sequence
  });

  // 리저브 계산
  const baseReserve = parseInt(accountData.ReserveBase) / 1000000; // drops to XRP
  const ownerReserve = parseInt(accountData.ReserveIncrement) / 1000000;
  const ownerCount = accountData.OwnerCount;
  const totalReserve = baseReserve + (ownerCount * ownerReserve);
  
  console.log('리저브 계산:', {
    baseReserve: `${baseReserve} XRP`,
    ownerReserve: `${ownerReserve} XRP per object`,
    ownerCount: `${ownerCount} objects`,
    totalReserve: `${totalReserve} XRP`
  });

  await client.disconnect();
}
```

#### **사용 가능한 잔액 계산**

```javascript
function calculateAvailableBalance(accountData) {
  const balance = parseInt(accountData.Balance) / 1000000; // drops to XRP
  const baseReserve = parseInt(accountData.ReserveBase) / 1000000;
  const ownerReserve = parseInt(accountData.ReserveIncrement) / 1000000;
  const ownerCount = accountData.OwnerCount;
  
  const totalReserve = baseReserve + (ownerCount * ownerReserve);
  const availableBalance = Math.max(0, balance - totalReserve);
  
  return {
    totalBalance: `${balance} XRP`,
    totalReserve: `${totalReserve} XRP`,
    availableBalance: `${availableBalance} XRP`,
    ownerCount: ownerCount
  };
}
```

### Trust Line과 OwnerCount

#### **Trust Line 생성 시 OwnerCount 증가**

```javascript
async function createTrustLineAndCheckOwnerCount() {
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();

  const wallet = Wallet.fromSeed('sEd7rBGm5kxzauRTAV2hbsNz4GkJQ...');
  
  // Trust Line 생성 전 계정 정보
  const beforeInfo = await client.request({
    command: 'account_info',
    account: wallet.address
  });
  
  console.log('Trust Line 생성 전:', {
    ownerCount: beforeInfo.result.account_data.OwnerCount,
    balance: beforeInfo.result.account_data.Balance
  });

  // Trust Line 생성
  const trustSetTx = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: {
      currency: 'USD',
      issuer: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
      value: '1000.00'
    }
  };

  const prepared = await client.autofill(trustSetTx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  // Trust Line 생성 후 계정 정보
  const afterInfo = await client.request({
    command: 'account_info',
    account: wallet.address
  });
  
  console.log('Trust Line 생성 후:', {
    ownerCount: afterInfo.result.account_data.OwnerCount,
    balance: afterInfo.result.account_data.Balance,
    ownerCountIncrease: afterInfo.result.account_data.OwnerCount - beforeInfo.result.account_data.OwnerCount
  });

  await client.disconnect();
}
```

### 리저브 최적화 팁

#### **1. 불필요한 객체 정리**

```javascript
// 사용하지 않는 Trust Line 삭제
async function deleteUnusedTrustLine() {
  const trustSetTx = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: {
      currency: 'USD',
      issuer: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
      value: '0'  // 한도를 0으로 설정하여 Trust Line 삭제
    }
  };
  
  // 트랜잭션 실행 후 OwnerCount 감소
}
```

#### **2. 리저브 모니터링**

```javascript
async function monitorReserve() {
  const accountInfo = await client.request({
    command: 'account_info',
    account: wallet.address
  });
  
  const accountData = accountInfo.result.account_data;
  const reserveInfo = calculateAvailableBalance(accountData);
  
  console.log('리저브 상태:', reserveInfo);
  
  // 경고: 사용 가능한 잔액이 부족한 경우
  if (parseFloat(reserveInfo.availableBalance) < 1) {
    console.warn('⚠️ 사용 가능한 잔액이 부족합니다!');
    console.warn('💡 불필요한 Trust Line이나 Offer를 정리하세요.');
  }
}
```

### 리저브 관련 오류 처리

#### **자주 발생하는 리저브 오류**

```javascript
// tecINSUFFICIENT_RESERVE 오류 처리
function handleReserveError(error) {
  if (error.includes('tecINSUFFICIENT_RESERVE')) {
    console.error('❌ 리저브 부족 오류');
    console.error('💡 해결 방법:');
    console.error('   1. 더 많은 XRP를 충전하세요');
    console.error('   2. 불필요한 Trust Line을 삭제하세요');
    console.error('   3. 사용하지 않는 Offer를 취소하세요');
  }
}
```

---

## 🛠️ **개발 환경 설정**

### 필요한 라이브러리

```bash
npm install xrpl
```

### 기본 연결 설정

```javascript
import { Client } from 'xrpl';

// 네트워크별 서버 설정
const servers = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233'
};

// 클라이언트 연결
const client = new Client(servers.devnet);
await client.connect();
```

### 계정 생성

```javascript
import { Wallet } from 'xrpl';

// 새 지갑 생성
const wallet = Wallet.generate();
console.log('Address:', wallet.address);
console.log('Secret:', wallet.seed);

// 시드에서 지갑 복구
const restoredWallet = Wallet.fromSeed('sEd7rBGm5kxzauRTAV2hbsNz4GkJQ...');
```

---

## 💻 **실제 코드 예제**

### 1. TrustSet 실행

```javascript
import { Client, Wallet, TrustSet } from 'xrpl';

async function createTrustLine() {
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();

  const wallet = Wallet.fromSeed('sEd7rBGm5kxzauRTAV2hbsNz4GkJQ...');
  
  const trustSetTx: TrustSet = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: {
      currency: 'USD',
      issuer: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
      value: '1000.00'
    }
  };

  const prepared = await client.autofill(trustSetTx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log('TrustSet 결과:', result.result.hash);
  await client.disconnect();
}
```

### 2. IOU Payment 실행

```javascript
import { Client, Wallet, Payment } from 'xrpl';

async function sendIOU() {
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();

  const wallet = Wallet.fromSeed('sEd7rBGm5kxzauRTAV2hbsNz4GkJQ...');
  
  const paymentTx: Payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: 'rUserAccount123456789012345678901234',
    Amount: {
      currency: 'USD',
      issuer: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
      value: '100.00'
    }
  };

  const prepared = await client.autofill(paymentTx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log('Payment 결과:', result.result.hash);
  await client.disconnect();
}
```

### 3. 계정 정보 조회

```javascript
async function getAccountInfo() {
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();

  // 계정 기본 정보
  const accountInfo = await client.request({
    command: 'account_info',
    account: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo'
  });

  console.log('계정 정보:', accountInfo.result.account_data);

  // 신뢰선 정보
  const accountLines = await client.request({
    command: 'account_lines',
    account: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo'
  });

  console.log('신뢰선 목록:', accountLines.result.lines);

  await client.disconnect();
}
```

### 4. 원장 객체 직접 조회

```javascript
async function getLedgerEntry() {
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();

  // RippleState 객체 직접 조회
  const rippleState = await client.request({
    command: 'ledger_entry',
    ripple_state: {
      accounts: [
        'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
        'rUserAccount123456789012345678901234'
      ],
      currency: 'USD'
    }
  });

  console.log('RippleState 객체:', rippleState.result.node);

  await client.disconnect();
}
```

---

## 📡 **API 참조**

### 주요 API 명령어

#### **계정 관련**
```javascript
// 계정 정보 조회
await client.request({
  command: 'account_info',
  account: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo'
});

// 신뢰선 목록 조회
await client.request({
  command: 'account_lines',
  account: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo'
});

// 트랜잭션 히스토리
await client.request({
  command: 'account_tx',
  account: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
  limit: 20
});
```

#### **원장 관련**
```javascript
// 원장 객체 조회
await client.request({
  command: 'ledger_entry',
  ripple_state: {
    accounts: ['account1', 'account2'],
    currency: 'USD'
  }
});

// 원장 정보 조회
await client.request({
  command: 'ledger',
  ledger_index: 'validated'
});
```

#### **트랜잭션 관련**
```javascript
// 트랜잭션 조회
await client.request({
  command: 'tx',
  transaction: 'ABC123...DEF456'
});

// 트랜잭션 제출
await client.request({
  command: 'submit',
  tx_blob: 'signed_transaction_blob'
});
```

### 트랜잭션 타입별 예제

#### **TrustSet**
```javascript
const trustSetTx = {
  TransactionType: 'TrustSet',
  Account: wallet.address,
  LimitAmount: {
    currency: 'USD',
    issuer: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
    value: '1000.00'
  },
  Flags: 0
};
```

#### **Payment (XRP)**
```javascript
const xrpPaymentTx = {
  TransactionType: 'Payment',
  Account: wallet.address,
  Destination: 'rUserAccount123456789012345678901234',
  Amount: '1000000',  // 1 XRP (drops)
  Fee: '12'  // 수수료 (drops)
};
```

#### **Payment (IOU)**
```javascript
const iouPaymentTx = {
  TransactionType: 'Payment',
  Account: wallet.address,
  Destination: 'rUserAccount123456789012345678901234',
  Amount: {
    currency: 'USD',
    issuer: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
    value: '100.00'
  }
};
```

---

## 🔍 **데이터 조회 방법**

### 1. 계정 관점에서 조회 (쉬운 방법)

```javascript
// account_lines API 사용
const accountLines = await client.request({
  command: 'account_lines',
  account: 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo'
});

// 결과 예시
{
  "result": {
    "account": "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
    "lines": [
      {
        "account": "rUserAccount123456789012345678901234",
        "balance": "100.00",
        "currency": "USD",
        "limit": "1000.00",
        "limit_peer": "0.00",
        "quality_in": 0,
        "quality_out": 0
      }
    ]
  }
}
```

### 2. 원장 객체 직접 조회 (저수준)

```javascript
// ledger_entry API 사용
const ledgerEntry = await client.request({
  command: 'ledger_entry',
  ripple_state: {
    accounts: [
      'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo',
      'rUserAccount123456789012345678901234'
    ],
    currency: 'USD'
  }
});

// 결과 예시
{
  "result": {
    "index": "ABC123...DEF456",
    "node": {
      "LedgerEntryType": "RippleState",
      "Balance": {
        "currency": "USD",
        "issuer": "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
        "value": "100.00"
      },
      "HighLimit": {
        "currency": "USD",
        "issuer": "rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo",
        "value": "1000.00"
      },
      "LowLimit": {
        "currency": "USD",
        "issuer": "rUserAccount123456789012345678901234",
        "value": "0.00"
      }
    }
  }
}
```

---

## ⚠️ **문제 해결**

### 자주 발생하는 오류

#### 1. **tecNO_LINE 오류**
```
오류: tecNO_LINE
원인: 신뢰선이 설정되지 않음
해결: TrustSet 트랜잭션 먼저 실행
```

#### 2. **tecUNFUNDED_PAYMENT 오류**
```
오류: tecUNFUNDED_PAYMENT
원인: 잔액 부족
해결: 잔액 확인 후 전송
```

#### 3. **temBAD_AMOUNT 오류**
```
오류: temBAD_AMOUNT
원인: 잘못된 금액 형식
해결: 금액 형식 확인 (문자열로 전송)
```

### 디버깅 팁

#### 1. **트랜잭션 검증**
```javascript
// 트랜잭션 제출 전 검증
const validation = await client.request({
  command: 'submit',
  tx_blob: signed.tx_blob,
  fail_hard: false
});

console.log('검증 결과:', validation.result);
```

#### 2. **계정 상태 확인**
```javascript
// 계정 활성화 상태 확인
const accountInfo = await client.request({
  command: 'account_info',
  account: wallet.address
});

if (accountInfo.result.account_data.Balance === '0') {
  console.log('계정이 활성화되지 않음');
}
```

#### 3. **신뢰선 상태 확인**
```javascript
// 신뢰선 존재 여부 확인
const accountLines = await client.request({
  command: 'account_lines',
  account: wallet.address
});

const hasTrustLine = accountLines.result.lines.some(line => 
  line.currency === 'USD' && 
  line.account === 'rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo'
);
```

---

## 📚 **추가 학습 자료**

### 공식 문서
- **XRPL 공식 문서**: https://xrpl.org/
- **XRPL 개발자 포털**: https://xrpl.org/docs.html
- **API 레퍼런스**: https://xrpl.org/docs.html#api-reference

### 도구 및 탐색기
- **XRPL Explorer**: https://devnet.xrpl.org/
- **XRPL Testnet Explorer**: https://testnet.xrpl.org/
- **XRPL Faucet**: https://faucet.devnet.rippletest.net/

### 커뮤니티
- **XRPL Discord**: https://discord.gg/xrpl
- **XRPL Reddit**: https://reddit.com/r/XRP
- **XRPL GitHub**: https://github.com/XRPLF

---

## 🎯 **요약**

### 핵심 개념 정리

1. **토큰 식별**: 토큰 코드 + 발행자 주소 조합
2. **신뢰선**: TrustSet → RippleState 생성
3. **토큰 전송**: Payment → RippleState.balance 업데이트
4. **데이터 저장**: 원장 객체 (스마트 컨트랙트 아님)
5. **조회 방법**: account_lines (쉬움) 또는 ledger_entry (저수준)

### 개발 워크플로우

```
1. 지갑 생성/복구
   ↓
2. TrustSet으로 신뢰선 설정
   ↓
3. Payment로 토큰 전송
   ↓
4. account_lines로 상태 확인
```

### 다음 단계

- **AMM (Automated Market Maker)** 학습
- **DEX (Decentralized Exchange)** 구현
- **NFT (Non-Fungible Token)** 개발
- **스마트 컨트랙트** 대안 구현

---

**🚀 XRPL 개발의 세계로 오신 것을 환영합니다!**