# xTalk-Wallet 📱

> **XRPL 기반 소셜 지갑 앱**
> 전송 + 채팅 + 친구 기능을 통합한 Web3 소셜 지갑

[![XRPL](https://img.shields.io/badge/XRPL-Devnet-blue)](https://devnet.xrpl.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-06B6D4)](https://tailwindcss.com/)

---

## 🌟 **주요 기능**

### 💼 **XRPL 지갑**
- 🪙 XRP 및 XRPL 토큰 관리
- 💰 실시간 잔액 조회 (XRPL Devnet 연동)
- 🔐 HD 지갑 지원 (시드 구문 기반)
- 🚰 Faucet 연동 (테스트 XRP 자동 충전)

### 👥 **친구 시스템**
- 📞 전화번호 기반 친구 추가
- 👤 친구 관리 및 검색
- 💸 친구에게 직접 전송
- 💬 친구와 1:1 채팅

### 💬 **카카오톡 스타일 채팅**
- 📱 실시간 채팅 시스템
- 💰 전송 이벤트 자동 표시
- 📊 트랜잭션 해시 및 상세 정보
- ⏰ 메시지 시간 표시

### 🔄 **실제 XRPL AMM 스왑** (v1.1 신기능)
- ⚡ 실제 XRPL Devnet AMM 풀 활용
- 💱 XRP/USD, XRP/CNY 실제 AMM 스왑
- 🔄 실패 시 Devnet 기반 Mock 스왑 폴백
- 📊 실시간 환율 및 수수료 계산

### 🔗 **Trust Line 관리**
- 🌐 실제 XRPL Trust Line 설정
- 💎 실제 Devnet 토큰 발행자 연동
- ✅ 자동 트랜잭션 확인
- 🔍 XRPL Explorer 링크 제공

---

## 🆕 **v1.1 주요 업데이트**

### 🎯 **실제 XRPL Devnet AMM 풀 연동**
- **USD**: `rJgqyVQrzRQTQREVTYK21843LR7vb7LapX` (실제 AMM 풀 활성)
- **CNY**: `rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x` (실제 AMM 풀 활성)
- **EUR**: `rBXYWgAg6z5NxCshzGkNuX3YjHFyN26cgj` (Devnet 토큰)
- **TST**: `rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd` (테스트 토큰)

### ✨ **개선된 기능**
- 📊 실제 `amm_info` API로 실시간 AMM 풀 정보 조회
- 🔄 스마트 폴백: 실제 AMM → Mock 스왑 자동 전환
- 💱 실제 XRPL PathFind를 통한 스왑 경로 탐색
- 🌐 실제 XRPL Explorer에서 트랜잭션 확인

---

## 🚀 **빠른 시작**

### 1. **설치**
```bash
git clone https://github.com/your-repo/xtalk-wallet.git
cd xtalk-wallet
npm install
```

### 2. **개발 서버 실행**
```bash
npm run dev
```

### 3. **브라우저에서 접속**
```
http://localhost:3000
```

### 4. **지갑 생성 및 Faucet**
1. 새 지갑 생성
2. Faucet 버튼으로 테스트 XRP 충전
3. Trust Line 설정으로 토큰 활성화
4. 실제 AMM 스왑 테스트

---

## 📱 **사용 가이드**

### **지갑 생성**
```
메인 화면 → 지갑 선택 → "+ 새 지갑 추가"
→ 지갑 이름 입력 → "지갑 생성하기"
```

### **친구 추가**
```
하단 탭바 → "친구" → "+ 추가"
→ 이름/전화번호 입력 → "추가"
```

### **전송하기**
```
메인 화면 → "전송" → 금액 입력
→ 친구 선택 → "전송하기"
```

### **AMM 스왑** (권장)
```
메인 화면 → "스왑" → XRP/USD 선택
→ 금액 입력 → "XRPL AMM 스왑 실행"
```

---

## 🛠 **기술 스택**

### **Frontend**
- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State**: Jotai (Atoms)
- **Data Fetching**: React Query

### **Blockchain**
- **Network**: XRPL Devnet
- **Library**: xrpl.js
- **Connection**: WebSocket (wss://s.devnet.rippletest.net:51233)

### **Storage**
- **Local**: localStorage (개발용)
- **Future**: IndexedDB (프로덕션용)

### **API Integration**
- **XRPL**: 실제 네트워크 연동
- **AMM**: 실제 AMM 풀 + Mock 폴백
- **Faucet**: XRPL Devnet Faucet 연동

---

## 📂 **프로젝트 구조**

```
src/
├── app/                    # Next.js App Router
│   ├── chat/              # 채팅 관련 페이지
│   ├── friends/           # 친구 관리 페이지
│   ├── swap/              # AMM 스왑 페이지
│   ├── trustline/         # Trust Line 설정
│   └── transfer/          # 전송 페이지
├── components/            # 재사용 컴포넌트
│   ├── chat/              # 채팅 컴포넌트
│   ├── ui/                # UI 기본 컴포넌트
│   └── molecules/         # 복합 컴포넌트
├── lib/                   # 라이브러리
│   ├── api/               # API 관련
│   ├── xrpl/              # XRPL 클라이언트
│   └── wallet-utils.ts    # 지갑 유틸리티
├── hooks/                 # React Hooks
└── docs/                  # 프로젝트 문서
```

---

## 🌐 **지원 기능**

### **XRPL 기능**
- ✅ 실제 XRP 전송
- ✅ 실제 Trust Line 설정
- ✅ 실제 AMM 스왑 (USD/CNY)
- ✅ 실제 토큰 전송
- ✅ 실시간 잔액 조회
- ✅ Devnet Faucet 연동

### **소셜 기능**
- ✅ 친구 관리 시스템
- ✅ 1:1 채팅
- ✅ 전송 이벤트 자동 표시
- ✅ 실시간 메시징

### **UI/UX**
- ✅ 모바일 최적화
- ✅ 다크 테마
- ✅ 직관적인 인터페이스
- ✅ 실시간 피드백

---

## 🔧 **환경 변수**

```env
# XRPL 설정
NEXT_PUBLIC_XRPL_NETWORK=devnet

# 기타 설정 (현재 사용하지 않음)
# NEXT_PUBLIC_INFURA_API_KEY=your_infura_key
```

---

## 📚 **문서**

- **[사용자 튜토리얼](docs/user-tutorial.md)**: 앱 사용법
- **[시스템 흐름도](docs/system-flow-diagrams.md)**: 시스템 아키텍처
- **[기술 문서](docs/tech.md)**: XRPL 개발 가이드
- **[TODO 로드맵](docs/todo.md)**: 개발 계획

---

## 🌟 **주요 특징**

### **🎯 100% XRPL 네이티브**
- Smart Contract 없이 XRPL 네이티브 기능만 사용
- 프로토콜 레벨 AMM 활용
- 실제 Trust Line과 토큰 시스템

### **📱 소셜 중심 UX**
- 카카오톡 스타일 직관적 UI
- 친구 기반 전송 시스템
- 채팅 통합 전송 이벤트

### **🔄 스마트 폴백 시스템**
- 실제 AMM 우선 활용
- 실패 시 Mock 스왑 자동 전환
- 끊김 없는 사용자 경험

### **🌐 실제 블록체인 경험**
- 실제 XRPL Devnet 트랜잭션
- XRPL Explorer 연동
- 실제 토큰 발행자 활용

---

## 🤝 **기여하기**

1. 이 저장소를 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경 사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

## 📄 **라이센스**

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

---

## 🔗 **링크**

- **XRPL 공식 문서**: https://xrpl.org/
- **XRPL Devnet Explorer**: https://devnet.xrpl.org/
- **XRPL Devnet Faucet**: https://faucet.devnet.rippletest.net/
- **GitHub Issues**: [이슈 리포트](https://github.com/your-repo/issues)

---

**🎊 실제 XRPL 블록체인 경험을 즐기세요!**