# Core Quant

Firebase 기반 퀀트 투자 백테스팅 플랫폼

## 🚀 프로젝트 개요

Core Quant는 사용자가 직접 구성하는 Firebase 데이터베이스와 Yahoo Finance 데이터를 활용하여, 개인 투자자들이 다양한 퀀트 투자 전략을 손쉽게 백테스트하고 그 결과를 직관적으로 시각화할 수 있는 웹 기반 통합 금융 기술 플랫폼입니다.

## 🛡️ 주요 특징

- **개인 데이터 소유권 보장**: 사용자가 직접 Firebase DB를 구성하여 모든 데이터를 직접 관리
- **코딩 없는 퀀트 투자**: 직관적인 UI를 통해 누구나 쉽게 퀀트 전략 구축
- **강력한 백테스팅**: Yahoo Finance 데이터 기반 과거 성과 검증
- **다양한 전략 템플릿**: 평균 회귀, 추세 추종, 팩터 투자 등 검증된 전략 제공
- **전략 공유**: 파일 내보내기/가져오기 및 공유 링크 기능
- **종목 추천 및 알림**: 전략 기반 종목 추천 및 이메일 알림

## 🔧 기술 스택

### 프론트엔드
- **TypeScript** + **React 18**
- **Chakra UI** - UI 컴포넌트 라이브러리
- **Zustand** - 상태 관리
- **React Router** - 라우팅
- **Chart.js/Recharts** - 데이터 시각화

### 백엔드
- **Vercel Serverless Functions** - Yahoo Finance API 프록시
- **Firebase Cloud Functions** - 이메일 알림, 종목 추천
- **Firebase Firestore** - 사용자 데이터 저장

### 보안
- **AES-GCM 암호화** - Firebase 인증 정보 보호
- **Local Storage** 암호화 저장

## 📁 프로젝트 구조

```
src/
├── components/           # UI 컴포넌트
│   ├── auth/            # Firebase 인증 설정
│   ├── dashboard/       # 대시보드
│   ├── search/          # 종목 검색
│   ├── strategy/        # 전략 관리
│   ├── backtest/        # 백테스팅
│   ├── visualization/   # 결과 시각화
│   ├── common/          # 공통 컴포넌트
│   └── layout/          # 레이아웃
├── services/            # 외부 API 연동
│   ├── firebase/        # Firebase 서비스
│   ├── yahoo-finance/   # Yahoo Finance API
│   └── email/           # 이메일 서비스
├── utils/               # 유틸리티 함수
│   ├── backtest/        # 백테스팅 로직
│   ├── crypto/          # 암호화/복호화
│   ├── validators/      # 데이터 검증
│   └── formatters/      # 데이터 포매팅
├── config/              # 설정 파일
├── hooks/               # React 커스텀 훅
├── store/               # Zustand 상태 관리
├── types/               # TypeScript 타입
└── constants/           # 상수 정의
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

애플리케이션이 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 3. 빌드

```bash
npm run build
```

### 4. 미리보기

```bash
npm run preview
```

## 📋 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드된 앱 미리보기
- `npm run lint` - ESLint 검사
- `npm run lint:fix` - ESLint 오류 자동 수정
- `npm run format` - Prettier 코드 포매팅

## 🔒 보안 가이드

### Firebase 설정 보안
- Firebase 인증 정보는 AES-GCM으로 암호화되어 Local Storage에 저장
- 사용자별 Firebase 프로젝트 독립 구성
- Firestore 보안 규칙을 통한 사용자별 데이터 격리

### API 보안
- Yahoo Finance API는 Vercel Serverless Functions를 통해서만 호출
- 클라이언트 직접 호출 금지
- Rate Limiting 및 CORS 보안 적용

## 📖 개발 가이드

프로젝트 개발 시 다음 가이드라인을 준수해 주세요:

- [shrimp-rules.md](./shrimp-rules.md) - 개발 표준 및 아키텍처 가이드
- [PRD.md](./PRD.md) - 제품 요구사항 문서

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 [Issues](https://github.com/core-quant/core-quant/issues)를 통해 문의해 주세요.

---

**Core Quant Team** 🚀 