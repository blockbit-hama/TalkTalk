# TalkTalk 시퀀스 다이어그램

> 주요 기능별 상세한 시퀀스 다이어그램을 통한 시스템 흐름 분석

## 📋 목차

1. [사용자 등록 및 지갑 생성](#1-사용자-등록-및-지갑-생성)
2. [친구 추가 및 관리](#2-친구-추가-및-관리)
3. [실시간 채팅](#3-실시간-채팅)
4. [일반 전송 (XRP/IOU)](#4-일반-전송-xrpiou)
5. [일괄 전송 (Batch Payment)](#5-일괄-전송-batch-payment)
6. [조건부 전송 (Escrow)](#6-조건부-전송-escrow)
7. [자산 관리 (TrustLine)](#7-자산-관리-trustline)

---

## 1. 사용자 등록 및 지갑 생성

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant B as Backend API
    participant R as Redis
    participant X as XRPL

    Note over U,X: 사용자 등록 및 지갑 생성 프로세스

    U->>F: 전화번호 입력
    F->>B: POST /api/phone-verification
    B->>B: SMS 인증 코드 생성
    B->>R: 인증 코드 저장 (TTL: 5분)
    B-->>F: 인증 코드 전송 완료
    F-->>U: SMS 전송 완료 메시지

    U->>F: 인증 코드 입력
    F->>B: POST /api/verify-code
    B->>R: 인증 코드 검증

    alt 인증 성공
        B->>B: 새 지갑 생성 (XRPL Wallet)
        B->>X: 지갑 주소 검증
        X-->>B: 주소 검증 완료
        B->>R: 지갑 정보 저장 (전화번호-지갑 매핑)
        B->>R: 세션 생성
        B-->>F: 로그인 성공 + 지갑 정보
        F->>F: 세션 저장 (localStorage)
        F-->>U: 메인 화면 이동
    else 인증 실패
        B-->>F: 인증 실패 에러
        F-->>U: 에러 메시지 표시
    end
```

### 주요 프로세스
1. **전화번호 인증**: SMS 기반 본인 확인
2. **지갑 생성**: XRPL 네이티브 지갑 생성
3. **데이터 저장**: Redis에 암호화된 개인키 저장
4. **세션 관리**: 로그인 상태 유지

---

## 2. 친구 추가 및 관리

```mermaid
sequenceDiagram
    participant U1 as 사용자A
    participant F1 as Frontend A
    participant B as Backend API
    participant R as Redis
    participant F2 as Frontend B
    participant U2 as 사용자B

    Note over U1,U2: 친구 추가 및 관리 프로세스

    U1->>F1: 친구 전화번호 입력
    F1->>B: GET /api/friends/search
    B->>R: 전화번호로 사용자 검색

    alt 사용자 존재
        R-->>B: 사용자 정보 반환
        B-->>F1: 사용자 정보 + 상태
        F1-->>U1: 친구 정보 표시

        U1->>F1: 친구 추가 요청
        F1->>B: POST /api/friends/request
        B->>R: 친구 요청 저장
        B->>B: 실시간 알림 전송 (WebSocket)
        B-->>F2: 친구 요청 알림
        F2-->>U2: 알림 표시
        B-->>F1: 요청 전송 완료
        F1-->>U1: 요청 전송 완료 메시지

        U2->>F2: 친구 요청 수락
        F2->>B: POST /api/friends/accept
        B->>R: 양방향 친구 관계 생성
        B->>B: 양쪽 모두에게 알림 전송
        B-->>F1: 친구 추가 완료 알림
        B-->>F2: 친구 추가 완료 알림
        F1-->>U1: 친구 목록 업데이트
        F2-->>U2: 친구 목록 업데이트
    else 사용자 없음
        R-->>B: 사용자 없음
        B-->>F1: 사용자 없음 응답
        F1-->>U1: "등록되지 않은 번호" 메시지
    end
```

### 주요 프로세스
1. **사용자 검색**: 전화번호 기반 사용자 조회
2. **친구 요청**: 비동기 친구 요청 시스템
3. **실시간 알림**: WebSocket을 통한 즉시 알림
4. **양방향 관계**: 상호 친구 관계 생성

---

## 3. 실시간 채팅

```mermaid
sequenceDiagram
    participant U1 as 사용자A
    participant F1 as Frontend A
    participant W1 as WebSocket A
    participant B as Backend Server
    participant W2 as WebSocket B
    participant F2 as Frontend B
    participant U2 as 사용자B
    participant R as Redis

    Note over U1,U2: 실시간 채팅 프로세스

    U1->>F1: 친구와 채팅 시작
    F1->>B: GET /api/chat/rooms
    B->>R: 기존 채팅방 확인

    alt 기존 채팅방 있음
        R-->>B: 채팅방 정보 반환
    else 새 채팅방 생성
        B->>R: 새 채팅방 생성
        R-->>B: 채팅방 ID 반환
    end

    B-->>F1: 채팅방 정보
    F1->>W1: WebSocket 연결 요청
    W1->>B: 채팅방 참여 요청
    B->>R: 사용자 온라인 상태 업데이트
    B-->>W1: 연결 성공

    U2->>F2: 같은 채팅방 접속
    F2->>W2: WebSocket 연결 요청
    W2->>B: 채팅방 참여 요청
    B->>R: 사용자 온라인 상태 업데이트
    B-->>W2: 연결 성공
    B-->>W1: 상대방 접속 알림

    U1->>F1: 메시지 입력 및 전송
    F1->>W1: 메시지 전송
    W1->>B: 메시지 처리
    B->>R: 메시지 저장
    B->>W1: 전송 확인
    B->>W2: 메시지 전달
    W1-->>F1: 전송 완료
    W2-->>F2: 새 메시지 수신
    F1-->>U1: 메시지 상태 업데이트
    F2-->>U2: 새 메시지 표시

    Note over U1,U2: 메시지 읽음 처리
    U2->>F2: 메시지 읽음
    F2->>W2: 읽음 상태 전송
    W2->>B: 읽음 상태 처리
    B->>R: 읽음 상태 저장
    B->>W1: 읽음 상태 전달
    W1-->>F1: 읽음 상태 업데이트
    F1-->>U1: 읽음 표시 (✓✓)
```

### 주요 프로세스
1. **채팅방 관리**: 동적 채팅방 생성 및 관리
2. **WebSocket 연결**: 실시간 양방향 통신
3. **메시지 전달**: 즉시 메시지 전송 및 수신
4. **상태 관리**: 온라인/오프라인, 읽음 상태 관리

---

## 4. 일반 전송 (XRP/IOU)

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant B as Backend API
    participant R as Redis
    participant XM as XRPL Manager
    participant X as XRPL Network

    Note over U,X: 일반 전송 프로세스 (XRP/IOU)

    U->>F: 전송 페이지 접속
    F->>B: GET /api/friends (친구 목록)
    B->>R: 친구 목록 조회
    R-->>B: 친구 데이터
    B-->>F: 친구 목록 반환
    F-->>U: 친구 선택 UI 표시

    U->>F: 수신자, 금액, 통화 선택
    F->>F: 입력 검증 (금액, 주소 형식)
    F->>B: POST /api/transfer/validate
    B->>XM: 잔액 확인
    XM->>X: getXrpBalance / account_lines
    X-->>XM: 잔액 정보
    XM-->>B: 잔액 검증 결과

    alt 잔액 충분
        B-->>F: 검증 성공
        F-->>U: 전송 확인 UI

        U->>F: 전송 확인
        F->>B: POST /api/transfer/execute
        B->>R: 사용자 개인키 조회
        R-->>B: 암호화된 개인키
        B->>B: 개인키 복호화
        B->>XM: 지갑 설정 및 전송 실행

        XM->>XM: Wallet.fromSeed(privateKey)
        XM->>X: client.autofill(transaction)
        X-->>XM: 준비된 트랜잭션
        XM->>XM: wallet.sign(transaction)
        XM->>X: client.submitAndWait(signedTx)

        X->>X: 트랜잭션 검증 및 처리
        X-->>XM: 트랜잭션 결과
        XM-->>B: 전송 결과
        B->>B: 개인키 메모리에서 제거
        B->>R: 트랜잭션 로그 저장
        B-->>F: 전송 결과 반환
        F->>F: 잔액 새로고침 이벤트 발생
        F-->>U: 전송 완료 화면
    else 잔액 부족
        B-->>F: 잔액 부족 에러
        F-->>U: 잔액 부족 메시지
    end
```

### 주요 프로세스
1. **사전 검증**: 잔액 및 입력값 검증
2. **보안 처리**: 개인키 안전 처리 (복호화 → 사용 → 즉시 제거)
3. **XRPL 통합**: 표준 XRPL 트랜잭션 패턴
4. **결과 처리**: 성공/실패 결과 처리 및 UI 업데이트

---

## 5. 일괄 전송 (Batch Payment)

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant B as Backend API
    participant R as Redis
    participant XB as XRPL Batch Manager
    participant X as XRPL Network

    Note over U,X: 일괄 전송 프로세스 (네이티브 Batch 트랜잭션)

    U->>F: 일괄 전송 페이지 접속
    F->>B: GET /api/friends (친구 목록)
    B->>R: 친구 목록 조회
    R-->>B: 친구 데이터
    B-->>F: 친구 목록 반환

    U->>F: 여러 수신자 및 금액 설정
    F->>F: Batch 모드 선택 (Independent/AllOrNothing/UntilFailure)
    F->>B: POST /api/batch/validate
    B->>XB: 일괄 잔액 검증
    XB->>X: 총 필요 금액 계산 및 잔액 확인
    X-->>XB: 잔액 정보
    XB-->>B: 검증 결과

    alt 검증 성공
        B-->>F: 검증 통과
        F-->>U: 일괄 전송 확인 UI

        U->>F: 일괄 전송 실행
        F->>B: POST /api/batch/execute
        B->>R: 사용자 개인키 조회
        R-->>B: 암호화된 개인키
        B->>XB: 일괄 전송 실행

        XB->>X: account_info (Sequence 조회)
        X-->>XB: 계정 정보
        XB->>XB: RawTransactions 배열 생성

        loop 각 결제 건별
            XB->>XB: Payment 트랜잭션 생성
            XB->>XB: Sequence 번호 할당
        end

        XB->>XB: Batch 트랜잭션 생성
        Note right of XB: TransactionType: "Batch"<br/>Flags: 모드별 플래그<br/>RawTransactions: 내부 트랜잭션들

        XB->>X: client.autofill(batchTx)
        X-->>XB: 준비된 Batch 트랜잭션
        XB->>XB: wallet.sign(batchTx)
        XB->>X: client.submitAndWait(signedBatch)

        X->>X: Batch 트랜잭션 처리
        alt Batch 성공
            X->>X: 모든 내부 트랜잭션 실행
            X-->>XB: 모든 결제 성공
        else Batch 실패 (모드별)
            X->>X: 모드에 따른 실패 처리
            X-->>XB: 부분/전체 실패 결과
        end

        XB-->>B: 일괄 전송 결과
        B->>R: 트랜잭션 로그 저장
        B-->>F: 결과 반환 (성공/실패 개수)
        F-->>U: 일괄 전송 결과 화면
    else 검증 실패
        B-->>F: 검증 실패 (잔액 부족 등)
        F-->>U: 에러 메시지 표시
    end
```

### Batch 모드별 처리
- **Independent (0x00080000)**: 각 트랜잭션 독립 실행
- **AllOrNothing (0x00010000)**: 모두 성공 또는 모두 실패
- **UntilFailure (0x00040000)**: 순차 실행, 첫 실패 시 중단

---

## 6. 조건부 전송 (Escrow)

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant B as Backend API
    participant R as Redis
    participant XE as XRPL Escrow Manager
    participant X as XRPL Network

    Note over U,X: 조건부 전송 (Escrow) 프로세스

    U->>F: Escrow 페이지 접속
    F->>B: GET /api/friends
    B->>R: 친구 목록 조회
    R-->>B: 친구 데이터
    B-->>F: 친구 목록 반환

    U->>F: 수신자, 금액, 시간 조건 설정
    F->>F: 시간 조건 검증 (완료 < 취소)
    F->>B: POST /api/escrow/create
    B->>R: 사용자 개인키 조회
    R-->>B: 암호화된 개인키
    B->>XE: Escrow 생성 실행

    XE->>XE: 시간 조건을 Ripple Timestamp로 변환
    XE->>XE: EscrowCreate 트랜잭션 생성
    Note right of XE: TransactionType: "EscrowCreate"<br/>Amount: 보관할 금액<br/>Destination: 수신자<br/>FinishAfter: 완료 가능 시간<br/>CancelAfter: 취소 가능 시간

    XE->>X: client.autofill(escrowTx)
    X-->>XE: 준비된 Escrow 트랜잭션
    XE->>XE: wallet.sign(escrowTx)
    XE->>X: client.submitAndWait(signedEscrow)

    X->>X: Escrow 트랜잭션 검증 및 생성
    X-->>XE: Escrow 생성 결과 + Sequence
    XE-->>B: Escrow 생성 완료
    B->>R: Escrow 정보 저장
    B-->>F: 생성 결과 반환
    F-->>U: Escrow 생성 완료 화면

    Note over U,X: === 시간 경과 후 Escrow 완료 ===

    U->>F: Escrow 완료 요청
    F->>B: POST /api/escrow/finish
    B->>XE: Escrow 완료 실행

    XE->>XE: EscrowFinish 트랜잭션 생성
    Note right of XE: TransactionType: "EscrowFinish"<br/>Owner: 원래 송신자<br/>OfferSequence: Escrow ID

    XE->>X: client.autofill(finishTx)
    X-->>XE: 준비된 완료 트랜잭션
    XE->>XE: wallet.sign(finishTx)
    XE->>X: client.submitAndWait(signedFinish)

    alt 완료 조건 충족
        X->>X: Escrow 해제 및 송금 실행
        X-->>XE: 완료 성공
        XE-->>B: Escrow 완료 결과
        B-->>F: 완료 성공
        F-->>U: 송금 완료 메시지
    else 완료 조건 미충족
        X-->>XE: 완료 실패 (시간 조건 등)
        XE-->>B: 완료 실패 결과
        B-->>F: 완료 실패
        F-->>U: 실패 사유 표시
    end
```

### Escrow 주요 기능
1. **시간 기반 조건**: FinishAfter, CancelAfter 설정
2. **자동 해제**: 조건 충족 시 자동 송금
3. **취소 기능**: 시간 초과 시 원송신자에게 반환
4. **안전 보관**: 중간 상태에서 안전하게 자금 보관

---

## 7. 자산 관리 (TrustLine)

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant B as Backend API
    participant R as Redis
    participant XT as XRPL TrustLine Manager
    participant X as XRPL Network

    Note over U,X: TrustLine 설정 및 자산 관리

    U->>F: 자산 추가 페이지 접속
    F->>B: GET /api/assets/available
    B->>B: 지원 토큰 목록 조회
    B-->>F: 사용 가능한 토큰 목록
    F-->>U: 토큰 선택 UI 표시

    U->>F: 추가할 토큰 선택 (예: USD)
    F->>F: TrustLine 한도 설정 (기본값 또는 사용자 입력)
    F->>B: POST /api/trustline/create
    B->>R: 사용자 개인키 조회
    R-->>B: 암호화된 개인키
    B->>XT: TrustLine 생성 실행

    XT->>XT: TrustSet 트랜잭션 생성
    Note right of XT: TransactionType: "TrustSet"<br/>LimitAmount: {<br/>  currency: "USD",<br/>  issuer: "발행자주소",<br/>  value: "한도금액"<br/>}

    XT->>X: client.autofill(trustSetTx)
    X-->>XT: 준비된 TrustSet 트랜잭션
    XT->>XT: wallet.sign(trustSetTx)
    XT->>X: client.submitAndWait(signedTrustSet)

    X->>X: TrustLine 생성 검증 및 설정
    X-->>XT: TrustLine 생성 결과
    XT-->>B: TrustLine 설정 완료
    B->>R: 활성화된 자산 목록 업데이트
    B-->>F: 설정 완료 결과
    F->>F: 자산 목록 새로고침
    F-->>U: TrustLine 설정 완료 메시지

    Note over U,X: === 자산 잔액 조회 ===

    F->>B: GET /api/assets/balances
    B->>XT: 자산 잔액 조회
    XT->>X: account_lines 요청
    X-->>XT: TrustLine 정보 및 잔액
    XT-->>B: 자산별 잔액 정보
    B-->>F: 잔액 데이터 반환
    F-->>U: 자산 잔액 표시 업데이트
```

### TrustLine 주요 개념
1. **신뢰선 설정**: 특정 발행자의 토큰을 받을 수 있도록 설정
2. **한도 관리**: 최대 보유 가능한 토큰 양 설정
3. **발행자 검증**: 신뢰할 수 있는 토큰 발행자 확인
4. **잔액 조회**: 설정된 모든 자산의 실시간 잔액 확인

---

## 🔄 공통 에러 처리 패턴

모든 시퀀스에서 공통으로 적용되는 에러 처리:

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant X as XRPL

    F->>B: API 요청
    B->>X: XRPL 트랜잭션

    alt 네트워크 에러
        X-->>B: 네트워크 타임아웃
        B-->>F: { success: false, error: "네트워크 연결 실패" }
        F->>F: 재시도 버튼 표시
    else 잔액 부족
        X-->>B: tecUNFUNDED_PAYMENT
        B-->>F: { success: false, error: "잔액이 부족합니다" }
        F->>F: 잔액 확인 링크 표시
    else 트랜잭션 실패
        X-->>B: tecXXX 에러 코드
        B-->>F: { success: false, error: "상세 에러 메시지" }
        F->>F: 에러 상황별 가이드 표시
    else 성공
        X-->>B: 트랜잭션 성공
        B-->>F: { success: true, data: "결과데이터" }
        F->>F: 성공 UI 표시
    end
```

---

## 📊 성능 최적화 포인트

1. **WebSocket 연결 풀링**: 채팅 연결 재사용
2. **Redis 캐싱**: 친구 목록, 잔액 정보 캐싱
3. **XRPL 연결 관리**: 연결 풀 및 재연결 로직
4. **배치 처리**: 여러 트랜잭션 통합 처리
5. **비동기 처리**: 무거운 작업의 백그라운드 처리

이러한 시퀀스 다이어그램을 통해 TalkTalk의 복잡한 비즈니스 로직과 블록체인 통합 과정을 명확히 이해할 수 있습니다.