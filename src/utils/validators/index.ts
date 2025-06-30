/**
 * 입력 데이터 검증 유틸리티
 * 사용자 입력값의 유효성을 검증하는 함수들 모음
 */

/**
 * 이메일 유효성 검증
 * RFC 5322 표준에 맞는 이메일 형식 확인
 */
export function validateEmail(email: string): { isValid: boolean; message: string } {
  if (!email || email.trim() === '') {
    return { isValid: false, message: '이메일을 입력해주세요.' };
  }

  // RFC 5322 표준에 맞는 이메일 형식 검증을 위한 정규표현식
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '유효한 이메일 형식이 아닙니다.' };
  }

  return { isValid: true, message: '유효한 이메일입니다.' };
}

/**
 * Firebase API Key 유효성 검증
 * Firebase API Key 형식 확인
 */
export function validateApiKey(apiKey: string): { isValid: boolean; message: string } {
  if (!apiKey || apiKey.trim() === '') {
    return { isValid: false, message: 'API Key를 입력해주세요.' };
  }

  // Firebase API Key는 알파벳, 숫자, 특수문자(-_)로 구성
  const apiKeyRegex = /^[A-Za-z0-9_-]+$/;
  
  if (!apiKeyRegex.test(apiKey)) {
    return { isValid: false, message: 'API Key 형식이 올바르지 않습니다.' };
  }

  return { isValid: true, message: '유효한 API Key 형식입니다.' };
}

/**
 * Firebase Project ID 유효성 검증
 * Firebase 프로젝트 ID 형식 확인
 */
export function validateProjectId(projectId: string): { isValid: boolean; message: string } {
  if (!projectId || projectId.trim() === '') {
    return { isValid: false, message: 'Project ID를 입력해주세요.' };
  }

  // Firebase 프로젝트 ID는 소문자, 숫자, 하이픈으로 구성
  const projectIdRegex = /^[a-z0-9-]+$/;
  
  if (!projectIdRegex.test(projectId)) {
    return { isValid: false, message: 'Project ID는 소문자, 숫자, 하이픈만 사용할 수 있습니다.' };
  }

  return { isValid: true, message: '유효한 Project ID 형식입니다.' };
}

/**
 * Firebase Auth Domain 유효성 검증
 */
export function validateAuthDomain(authDomain: string): { isValid: boolean; message: string } {
  if (!authDomain || authDomain.trim() === '') {
    return { isValid: false, message: 'Auth Domain을 입력해주세요.' };
  }

  // Firebase Auth Domain은 일반적으로 projectId.firebaseapp.com 형식
  const authDomainRegex = /^[a-zA-Z0-9.-]+\.firebaseapp\.com$/;
  
  if (!authDomainRegex.test(authDomain)) {
    return { isValid: false, message: 'Auth Domain 형식이 올바르지 않습니다. (예: project-id.firebaseapp.com)' };
  }

  return { isValid: true, message: '유효한 Auth Domain 형식입니다.' };
}

/**
 * Firebase Storage Bucket 유효성 검증
 */
export function validateStorageBucket(storageBucket: string): { isValid: boolean; message: string } {
  if (!storageBucket || storageBucket.trim() === '') {
    return { isValid: false, message: 'Storage Bucket을 입력해주세요.' };
  }

  // Firebase Storage Bucket은 projectId.appspot.com 또는 projectId.firebasestorage.app 형식
  const bucketRegex = /^[a-zA-Z0-9.-]+\.(appspot\.com|firebasestorage\.app)$/;
  
  if (!bucketRegex.test(storageBucket)) {
    return { isValid: false, message: 'Storage Bucket 형식이 올바르지 않습니다. (예: project-id.appspot.com 또는 project-id.firebasestorage.app)' };
  }

  return { isValid: true, message: '유효한 Storage Bucket 형식입니다.' };
}

/**
 * Firebase Messaging Sender ID 유효성 검증
 */
export function validateMessagingSenderId(senderId: string): { isValid: boolean; message: string } {
  if (!senderId || senderId.trim() === '') {
    return { isValid: false, message: 'Messaging Sender ID를 입력해주세요.' };
  }

  // Messaging Sender ID는 숫자로만 구성됨
  const senderIdRegex = /^\d+$/;
  
  if (!senderIdRegex.test(senderId)) {
    return { isValid: false, message: 'Messaging Sender ID는 숫자만 포함해야 합니다.' };
  }

  return { isValid: true, message: '유효한 Messaging Sender ID 형식입니다.' };
}

/**
 * Firebase App ID 유효성 검증
 */
export function validateAppId(appId: string): { isValid: boolean; message: string } {
  if (!appId || appId.trim() === '') {
    return { isValid: false, message: 'App ID를 입력해주세요.' };
  }

  // Firebase App ID는 일반적으로 1:숫자:web:해시 형식
  const appIdRegex = /^1:[0-9]+:web:[a-f0-9]+$/;
  
  if (!appIdRegex.test(appId)) {
    return { isValid: false, message: 'App ID 형식이 올바르지 않습니다. (예: 1:12345:web:abc123)' };
  }

  return { isValid: true, message: '유효한 App ID 형식입니다.' };
}

/**
 * 패스워드 유효성 검증
 */
export function validatePassword(password: string): { isValid: boolean; message: string; strength?: 'weak' | 'medium' | 'strong' } {
  if (!password || password.trim() === '') {
    return { isValid: false, message: '패스워드를 입력해주세요.' };
  }

  // 최소 길이 확인
  if (password.length < 8) {
    return { 
      isValid: false, 
      message: '패스워드는 최소 8자 이상이어야 합니다.',
      strength: 'weak'
    };
  }

  // 복잡성 확인
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const complexityCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (complexityCount < 2) {
    return {
      isValid: false,
      message: '패스워드는 영문 대소문자, 숫자, 특수문자 중 최소 2가지를 포함해야 합니다.',
      strength: 'weak'
    };
  }

  if (complexityCount === 2) {
    return {
      isValid: true,
      message: '적정 수준의 패스워드입니다. 더 높은 보안을 위해 다양한 문자를 사용하세요.',
      strength: 'medium'
    };
  }

  return {
    isValid: true,
    message: '안전한 패스워드입니다.',
    strength: 'strong'
  };
}

/**
 * 입력값이 빈 값인지 확인
 */
export function isEmpty(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === '';
} 