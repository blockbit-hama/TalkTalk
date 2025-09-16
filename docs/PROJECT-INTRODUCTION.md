# 🚀 xTalk-Wallet: 차세대 소셜 Web3 지갑

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.0.2-brightgreen" alt="Version">
  <img src="https://img.shields.io/badge/XRPL-Devnet-blue" alt="XRPL">
  <img src="https://img.shields.io/badge/Next.js-15.3.3-black" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</div>

<div align="center">
  <h3>💬 채팅 + 💸 전송 + 👥 친구 = 🎯 완벽한 Web3 경험</h3>
  <p><strong>블록체인 기술을 누구나 쉽게 사용할 수 있는 소셜 지갑</strong></p>
</div>

---

## 🌟 **프로젝트 비전**

> **"블록체인을 복잡하게 생각하지 마세요. 친구와 채팅하듯 자연스럽게."**

xTalk-Wallet은 단순한 암호화폐 지갑이 아닙니다. 친구와 대화하고, 돈을 보내고, 자산을 관리하는 모든 과정을 하나의 앱에서 자연스럽게 연결한 **소셜 Web3 플랫폼**입니다.

### 🎯 **핵심 가치**

1. **🤝 소셜 우선**: 기술이 아닌 사람 중심의 설계
2. **🎨 직관적 UX**: 블록체인을 몰라도 사용 가능
3. **⚡ 즉시 사용**: 복잡한 설정 없이 바로 시작
4. **🔒 안전성**: XRPL의 검증된 보안 기술 활용

---

## ✨ **주요 특징**

### 💬 **통합된 채팅 & 전송**
- 친구와의 대화 중 자연스러운 송금
- 전송 내역이 채팅 메시지로 자동 기록
- 실시간 서버 동기화로 어디서든 접속 가능

### 🌐 **실제 XRPL 네트워크**
- XRPL Devnet 완벽 연동
- 실제 AMM(자동 마켓 메이커) 스왑
- Trust Line 설정으로 다양한 토큰 지원

### 👥 **소셜 기능**
- 전화번호 기반 친구 관리
- 1:1 채팅방 자동 생성
- 친구별 전송 히스토리

### 🎨 **사용자 친화적 디자인**
- 모바일 최적화 반응형 UI
- 다크 테마 기본 지원
- 커스텀 모달로 부드러운 인터랙션

---

## 🛠 **기술 스택**

### **Frontend**
- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: TailwindCSS 3.4
- **State**: Jotai (원자 상태 관리)
- **UI Components**: Radix UI + 커스텀 컴포넌트

### **Blockchain**
- **Network**: XRPL (XRP Ledger)
- **Library**: xrpl.js 4.0.0
- **Tokens**: XRP, USD, CNY, EUR, TST (Devnet)

### **Backend**
- **API**: Next.js API Routes
- **Storage**:
  - Development: 서버 메모리
  - Production: Vercel KV
- **Real-time**: HTTP 폴링 (3초 주기)

### **Infrastructure**
- **Deployment**: Vercel
- **Version Control**: Git + GitHub
- **Package Manager**: npm

---

## 🚀 **주요 기능**

### 1️⃣ **지갑 관리**
```
✅ 브라우저별 독립 지갑 생성
✅ 시드 구문으로 지갑 복구
✅ 다중 토큰 지원 (XRP + 4종)
✅ 실시간 잔액 조회
```

### 2️⃣ **친구 & 채팅**
```
✅ 전화번호로 친구 추가
✅ 1:1 실시간 채팅
✅ 서버 기반 메시지 동기화
✅ 전송 이벤트 자동 기록
```

### 3️⃣ **자산 전송**
```
✅ XRP 및 토큰 전송
✅ 친구 주소 자동 입력
✅ 트랜잭션 실시간 확인
✅ XRPL Explorer 연동
```

### 4️⃣ **DeFi 기능**
```
✅ 실제 AMM 스왑 (USD/CNY)
✅ Trust Line 설정
✅ Faucet으로 테스트 XRP 충전
✅ 다양한 토큰 페어 지원
```

---

## 📊 **프로젝트 현황**

### **버전 히스토리**
- **v1.0** (2025-09-15): MVP 출시 - 기본 지갑 기능
- **v1.0.1** (2025-09-15): 실제 AMM 풀 연동
- **v1.0.2** (2025-09-16): 서버 채팅 & 멀티 브라우저 지원

### **달성 지표**
- ✅ **100%** 핵심 기능 구현 완료
- ✅ **100%** XRPL Devnet 연동
- ✅ **100%** 실시간 채팅 동기화
- ✅ **100%** 모바일 반응형 지원

---

## 🎮 **시작하기**

### **1. 빠른 시작 (1분)**
```bash
# 저장소 클론
git clone https://github.com/blockbit-hama/xTalk-Wallet.git

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 열기
http://localhost:3000
```

### **2. 첫 사용 가이드**
1. 🎯 지갑 자동 생성 (브라우저별 독립)
2. 💰 Faucet으로 1000 XRP 충전
3. 👥 친구 추가 (전화번호)
4. 💸 친구에게 XRP 전송
5. 💬 채팅으로 확인

---

## 🗺 **로드맵**

### **단기 목표 (v1.1)**
- [ ] WebSocket 실시간 채팅
- [ ] 그룹 채팅 지원
- [ ] NFT 지원 (XRPL NFT)
- [ ] 다국어 지원

### **중기 목표 (v1.2)**
- [ ] 예약 전송 기능
- [ ] DeFi 대시보드
- [ ] 소셜 프로필 시스템
- [ ] 활동 피드

### **장기 목표 (v2.0)**
- [ ] 멀티체인 지원 (Ethereum, Solana)
- [ ] P2P 마켓플레이스
- [ ] AI 거래 어시스턴트
- [ ] 모바일 앱 (iOS/Android)

---

## 👥 **팀 & 기여**

### **개발팀**
- **Project Lead**: BlockBit Team
- **Blockchain Dev**: XRPL Specialist
- **Frontend Dev**: React/Next.js Expert
- **UI/UX Design**: Mobile-First Designer

### **기여 방법**
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📚 **문서**

- 📖 [사용자 튜토리얼](./user-tutorial.md)
- 🔧 [기술 문서](./tech.md)
- 📊 [시스템 흐름도](./system-flow-diagrams.md)
- ✅ [개발 로드맵](./todo.md)
- 🎓 [XRPL 가이드](./xrpl-tutorial.md)

---

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 🙏 **감사의 말**

- **XRPL Foundation**: 블록체인 인프라 제공
- **Vercel**: 호스팅 및 배포 지원
- **Open Source Community**: 오픈소스 라이브러리 기여자들

---

<div align="center">
  <h3>🚀 함께 만들어가는 Web3의 미래</h3>
  <p>
    <a href="https://github.com/blockbit-hama/xTalk-Wallet">GitHub</a> •
    <a href="https://xrpl.org">XRPL</a> •
    <a href="https://vercel.com">Vercel</a>
  </p>
  <br>
  <strong>© 2025 xTalk-Wallet. Building the Social Web3.</strong>
</div>