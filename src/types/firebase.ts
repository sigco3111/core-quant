/**
 * Firebase 관련 TypeScript 타입 정의
 */

import { User } from 'firebase/auth';

/**
 * Firebase 초기화 결과
 */
export interface FirebaseInitResult {
  success: boolean;
  error?: string;
  projectId?: string;
}

/**
 * Firebase 연결 테스트 결과
 */
export interface FirebaseConnectionTestResult {
  success: boolean;
  error?: string;
  latency?: number;
}

/**
 * 암호화 작업 결과
 */
export interface EncryptionResult {
  encryptedData: string;
  salt: string;
  iv: string;
}

/**
 * 복호화 작업 결과
 */
export interface DecryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * 패스워드 검증 결과
 */
export interface PasswordValidationResult {
  isValid: boolean;
  message: string;
  strength?: 'weak' | 'medium' | 'strong';
}

/**
 * Firebase 설정 검증 결과
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Firebase 사용자 정보 (확장)
 */
export interface CoreQuantUser extends User {
  // 필요시 추가 프로퍼티 정의
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

/**
 * 사용자 설정
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  notifications: {
    email: boolean;
    browser: boolean;
  };
  defaultCurrency: string;
  timezone: string;
}

/**
 * Firebase 서비스 상태
 */
export interface FirebaseServiceStatus {
  auth: 'available' | 'unavailable' | 'error';
  firestore: 'available' | 'unavailable' | 'error';
  functions: 'available' | 'unavailable' | 'error';
}

/**
 * 오류 타입 정의
 */
export type FirebaseErrorCode = 
  | 'auth/invalid-api-key'
  | 'auth/network-request-failed'
  | 'auth/operation-not-allowed'
  | 'auth/too-many-requests'
  | 'auth/user-disabled'
  | 'firestore/permission-denied'
  | 'firestore/unavailable'
  | 'functions/not-found'
  | 'functions/deadline-exceeded'
  | 'config/invalid-format'
  | 'config/missing-required-field'
  | 'crypto/encryption-failed'
  | 'crypto/decryption-failed'
  | 'crypto/invalid-password';

/**
 * Firebase 오류 정보
 */
export interface FirebaseError {
  code: FirebaseErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * 연결 상태 변경 이벤트
 */
export interface ConnectionStatusChangeEvent {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  previousStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  timestamp: Date;
  error?: string;
}

/**
 * 인증 상태 변경 이벤트
 */
export interface AuthStatusChangeEvent {
  user: User | null;
  isAuthenticated: boolean;
  timestamp: Date;
  method?: 'anonymous' | 'email' | 'google';
}

/**
 * Firebase 설정 변경 이벤트
 */
export interface ConfigChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  projectId: string;
  timestamp: Date;
}

/**
 * 이벤트 리스너 타입
 */
export type ConnectionStatusListener = (event: ConnectionStatusChangeEvent) => void;
export type AuthStatusListener = (event: AuthStatusChangeEvent) => void;
export type ConfigChangeListener = (event: ConfigChangeEvent) => void;

/**
 * Firebase 서비스 초기화 옵션
 */
export interface FirebaseServiceOptions {
  enableAuth: boolean;
  enableFirestore: boolean;
  enableFunctions: boolean;
  enableAnalytics: boolean;
  enableEmulator: boolean;
  emulatorConfig?: {
    authPort: number;
    firestorePort: number;
    functionsPort: number;
  };
}

/**
 * 보안 설정
 */
export interface SecuritySettings {
  encryptionEnabled: boolean;
  passwordMinLength: number;
  passwordRequireComplexity: boolean;
  sessionTimeout: number; // 분 단위
  maxLoginAttempts: number;
  lockoutDuration: number; // 분 단위
}

/**
 * 성능 모니터링 데이터
 */
export interface PerformanceMetrics {
  connectionLatency: number;
  authLatency: number;
  firestoreReadLatency: number;
  firestoreWriteLatency: number;
  lastMeasured: Date;
}

/**
 * Firebase 설정 내보내기 형식
 */
export interface ExportedFirebaseConfig {
  version: string;
  projectId: string;
  exportedAt: Date;
  encryptedConfig: string;
  checksum: string;
}

/**
 * Firebase 설정 가져오기 결과
 */
export interface ImportConfigResult {
  success: boolean;
  projectId?: string;
  error?: string;
  warnings?: string[];
} 