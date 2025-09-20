# TalkTalk - XRPL 기반 메신저 및 디지털 지갑

> 💬 채팅과 💰 송금이 하나로! XRPL 블록체인 기반의 혁신적인 소셜 페이먼트 플랫폼

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![XRPL](https://img.shields.io/badge/XRPL-v4.3.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)

## 🌟 개요

TalkTalk은 XRPL(XRP Ledger) 블록체인을 기반으로 한 메신저와 디지털 지갑이 통합된 웹 애플리케이션입니다. 사용자들은 친구들과 채팅하면서 동시에 안전하고 빠른 암호화폐 송금을 경험할 수 있습니다.

### 🎯 핵심 가치
- **소셜 페이먼트**: 채팅 중 바로 송금 가능
- **사용자 친화적**: 복잡한 블록체인 기술을 쉽게
- **보안성**: XRPL의 검증된 보안 기술
- **실시간**: 즉시 거래 확인 및 알림

## ✨ 주요 기능

### 💬 메신저 기능
- **실시간 채팅**: WebSocket 기반 실시간 메시징
- **친구 관리**: 전화번호 기반 친구 추가/관리
- **채팅방 관리**: 개인/그룹 채팅방 생성 및 관리
- **온라인 상태**: 실시간 접속 상태 표시

### 💰 지갑 기능
- **다중 자산 지원**: XRP 및 다양한 IOU 토큰
- **일반 전송**: 1:1 즉시 송금
- **일괄 전송**: 여러 명에게 동시 송금 (3가지 모드)
- **조건부 전송**: Escrow를 통한 스마트 컨트랙트 송금
- **자산 관리**: TrustLine 설정 및 자산 활성화

### 🔐 보안 기능
- **지갑 암호화**: 개인키 안전 저장 (Redis)
- **전화번호 인증**: SMS 기반 사용자 인증
- **트랜잭션 검증**: XRPL 네이티브 검증 시스템

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18.x
- **Styling**: Tailwind CSS
- **State Management**: Jotai

### Backend
- **Runtime**: Node.js
- **Database**: Redis (사용자 데이터, 세션)
- **Blockchain**: XRPL (XRP Ledger v4.3.0)
- **Real-time**: WebSocket (채팅)

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (XRPL)        │
│                 │    │                 │    │                 │
│ • React Pages   │    │ • API Routes    │    │ • Transactions  │
│ • Jotai State   │    │ • WebSocket     │    │ • Ledger Data   │
│ • Tailwind UI   │    │ • Redis Store   │    │ • Smart Escrow  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.x 이상
- Redis Server
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd talktalk

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 설정 입력

# Redis 서버 시작
redis-server

# 개발 서버 실행
npm run dev
```

### 환경 변수

```env
# XRPL 네트워크 설정
XRPL_NETWORK=devnet  # 또는 mainnet
XRPL_SERVER=wss://s.devnet.rippletest.net:51233

# Redis 설정
REDIS_URL=redis://localhost:6379

# 애플리케이션 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEBUG=true
```

## 📱 사용 방법

### 1. 회원가입 및 로그인
1. 전화번호 입력
2. SMS 인증 코드 확인
3. 지갑 생성 또는 복구

### 2. 친구 추가
1. 친구 페이지에서 전화번호로 검색
2. 친구 요청 전송
3. 상대방 승인 후 친구 목록에 추가

### 3. 채팅 및 송금
1. 친구 목록에서 채팅 시작
2. 메시지 전송 또는 송금 버튼 클릭
3. 송금 유형 선택 (일반/일괄/조건부)
4. 금액 및 상세 정보 입력 후 전송

### 4. 자산 관리
1. 자산 추가 페이지에서 TrustLine 설정
2. 지원하는 토큰 목록에서 선택
3. 트랜잭션 승인 후 자산 활성화

## 🔧 핵심 컴포넌트

### XRPL 통합 모듈
```typescript
// V2 표준 라이브러리 구조
src/lib/xrpl/
├── xrpl-client.ts          # XRPL 클라이언트 관리
├── xrpl-manager-v2.ts      # 통합 매니저
├── xrpl-transfer-v2.ts     # 일반 전송
├── xrpl-batch-v2.ts        # 일괄 전송
├── xrpl-escrow-v2.ts       # 조건부 전송
└── wallet-utils-v2.ts      # 지갑 유틸리티
```

### 주요 API 라우트
```typescript
/api/
├── chat/[roomId]           # 채팅 WebSocket
├── friends                 # 친구 관리
├── phone-mapping          # 전화번호-지갑 매핑
├── health                 # 헬스체크
└── ready                  # 서비스 준비 상태
```

## 🔄 트랜잭션 흐름

### 일반 전송
1. 사용자 입력 (수신자, 금액, 통화)
2. 개인키 조회 (Redis)
3. XRPL 지갑 설정
4. Payment 트랜잭션 생성
5. 서명 및 전송
6. 결과 반환

### 일괄 전송 (3가지 모드)
- **Independent**: 각각 독립적으로 실행
- **AllOrNothing**: 모두 성공 또는 모두 실패
- **UntilFailure**: 순차 실행, 실패 시 중단

### 조건부 전송 (Escrow)
1. 시간 기반 조건 설정
2. EscrowCreate 트랜잭션
3. 조건 충족 시 EscrowFinish
4. 시간 초과 시 EscrowCancel

## 🛡️ 보안 고려사항

### 개인키 관리
- Redis에 암호화 저장
- 메모리에서 즉시 제거
- 세션 기반 액세스 제어

### 트랜잭션 보안
- XRPL 네이티브 서명
- 이중 서명 방지
- 트랜잭션 해시 검증

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:coverage
```

## 🚀 배포

### 개발 환경
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

### Docker 배포
```bash
docker build -t talktalk .
docker run -p 3000:3000 talktalk
```

## 📊 모니터링

### 성능 메트릭
- 페이지 로드 시간
- 트랜잭션 처리 시간
- WebSocket 연결 상태
- Redis 응답 시간

### 에러 추적
- 프론트엔드 에러 로깅
- API 에러 모니터링
- XRPL 트랜잭션 실패 추적

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코딩 스타일
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- 한글 주석 권장

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 지원

- **문서**: [docs/](./docs/)
- **이슈**: [GitHub Issues](https://github.com/your-repo/talktalk/issues)
- **이메일**: support@talktalk.com

## 🙏 감사의 말

- **XRPL Foundation**: 블록체인 인프라 제공
- **Next.js Team**: 뛰어난 React 프레임워크
- **Tailwind CSS**: 아름다운 UI 라이브러리
- **오픈소스 커뮤니티**: 지속적인 기여와 피드백

---

**TalkTalk과 함께 새로운 소셜 페이먼트 경험을 시작하세요! 🚀**