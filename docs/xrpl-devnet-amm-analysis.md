# XRPL Devnet AMM 풀 조사 보고서

## 조사 개요
XRPL Devnet에서 현재 운영 중인 Automated Market Maker (AMM) 풀들을 실제 API를 통해 조사하고, xTalk-Wallet 프로젝트에서의 활용 방안을 검토한 보고서입니다.

**조사 일시**: 2025-09-15
**조사 방법**: XRPL Devnet API 직접 조회
**API 엔드포인트**: `https://s.devnet.rippletest.net:51234`

## 1. XRPL Devnet AMM 현황

### 1.1 AMM 활성화 상태
- **AMM Amendment 상태**: ✅ 활성화됨 (2024-03-22부터 Mainnet 활성화)
- **Devnet AMM 풀 개수**: 13개 이상의 활성 풀 확인
- **주요 특징**: Protocol-native AMM으로 XRPL 코어에 직접 통합

### 1.2 발견된 주요 AMM 풀들

#### XRP/USD 풀들
1. **풀 #1**: `r4ZHwSu7teyPGHtzLDBaFDnKX7x8vDDe76`
   - **토큰 페어**: XRP/USD
   - **XRP 유동성**: 19.999999 XRP (19,999,999 drops)
   - **USD 유동성**: 10 USD
   - **USD 발행자**: `rJgqyVQrzRQTQREVTYK21843LR7vb7LapX`
   - **LP 토큰**: 14,142.13527017754 LP
   - **거래 수수료**: 0% (경매 슬롯 시스템)
   - **상태**: 활성

2. **풀 #2**: `rNJjRbgetvKULEgAUxqkwF239dAYB1C2L2`
   - **토큰 페어**: XRP/USD
   - **USD 발행자**: `rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x`
   - **LP 토큰**: 10,000 LP
   - **상태**: 활성

3. **풀 #3**: `rGnK2mHxmGoYY1HFSdT4RBuXzGT1UYE4fc`
   - **토큰 페어**: XRP/USD
   - **USD 발행자**: `rBXYWgAg6z5NxCshzGkNuX3YjHFyN26cgj`
   - **LP 토큰**: 10,000 LP
   - **상태**: 활성

#### CNY/USD 풀
4. **풀 #4**: `r3Ppzo2up6jqa2kRnVaH8uHNLvXDzmmjr8`
   - **토큰 페어**: CNY/USD
   - **CNY 유동성**: 5 CNY
   - **USD 유동성**: 5 USD
   - **CNY 발행자**: `rDW5XUdsgntHUU8nBQs1zAXQw2ti6p44KL`
   - **USD 발행자**: `rDW5XUdsgntHUU8nBQs1zAXQw2ti6p44KL`
   - **LP 토큰**: 5 LP
   - **거래 수수료**: 0%
   - **상태**: 활성

### 1.3 공통 특징
- **경매 슬롯 시스템**: 모든 풀에서 24시간 경매 시스템 운영
- **거래 수수료**: 대부분 0% (경매 시스템으로 인한 최적화)
- **LP 토큰 형식**: 160비트 16진수 형식 (첫 8비트는 0x03)
- **투표 시스템**: 각 풀마다 거래 수수료에 대한 투표 시스템 존재

## 2. 실제 발행자 주소 목록

### 2.1 USD 토큰 발행자들
```
rJgqyVQrzRQTQREVTYK21843LR7vb7LapX  # 가장 큰 유동성 풀
rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x
rBXYWgAg6z5NxCshzGkNuX3YjHFyN26cgj
rNHWGD1PDwNYm7VryoRhJB5BTpbiyuh9dz
rJN67qvMSbUz7RvgLSAStLGLVP8hxxCWga
rssjuGY3meiB1ztnXwvTatxuQ5dcSxYYYk
rB6TEeGaxgpSpmHRq77j7RWiVKm5ciS9k
rpd5NhiaDZYW1wTpjXGtQrjti9eGKpBazW
rfsyJGvtbMDGRnHUPVqE6YFqT8XU2GFiTf
r32GFD7mZqxzCHWwu4V8QGmAZmCdHVL9JF
rKn29XvYkV2rvZi1FYTiR9ZTjikx5VBCxH
```

### 2.2 CNY 토큰 발행자들
```
rDW5XUdsgntHUU8nBQs1zAXQw2ti6p44KL
rhosNALsyfaQGShmMejBuwwfNqCerkTa2m
```

## 3. XRPL AMM 기술적 특징

### 3.1 독특한 특징들
1. **Protocol-Native**: 이더리움 기반 AMM과 달리 XRPL 프로토콜에 직접 통합
2. **경매 메커니즘**: 24시간 거래 우위권을 경매로 판매, 거의 제로 수수료 제공
3. **CLOB 통합**: 중앙 제한가 주문장(CLOB)과 통합되어 최적 경로 자동 선택
4. **생성 비용**: 0.2 XRP (일반 트랜잭션의 20,000배)

### 3.2 AMM 생성 및 관리
- **객체 소유**: AMM 객체는 소유자가 없는 ledger 객체
- **LP 토큰**: SHA-512 해시 기반의 특수 currency 코드 사용
- **자동 중재**: 경매 시스템을 통한 즉시 차익거래 및 안정적 변동성 유지

## 4. xTalk-Wallet 활용 방안

### 4.1 현재 상황 분석
**현재 xTalk-Wallet 구조**:
- Mock 토큰 사용: USD, EUR, JPY, KRW (발행자: `rN7n7otQDd6FczFgLdAtqDSSz6Mk5P1MBo`)
- Mock AMM 매니저로 가상 스왑 실행

### 4.2 실제 Devnet AMM 풀 활용 제안

#### Phase 1: 실제 USD 토큰 연동
```typescript
// 현재 Mock 토큰을 실제 Devnet 토큰으로 교체
export const DEVNET_TOKENS: MockToken[] = [
  {
    currency: 'USD',
    issuer: 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX', // 실제 Devnet issuer
    name: 'Devnet USD',
    symbol: 'USD',
    decimals: 2
  }
];
```

#### Phase 2: 실제 AMM API 연동
```typescript
// amm_info API를 사용한 실제 풀 정보 조회
async getAMMInfo(asset1, asset2): Promise<AMMPoolInfo> {
  const response = await this.client.request({
    command: 'amm_info',
    asset: asset1,
    asset2: asset2
  });
  return response.result.amm;
}
```

#### Phase 3: 실제 스왑 실행
- Payment 트랜잭션을 통한 실제 AMM 스왑
- 경로 찾기 자동화
- 슬리피지 및 가격 영향 실시간 계산

### 4.3 권장 구현 전략

#### 4.3.1 단계적 접근
1. **개발 환경**: Mock AMM → Devnet AMM 전환
2. **테스트 환경**: Devnet AMM 풀 활용
3. **프로덕션**: Mainnet AMM 풀 연동

#### 4.3.2 선택할 AMM 풀
**우선순위 1**: `r4ZHwSu7teyPGHtzLDBaFDnKX7x8vDDe76` (XRP/USD)
- **이유**: 가장 높은 유동성 (19.99 XRP / 10 USD)
- **안정성**: 활발한 거래와 경매 활동
- **발행자**: `rJgqyVQrzRQTQREVTYK21843LR7vb7LapX`

#### 4.3.3 구현 우선사항
1. **Trust Line 자동 생성**: 실제 토큰 사용을 위한 Trust Line 설정
2. **실시간 풀 정보**: `amm_info` API를 통한 실시간 유동성 정보
3. **가격 계산**: Constant Product 공식 기반 실시간 가격 계산
4. **경매 슬롯 정보**: 현재 경매 상태 및 수수료 정보 표시

## 5. 구현 코드 예시

### 5.1 실제 AMM 정보 조회
```typescript
async getDevnetAMMInfo(): Promise<AMMPoolInfo | null> {
  try {
    const response = await this.client.request({
      command: 'amm_info',
      amm_account: 'r4ZHwSu7teyPGHtzLDBaFDnKX7x8vDDe76'
    });

    return {
      account: response.result.amm.account,
      amount: response.result.amm.amount,
      amount2: response.result.amm.amount2,
      tradingFee: response.result.amm.trading_fee,
      auctionSlot: response.result.amm.auction_slot,
      lpToken: response.result.amm.lp_token
    };
  } catch (error) {
    console.error('Failed to get Devnet AMM info:', error);
    return null;
  }
}
```

### 5.2 실제 Trust Line 생성
```typescript
async createDevnetTrustLine(): Promise<string | null> {
  const trustSetTx: TrustSet = {
    TransactionType: 'TrustSet',
    Account: this.wallet.address,
    LimitAmount: {
      currency: 'USD',
      issuer: 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX',
      value: '1000000'
    }
  };

  // 트랜잭션 실행...
}
```

## 6. 결론 및 권장사항

### 6.1 주요 발견사항
1. **활성 AMM 풀 다수 존재**: 13개 이상의 실제 운영 중인 AMM 풀 확인
2. **실제 토큰 사용 가능**: Mock 토큰 대신 실제 Devnet 토큰 활용 가능
3. **프로토콜 수준 통합**: 이더리움과 달리 XRPL 코어에 직접 통합된 AMM

### 6.2 xTalk-Wallet 개선 권장사항
1. **즉시 적용 가능**: 현재 Mock AMM을 Devnet AMM으로 전환
2. **사용자 경험 향상**: 실제 거래 시뮬레이션 및 실제 시장 데이터 활용
3. **학습 효과**: 실제 XRPL AMM 메커니즘 이해 및 경험

### 6.3 다음 단계
1. **Mock 토큰 교체**: `rJgqyVQrzRQTQREVTYK21843LR7vb7LapX` USD 토큰 사용
2. **실제 API 연동**: `amm_info` API를 활용한 실시간 풀 정보 조회
3. **Trust Line 구현**: 실제 토큰 사용을 위한 Trust Line 자동 생성
4. **테스트넷 활용**: Devnet Faucet 활용한 테스트 토큰 확보

**결론**: XRPL Devnet에는 충분한 수의 활성 AMM 풀이 존재하며, xTalk-Wallet에서 Mock 구현 대신 실제 Devnet AMM을 활용하는 것이 교육적 가치와 사용자 경험 측면에서 훨씬 유리할 것으로 판단됩니다.