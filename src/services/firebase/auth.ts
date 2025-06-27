/**
 * Firebase 인증 서비스
 * 익명 인증 및 사용자 세션 관리
 */

import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User,
  signOut as firebaseSignOut,
  AuthError
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseInitialized } from '../../config/firebase';

/**
 * 인증 상태 타입 정의
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * 인증 상태 변경 콜백 타입
 */
export type AuthStateCallback = (authState: AuthState) => void;

// 인증 상태 관리
let currentAuthState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null
};

// 인증 상태 변경 리스너들
const authStateListeners: AuthStateCallback[] = [];

/**
 * 인증 상태 변경 리스너 등록
 */
export function onAuthStateChange(callback: AuthStateCallback): () => void {
  authStateListeners.push(callback);
  
  // 현재 상태 즉시 전달
  callback(currentAuthState);
  
  // 리스너 해제 함수 반환
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
}

/**
 * 인증 상태 업데이트 및 리스너들에게 알림
 */
function updateAuthState(newState: Partial<AuthState>): void {
  currentAuthState = { ...currentAuthState, ...newState };
  authStateListeners.forEach(listener => listener(currentAuthState));
}

/**
 * Firebase 인증 상태 변경 모니터링 시작
 */
export function startAuthStateMonitoring(): () => void {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    console.error('Firebase Auth가 초기화되지 않았습니다.');
    updateAuthState({
      isLoading: false,
      error: 'Firebase Auth가 초기화되지 않았습니다.'
    });
    return () => {};
  }

  // Firebase 인증 상태 변경 리스너 등록
  const unsubscribe = onAuthStateChanged(
    auth,
    (user) => {
      console.log('인증 상태 변경:', user ? `사용자 ID: ${user.uid}` : '로그아웃');
      
      updateAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error: null
      });
    },
    (error) => {
      console.error('인증 상태 모니터링 오류:', error);
      updateAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error.message
      });
    }
  );

  return unsubscribe;
}

/**
 * 익명 로그인
 * Firebase 익명 인증을 통한 사용자 세션 생성
 */
export async function signInAnonymous(): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        error: 'Firebase가 초기화되지 않았습니다. 먼저 Firebase 설정을 완료해주세요.'
      };
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        success: false,
        error: 'Firebase Auth 인스턴스를 찾을 수 없습니다.'
      };
    }

    updateAuthState({ isLoading: true, error: null });

    // 익명 로그인 실행
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    console.log('익명 로그인 성공:', user.uid);
    
    // 상태는 onAuthStateChanged에서 자동 업데이트됨
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('익명 로그인 실패:', error);
    
    const authError = error as AuthError;
    let errorMessage = '익명 로그인 중 오류가 발생했습니다.';
    
    // Firebase Auth 오류 코드별 메시지 처리
    switch (authError.code) {
      case 'auth/operation-not-allowed':
        errorMessage = '익명 인증이 비활성화되어 있습니다. Firebase 콘솔에서 익명 인증을 활성화해주세요.';
        break;
      case 'auth/network-request-failed':
        errorMessage = '네트워크 연결을 확인해주세요.';
        break;
      case 'auth/too-many-requests':
        errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
        break;
      default:
        errorMessage = authError.message || errorMessage;
    }

    updateAuthState({
      isLoading: false,
      error: errorMessage
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 로그아웃
 * 현재 사용자 세션 종료
 */
export async function signOut(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        success: false,
        error: 'Firebase Auth 인스턴스를 찾을 수 없습니다.'
      };
    }

    await firebaseSignOut(auth);
    console.log('로그아웃 성공');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('로그아웃 실패:', error);
    
    const errorMessage = error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.';
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 현재 인증 상태 반환
 */
export function getCurrentAuthState(): AuthState {
  return { ...currentAuthState };
}

/**
 * 현재 사용자 정보 반환
 */
export function getCurrentUser(): User | null {
  return currentAuthState.user;
}

/**
 * 인증 여부 확인
 */
export function isAuthenticated(): boolean {
  return currentAuthState.isAuthenticated;
}

/**
 * 사용자 ID 반환
 */
export function getCurrentUserId(): string | null {
  return currentAuthState.user?.uid || null;
}

/**
 * 인증 토큰 반환
 * API 호출 시 사용
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = getCurrentUser();
    if (!user) {
      return null;
    }

    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('인증 토큰 획득 실패:', error);
    return null;
  }
}

/**
 * 인증 토큰 갱신
 * 만료된 토큰 갱신
 */
export async function refreshAuthToken(): Promise<string | null> {
  try {
    const user = getCurrentUser();
    if (!user) {
      return null;
    }

    const token = await user.getIdToken(true); // 강제 갱신
    return token;
  } catch (error) {
    console.error('인증 토큰 갱신 실패:', error);
    return null;
  }
}

/**
 * 인증 상태 초기화
 * Firebase 재연결 시 사용
 */
export function resetAuthState(): void {
  updateAuthState({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });
}

/**
 * 인증 서비스 초기화
 * 앱 시작 시 호출
 */
export function initializeAuthService(): () => void {
  console.log('Firebase 인증 서비스 초기화');
  
  // 인증 상태 모니터링 시작
  const unsubscribe = startAuthStateMonitoring();
  
  return () => {
    console.log('Firebase 인증 서비스 정리');
    unsubscribe();
  };
} 