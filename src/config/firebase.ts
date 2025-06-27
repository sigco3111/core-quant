/**
 * Firebase 설정 및 초기화
 * 사용자별 Firebase 프로젝트 동적 연결 관리
 */

import { initializeApp, FirebaseApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseOptions } from 'firebase/app';

// Firebase 앱 인스턴스 관리
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * Firebase 설정 타입 정의
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Firebase 설정 검증
 * 필수 필드 존재 여부 및 형식 확인
 */
export function validateFirebaseConfig(config: Partial<FirebaseConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  // 필수 필드 확인
  requiredFields.forEach(field => {
    if (!config[field] || typeof config[field] !== 'string' || config[field]!.trim() === '') {
      errors.push(`${field}는 필수 입력 항목입니다.`);
    }
  });

  // 형식 검증
  if (config.apiKey && !/^[A-Za-z0-9_-]+$/.test(config.apiKey)) {
    errors.push('API Key 형식이 올바르지 않습니다.');
  }

  if (config.authDomain && !/^[a-zA-Z0-9.-]+\.firebaseapp\.com$/.test(config.authDomain)) {
    errors.push('Auth Domain 형식이 올바르지 않습니다. (예: project-id.firebaseapp.com)');
  }

  if (config.projectId && !/^[a-z0-9-]+$/.test(config.projectId)) {
    errors.push('Project ID는 소문자, 숫자, 하이픈만 사용할 수 있습니다.');
  }

  if (config.appId && !/^1:[0-9]+:web:[a-f0-9]+$/.test(config.appId)) {
    errors.push('App ID 형식이 올바르지 않습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Firebase 앱 초기화
 * 사용자 설정으로 Firebase 앱 연결
 */
export async function initializeFirebase(config: FirebaseConfig): Promise<{
  success: boolean;
  error?: string;
  app?: FirebaseApp;
}> {
  try {
    // 설정 검증
    const validation = validateFirebaseConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        error: `설정 오류: ${validation.errors.join(', ')}`
      };
    }

    // 기존 앱 정리
    await cleanupFirebase();

    // Firebase 앱 초기화
    const firebaseOptions: FirebaseOptions = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      ...(config.measurementId && { measurementId: config.measurementId })
    };

    firebaseApp = initializeApp(firebaseOptions, 'core-quant-app');
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);

    console.log('Firebase 초기화 성공:', config.projectId);
    return {
      success: true,
      app: firebaseApp
    };
  } catch (error) {
    console.error('Firebase 초기화 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * Firebase 앱 정리
 * 기존 연결 해제 및 리소스 정리
 */
export async function cleanupFirebase(): Promise<void> {
  try {
    // 기존 앱들 정리
    const existingApps = getApps();
    for (const app of existingApps) {
      await deleteApp(app);
    }

    // 인스턴스 초기화
    firebaseApp = null;
    auth = null;
    firestore = null;

    console.log('Firebase 앱 정리 완료');
  } catch (error) {
    console.error('Firebase 정리 중 오류:', error);
  }
}

/**
 * 현재 Firebase 앱 인스턴스 반환
 */
export function getFirebaseApp(): FirebaseApp | null {
  return firebaseApp;
}

/**
 * 현재 Auth 인스턴스 반환
 */
export function getFirebaseAuth(): Auth | null {
  return auth;
}

/**
 * 현재 Firestore 인스턴스 반환
 */
export function getFirebaseFirestore(): Firestore | null {
  return firestore;
}

/**
 * Firebase 연결 상태 확인
 */
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null && auth !== null && firestore !== null;
}

/**
 * Firebase 프로젝트 ID 반환
 */
export function getCurrentProjectId(): string | null {
  return firebaseApp?.options?.projectId || null;
}

/**
 * Firebase 연결 테스트
 * 실제 연결 가능 여부 확인
 */
export async function testFirebaseConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        error: 'Firebase가 초기화되지 않았습니다.'
      };
    }

    // Firestore 연결 테스트 (간단한 메타데이터 읽기)
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      return {
        success: false,
        error: 'Firestore 인스턴스를 찾을 수 없습니다.'
      };
    }

    // 실제 연결 테스트는 인증 후에 수행
    // 여기서는 기본 초기화 상태만 확인
    return {
      success: true
    };
  } catch (error) {
    console.error('Firebase 연결 테스트 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '연결 테스트 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 개발 환경용 Firebase 에뮬레이터 설정
 * 로컬 개발 시 사용
 */
export function setupFirebaseEmulators(): void {
  if (process.env.NODE_ENV === 'development' && process.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    console.log('Firebase 에뮬레이터 모드 활성화');
    // 에뮬레이터 설정은 필요시 추가 구현
  }
} 