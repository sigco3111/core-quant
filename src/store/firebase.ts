/**
 * Firebase 상태 관리 스토어
 * Firebase 연결 상태, 인증 상태, 설정 정보 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '../services/firebase/auth';

/**
 * Firebase 연결 상태 타입
 */
export type FirebaseConnectionStatus = 
  | 'disconnected'    // 연결되지 않음
  | 'connecting'      // 연결 시도 중
  | 'connected'       // 연결됨
  | 'error';          // 연결 오류

/**
 * 암호화된 Firebase 설정 타입
 */
export interface EncryptedFirebaseConfig {
  encryptedData: string;
  salt: string;
  iv: string;
  projectId: string; // 표시용 (암호화되지 않음)
  lastModified: number;
}

/**
 * Firebase 스토어 상태 타입
 */
export interface FirebaseStore {
  // 연결 상태
  connectionStatus: FirebaseConnectionStatus;
  connectionError: string | null;
  lastConnectedAt: number | null;
  
  // 암호화된 설정
  encryptedConfig: EncryptedFirebaseConfig | null;
  isConfigSaved: boolean;
  
  // 인증 상태
  authState: AuthState;
  
  // 액션들
  setConnectionStatus: (status: FirebaseConnectionStatus, error?: string) => void;
  setEncryptedConfig: (config: EncryptedFirebaseConfig) => void;
  clearEncryptedConfig: () => void;
  updateAuthState: (authState: AuthState) => void;
  setConnectionError: (error: string | null) => void;
  markAsConnected: () => void;
  reset: () => void;
}

/**
 * 초기 상태
 */
const initialState = {
  connectionStatus: 'disconnected' as FirebaseConnectionStatus,
  connectionError: null,
  lastConnectedAt: null,
  encryptedConfig: null,
  isConfigSaved: false,
  authState: {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  } as AuthState
};

/**
 * Firebase 상태 관리 스토어
 * 암호화된 설정은 localStorage에 영구 저장
 */
export const useFirebaseStore = create<FirebaseStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      /**
       * 연결 상태 업데이트
       */
             setConnectionStatus: (status: FirebaseConnectionStatus, error?: string) => {
         set(() => ({
           connectionStatus: status,
           connectionError: error || null,
           // 연결 성공 시 타임스탬프 기록
           ...(status === 'connected' && { lastConnectedAt: Date.now() })
         }));
       },
      
      /**
       * 암호화된 Firebase 설정 저장
       */
      setEncryptedConfig: (config: EncryptedFirebaseConfig) => {
        set({
          encryptedConfig: config,
          isConfigSaved: true
        });
        console.log('암호화된 Firebase 설정 저장 완료:', config.projectId);
      },
      
      /**
       * 암호화된 설정 삭제
       */
      clearEncryptedConfig: () => {
        set({
          encryptedConfig: null,
          isConfigSaved: false,
          connectionStatus: 'disconnected',
          connectionError: null,
          lastConnectedAt: null
        });
        console.log('Firebase 설정 삭제 완료');
      },
      
      /**
       * 인증 상태 업데이트
       */
      updateAuthState: (authState: AuthState) => {
        set({ authState });
      },
      
      /**
       * 연결 오류 설정
       */
      setConnectionError: (error: string | null) => {
        set({ 
          connectionError: error,
          connectionStatus: error ? 'error' : get().connectionStatus
        });
      },
      
      /**
       * 연결 성공 표시
       */
      markAsConnected: () => {
        set({
          connectionStatus: 'connected',
          connectionError: null,
          lastConnectedAt: Date.now()
        });
      },
      
      /**
       * 상태 초기화
       */
      reset: () => {
        set(initialState);
        console.log('Firebase 스토어 초기화 완료');
      }
    }),
    {
      name: 'core-quant-firebase', // localStorage 키
      partialize: (state) => ({
        // 암호화된 설정만 영구 저장
        encryptedConfig: state.encryptedConfig,
        isConfigSaved: state.isConfigSaved,
        lastConnectedAt: state.lastConnectedAt
      })
    }
  )
);

/**
 * Firebase 설정 존재 여부 확인
 */
export function hasFirebaseConfig(): boolean {
  const state = useFirebaseStore.getState();
  return state.isConfigSaved && state.encryptedConfig !== null;
}

/**
 * Firebase 연결 상태 확인
 */
export function isFirebaseConnected(): boolean {
  const state = useFirebaseStore.getState();
  return state.connectionStatus === 'connected';
}

/**
 * 인증 상태 확인
 */
export function isUserAuthenticated(): boolean {
  const state = useFirebaseStore.getState();
  return state.authState.isAuthenticated;
}

/**
 * 현재 프로젝트 ID 반환
 */
export function getCurrentProjectId(): string | null {
  const state = useFirebaseStore.getState();
  return state.encryptedConfig?.projectId || null;
}

/**
 * 마지막 연결 시간 반환
 */
export function getLastConnectedTime(): Date | null {
  const state = useFirebaseStore.getState();
  return state.lastConnectedAt ? new Date(state.lastConnectedAt) : null;
}

/**
 * 연결 상태 메시지 반환
 */
export function getConnectionStatusMessage(): string {
  const state = useFirebaseStore.getState();
  
  switch (state.connectionStatus) {
    case 'disconnected':
      return 'Firebase에 연결되지 않음';
    case 'connecting':
      return 'Firebase에 연결 중...';
    case 'connected':
      const projectId = getCurrentProjectId();
      return `Firebase 연결됨${projectId ? ` (${projectId})` : ''}`;
    case 'error':
      return `연결 오류: ${state.connectionError || '알 수 없는 오류'}`;
    default:
      return '알 수 없는 상태';
  }
}

/**
 * 설정 유효성 검사
 */
export function validateStoredConfig(): boolean {
  const state = useFirebaseStore.getState();
  
  if (!state.encryptedConfig) {
    return false;
  }
  
  const config = state.encryptedConfig;
  
  // 필수 필드 확인
  return !!(
    config.encryptedData &&
    config.salt &&
    config.iv &&
    config.projectId &&
    config.lastModified
  );
}

/**
 * 스토어 상태 디버그 정보 반환
 */
export function getDebugInfo(): object {
  const state = useFirebaseStore.getState();
  
  return {
    connectionStatus: state.connectionStatus,
    hasConfig: !!state.encryptedConfig,
    projectId: state.encryptedConfig?.projectId,
    isAuthenticated: state.authState.isAuthenticated,
    userId: state.authState.user?.uid,
    lastConnected: state.lastConnectedAt ? new Date(state.lastConnectedAt).toISOString() : null,
    error: state.connectionError
  };
} 