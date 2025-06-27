# Core Quant 개발 가이드라인

## 프로젝트 개요

Core Quant는 Firebase 기반의 개인용 퀀트 투자 백테스팅 플랫폼입니다.

### 기술 스택
- **프론트엔드:** TypeScript + React + Chakra UI + Zustand
- **백엔드:** Vercel Serverless Functions + Firebase Cloud Functions
- **데이터베이스:** Firebase Firestore
- **데이터 소스:** Yahoo Finance API
- **차트:** Chart.js/Recharts/ECharts
- **보안:** AES-GCM 암호화 (Local Storage)

## 프로젝트 아키텍처

### 폴더 구조 표준
```
src/
├── components/           # UI 컴포넌트
│   ├── auth/            # Firebase 인증 설정 관련
│   ├── dashboard/       # 대시보드 화면
│   ├── search/          # 종목 검색 기능
│   ├── strategy/        # 전략 생성/관리
│   ├── backtest/        # 백테스팅 실행
│   ├── visualization/   # 차트 및 결과 시각화
│   ├── common/          # 공통 UI 컴포넌트
│   └── layout/          # 레이아웃 컴포넌트
├── services/            # 외부 API 연동
│   ├── firebase/        # Firebase 관련 서비스
│   ├── yahoo-finance/   # Yahoo Finance API 연동
│   └── email/           # 이메일 알림 서비스
├── utils/               # 유틸리티 함수
│   ├── backtest/        # 백테스팅 로직
│   ├── crypto/          # 암호화/복호화
│   ├── validators/      # 데이터 검증
│   └── formatters/      # 데이터 포매팅
├── config/              # 설정 파일
├── hooks/               # React 커스텀 훅
├── store/               # Zustand 상태 관리
├── types/               # TypeScript 타입 정의
└── constants/           # 상수 정의
```

### 모듈 분리 원칙
- **한 파일에는 하나의 주요 기능만 정의**
- **외부 의존성이 높은 코드는 services 폴더에 분리**
- **Firebase 관련 설정은 config/firebase.ts에 집중**
- **백테스팅 로직은 utils/backtest에 독립적으로 구현**

## 코딩 표준

### 명명 규칙
- **상수:** `MAX_RETRY_COUNT`, `FIREBASE_CONFIG`
- **Boolean 변수:** `isVisible`, `hasPermission`, `canExecute`
- **컴포넌트:** PascalCase (`StrategyBuilder`, `BacktestChart`)
- **함수/변수:** camelCase (`fetchMarketData`, `userStrategy`)
- **파일명:** kebab-case (`yahoo-finance-service.ts`, `backtest-engine.ts`)

### TypeScript 규칙
- **모든 함수는 반환 타입 명시 필수**
- **인터페이스는 `I` 접두사 사용 금지**
- **타입 정의는 types/ 폴더에 분리**
- **any 타입 사용 금지**

### React 컴포넌트 규칙
- **함수형 컴포넌트만 사용**
- **Props 인터페이스는 컴포넌트명 + Props 형태**
- **useState 대신 Zustand 상태 관리 우선 사용**
- **useEffect 의존성 배열 반드시 명시**

## 보안 구현 표준

### Firebase 인증 정보 처리
```typescript
// ✅ 올바른 방법
import { encryptData, decryptData } from '@/utils/crypto';

const saveFirebaseConfig = async (config: FirebaseConfig) => {
  const encryptedConfig = await encryptData(JSON.stringify(config));
  localStorage.setItem('firebase_config', encryptedConfig);
};

// ❌ 금지된 방법
localStorage.setItem('firebase_config', JSON.stringify(config)); // 평문 저장 금지
```

### 암호화 필수 항목
- **Firebase 인증 정보 (API_KEY, PROJECT_ID 등)**
- **사용자 이메일 주소**
- **전략 설정 데이터 (민감한 경우)**

### API 호출 보안
- **Yahoo Finance API는 반드시 프록시를 통해 호출**
- **클라이언트에서 직접적인 외부 API 호출 금지**
- **API 키는 환경 변수로만 관리**

## UI/UX 구현 표준

### Chakra UI 사용법
```tsx
// ✅ 올바른 방법
import { Box, Button, useColorModeValue } from '@chakra-ui/react';

const StrategyCard = () => {
  const bg = useColorModeValue('white', 'gray.800');
  
  return (
    <Box bg={bg} p={4} borderRadius="md" shadow="sm">
      <Button colorScheme="blue" size="md">
        백테스트 실행
      </Button>
    </Box>
  );
};
```

### 반응형 디자인 필수 적용
- **모든 컴포넌트는 모바일 우선 설계**
- **Chakra UI의 responsive 값 활용**
- **breakpoints: { base, md, lg, xl } 사용**

### 로딩 및 에러 처리
- **모든 비동기 작업에 로딩 상태 표시**
- **에러 발생 시 사용자 친화적 메시지 제공**
- **재시도 기능 포함**

## 백테스팅 엔진 구현 표준

### 데이터 처리 규칙
```typescript
// ✅ 백테스트 데이터 구조
interface BacktestResult {
  strategy: Strategy;
  performance: {
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
  };
  trades: Trade[];
  equity: EquityPoint[];
  createdAt: Date;
}
```

### 성능 최적화 규칙
- **대용량 데이터는 청크 단위로 처리**
- **백테스트 결과는 캐싱 적용**
- **차트 데이터는 필요한 포인트만 렌더링**

### 백테스팅 로직 분리
- **백테스팅 엔진은 utils/backtest에 독립 구현**
- **UI 컴포넌트와 로직 완전 분리**
- **테스트 가능한 순수 함수로 구현**

## Firebase 연동 표준

### Firestore 컬렉션 구조
```
users/{userId}/
├── strategies/          # 사용자 전략
├── backtests/          # 백테스트 결과
├── settings/           # 사용자 설정
└── shared_strategies/  # 공유받은 전략
```

### 보안 규칙 가이드
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase 익명 인증 필수
- **앱 초기화 시 Firebase 익명 인증 실행**
- **사용자별 고유 UID 생성 및 활용**
- **보안 규칙에서 UID 기반 접근 제어**

## Yahoo Finance API 연동 표준

### 프록시 서버 사용
```typescript
// ✅ 올바른 방법 - Vercel Serverless Function 통해 호출
const fetchStockData = async (symbol: string) => {
  const response = await fetch(`/api/yahoo-finance?symbol=${symbol}`);
  return response.json();
};

// ❌ 금지된 방법 - 직접 호출
const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${symbol}`);
```

### 데이터 캐싱 전략
- **일봉 데이터는 24시간 캐싱**
- **실시간 데이터는 1분 캐싱**
- **LocalStorage 또는 IndexedDB 활용**

## 전략 템플릿 관리 표준

### 전략 템플릿 JSON 구조
```typescript
interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'mean_reversion' | 'trend_following' | 'factor_investing';
  conditions: {
    entry: Condition[];
    exit: Condition[];
    stopLoss?: number;
    takeProfit?: number;
  };
  parameters: Record<string, any>;
}
```

### 템플릿 확장 규칙
- **새 템플릿은 constants/strategy-templates.ts에 추가**
- **기존 템플릿 수정 시 버전 관리 필수**
- **템플릿 검증 로직 포함**

## 이메일 알림 구현 표준

### Firebase Cloud Functions 사용
```typescript
// functions/src/index.ts
export const sendDailyReport = functions.pubsub
  .schedule('0 9 * * 1-5')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    // 이메일 발송 로직
  });
```

### 알림 내용 표준
- **전략별 매수/매도 신호**
- **백테스트 결과 요약**
- **포트폴리오 성과 리포트**

## 차트 및 시각화 표준

### 차트 라이브러리 선택
- **기본:** Chart.js (성능 우선)
- **복잡한 금융 차트:** Recharts
- **대용량 데이터:** ECharts

### 차트 최적화 규칙
- **데이터 포인트 5000개 이하로 제한**
- **실시간 업데이트 시 애니메이션 비활성화**
- **메모리 누수 방지를 위한 cleanup 함수 구현**

## 금지 사항

### 보안 관련 금지 사항
- **민감 정보 평문 저장 절대 금지**
- **Firebase 인증 정보 하드코딩 금지**
- **클라이언트에서 직접 외부 API 호출 금지**
- **CORS 우회를 위한 프록시 우회 시도 금지**

### 성능 관련 금지 사항
- **대용량 데이터 일괄 처리 금지**
- **무한 루프 가능성이 있는 백테스팅 로직 금지**
- **메모리 누수 방지를 위한 cleanup 누락 금지**

### 코드 품질 관련 금지 사항
- **any 타입 사용 금지**
- **console.log 프로덕션 배포 금지**
- **하드코딩된 API 엔드포인트 사용 금지**
- **테스트 코드 누락 금지**

## AI 결정 기준

### 우선순위 판단 기준
1. **보안** > 성능 > 기능
2. **사용자 데이터 보호** > 편의성
3. **안정성** > 새로운 기능

### 애매한 상황 대처법
- **보안이 의심되면 더 안전한 방법 선택**
- **성능 문제가 예상되면 최적화 우선 적용**
- **기능 구현이 복잡하면 단계별 분할 구현**

## 필수 체크리스트

### 컴포넌트 구현 시
- [ ] TypeScript 타입 정의 완료
- [ ] 에러 처리 및 로딩 상태 구현
- [ ] 반응형 디자인 적용
- [ ] 접근성(a11y) 고려
- [ ] 메모리 누수 방지 cleanup 구현

### API 연동 시
- [ ] 프록시 서버 사용 확인
- [ ] 에러 처리 및 재시도 로직 구현
- [ ] 데이터 캐싱 전략 적용
- [ ] Rate Limiting 고려

### 보안 구현 시
- [ ] 민감 정보 암호화 확인
- [ ] Firebase 보안 규칙 적용
- [ ] 입력 데이터 검증 구현
- [ ] XSS/CSRF 방어 조치 적용 