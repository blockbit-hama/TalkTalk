# Redis 기반 전화번호 사용자 시스템

## 개요

이 시스템은 전화번호를 사용자 ID로 사용하여 사용자 정보, 친구 관계, 채팅, 자산 전송을 관리하는 Redis 기반 시스템입니다.

## Redis 키 구조

### 사용자 프로필
- `user:{전화번호}` → `UserProfile` 객체
- `online:{전화번호}` → 온라인 상태 정보
- `users:all` → 전체 사용자 전화번호 목록

### 채팅 시스템
- `chat:room:{roomId}` → `ChatRoom` 객체
- `chat:messages:{roomId}` → `ChatMessage[]` 배열
- `user:rooms:{전화번호}` → 사용자의 채팅방 ID 목록
- `rooms:all` → 전체 채팅방 ID 목록

## API 엔드포인트

### 1. 사용자 등록 및 관리

#### 사용자 등록
```http
POST /api/user/register
Content-Type: application/json

{
  "phoneNumber": "010-1234-5678",
  "userName": "홍길동",
  "walletAddress": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "initialXrpBalance": "1000"
}
```

#### 사용자 정보 조회
```http
GET /api/user/register?phoneNumber=010-1234-5678
```

#### 사용자 검색
```http
GET /api/user/register?search=홍길동
```

#### 온라인 상태 업데이트
```http
PATCH /api/user/register
Content-Type: application/json

{
  "phoneNumber": "010-1234-5678",
  "isOnline": true
}
```

### 2. 친구 관리

#### 친구 추가
```http
POST /api/friends/new
Content-Type: application/json

{
  "userPhone": "010-1234-5678",
  "friendPhone": "010-9876-5432",
  "nickname": "친구별명"
}
```

#### 친구 목록 조회
```http
GET /api/friends/new?userPhone=010-1234-5678
```

#### 친구 삭제
```http
DELETE /api/friends/new?userPhone=010-1234-5678&friendPhone=010-9876-5432
```

#### 친구 별명 변경
```http
PUT /api/friends/new
Content-Type: application/json

{
  "userPhone": "010-1234-5678",
  "friendPhone": "010-9876-5432",
  "nickname": "새별명"
}
```

### 3. 채팅 시스템

#### 채팅방 생성
```http
POST /api/chat
Content-Type: application/json

{
  "participants": ["010-1234-5678", "010-9876-5432"],
  "roomName": "우리 채팅방"
}
```

#### 채팅방 목록 조회
```http
GET /api/chat?userPhone=010-1234-5678
```

#### 특정 채팅방 조회
```http
GET /api/chat?roomId=room_1234567890_abcdef
```

#### 메시지 전송
```http
PUT /api/chat
Content-Type: application/json

{
  "roomId": "room_1234567890_abcdef",
  "senderPhone": "010-1234-5678",
  "type": "text",
  "content": "안녕하세요!",
  "metadata": {}
}
```

#### 채팅방 메시지 조회
```http
PATCH /api/chat?roomId=room_1234567890_abcdef&limit=50
```

### 4. 자산 전송

#### 자산 전송
```http
POST /api/transfer
Content-Type: application/json

{
  "fromPhone": "010-1234-5678",
  "toPhone": "010-9876-5432",
  "amount": "100",
  "currency": "XRP",
  "message": "선물입니다!"
}
```

#### 토큰 전송
```http
POST /api/transfer
Content-Type: application/json

{
  "fromPhone": "010-1234-5678",
  "toPhone": "010-9876-5432",
  "amount": "50",
  "currency": "USDT",
  "tokenIssuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "message": "토큰 전송"
}
```

#### 잔액 조회
```http
GET /api/transfer?phoneNumber=010-1234-5678
```

#### 특정 통화 잔액 조회
```http
GET /api/transfer?phoneNumber=010-1234-5678&currency=XRP
```

#### 토큰 잔액 조회
```http
GET /api/transfer?phoneNumber=010-1234-5678&currency=USDT&tokenIssuer=rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH
```

#### 잔액 업데이트 (관리자용)
```http
PUT /api/transfer
Content-Type: application/json

{
  "phoneNumber": "010-1234-5678",
  "currency": "XRP",
  "balance": "2000"
}
```

## 사용 흐름

### 1. 사용자 등록
1. 사용자가 앱을 처음 실행
2. 지갑 생성 (XRP 주소 생성)
3. 전화번호와 이름 입력
4. `/api/user/register`로 사용자 등록

### 2. 친구 추가
1. 친구의 전화번호 입력
2. `/api/friends/new`로 친구 추가
3. 양방향 친구 관계 자동 생성

### 3. 채팅 시작
1. 친구 목록에서 채팅 시작
2. 자동으로 1:1 채팅방 생성
3. 메시지 전송 및 수신

### 4. 자산 전송
1. 친구에게 자산 전송
2. `/api/transfer`로 전송 실행
3. 자동으로 채팅 메시지 생성
4. 잔액 실시간 업데이트

## 데이터 구조

### UserProfile
```typescript
interface UserProfile {
  phoneNumber: string;        // 사용자 ID (전화번호)
  userName: string;           // 사용자 이름
  walletAddress: string;       // XRPL 지갑 주소
  assets: UserAssets;          // 사용자 자산 정보
  friends: FriendInfo[];       // 친구 목록
  isOnline: boolean;           // 온라인 상태
  lastSeen: string;           // 마지막 접속 시간
  createdAt: string;           // 계정 생성 시간
  updatedAt: string;           // 마지막 업데이트 시간
}
```

### UserAssets
```typescript
interface UserAssets {
  xrp: {
    balance: string;          // XRP 잔액
    address: string;          // XRPL 주소
  };
  tokens: TokenBalance[];     // 토큰 잔액 목록
}
```

### FriendInfo
```typescript
interface FriendInfo {
  phoneNumber: string;        // 친구 전화번호
  userName: string;           // 친구 이름
  walletAddress: string;      // 친구 지갑 주소
  nickname?: string;          // 별명
  isOnline: boolean;          // 온라인 상태
  lastSeen: string;           // 마지막 접속 시간
  addedAt: string;            // 친구 추가 시간
}
```

### ChatRoom
```typescript
interface ChatRoom {
  roomId: string;             // 채팅방 ID
  participants: string[];      // 참여자 전화번호 목록
  roomName?: string;          // 채팅방 이름
  type: 'direct' | 'group';   // 채팅방 타입
  lastMessage?: ChatMessage;   // 마지막 메시지
  lastMessageAt?: string;      // 마지막 메시지 시간
  createdAt: string;           // 생성 시간
  updatedAt: string;          // 업데이트 시간
}
```

### ChatMessage
```typescript
interface ChatMessage {
  messageId: string;           // 메시지 ID
  roomId: string;             // 채팅방 ID
  senderPhone: string;        // 발신자 전화번호
  type: 'text' | 'xrp_transfer' | 'token_transfer' | 'image' | 'system';
  content: string;            // 메시지 내용
  metadata?: {
    amount?: string;           // 전송 금액
    currency?: string;         // 통화
    transactionHash?: string;  // 트랜잭션 해시
    imageUrl?: string;         // 이미지 URL
  };
  timestamp: string;          // 전송 시간
  isRead: boolean;            // 읽음 여부
}
```

## 특징

1. **전화번호 기반**: 전화번호를 사용자 ID로 사용하여 직관적인 사용자 식별
2. **양방향 친구 관계**: 친구 추가시 자동으로 양방향 관계 생성
3. **실시간 채팅**: Redis를 활용한 빠른 메시지 저장 및 조회
4. **자산 통합 관리**: XRP와 토큰을 통합하여 관리
5. **자동 채팅 연동**: 자산 전송시 자동으로 채팅 메시지 생성
6. **온라인 상태 관리**: 실시간 온라인 상태 추적

## 보안 고려사항

1. **전화번호 검증**: 한국 전화번호 형식 검증
2. **잔액 검증**: 전송 전 잔액 확인
3. **권한 검증**: 채팅방 참여자 확인
4. **입력 검증**: 모든 입력값 검증 및 정제

## 확장 가능성

1. **그룹 채팅**: 다수 참여자 채팅방 지원
2. **파일 전송**: 이미지 및 파일 전송 기능
3. **푸시 알림**: 실시간 알림 시스템
4. **암호화**: 메시지 암호화 기능
5. **백업**: 데이터 백업 및 복구 시스템