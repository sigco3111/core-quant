/**
 * AES-GCM 암호화/복호화 유틸리티
 * Firebase 인증 정보 보안 저장을 위한 암호화 기능 제공
 */

// 암호화 설정 상수
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // GCM 모드에서 권장되는 IV 길이 (96비트)

/**
 * 암호화 키 생성
 * 사용자 입력 패스워드를 기반으로 PBKDF2를 사용하여 안전한 키 생성
 */
export async function generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  try {
    // 패스워드를 UTF-8로 인코딩
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // PBKDF2를 사용하여 키 생성을 위한 기본 키 가져오기
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // PBKDF2로 실제 암호화 키 파생
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // 보안을 위한 충분한 반복 횟수
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: ALGORITHM,
        length: KEY_LENGTH
      },
      false, // 키 추출 불가능하게 설정
      ['encrypt', 'decrypt']
    );

    return key;
  } catch (error) {
    console.error('키 생성 중 오류 발생:', error);
    throw new Error('암호화 키 생성에 실패했습니다.');
  }
}

/**
 * 랜덤 바이트 생성
 * Salt 및 IV 생성용
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * 데이터 암호화
 * AES-GCM을 사용하여 데이터를 안전하게 암호화
 */
export async function encryptData(
  data: string,
  password: string
): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
}> {
  try {
    // Salt와 IV 생성
    const salt = generateRandomBytes(16); // 128비트 salt
    const iv = generateRandomBytes(IV_LENGTH); // 96비트 IV

    // 암호화 키 생성
    const key = await generateKey(password, salt);

    // 데이터를 UTF-8로 인코딩
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // AES-GCM으로 암호화
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      dataBuffer
    );

    // 결과를 Base64로 인코딩하여 반환
    return {
      encryptedData: arrayBufferToBase64(encryptedBuffer),
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv)
    };
  } catch (error) {
    console.error('데이터 암호화 중 오류 발생:', error);
    throw new Error('데이터 암호화에 실패했습니다.');
  }
}

/**
 * 데이터 복호화
 * 암호화된 데이터를 원본으로 복원
 */
export async function decryptData(
  encryptedData: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  try {
    // Base64 디코딩
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);
    const saltBuffer = base64ToArrayBuffer(salt);
    const ivBuffer = base64ToArrayBuffer(iv);

    // 암호화 키 재생성
    const key = await generateKey(password, new Uint8Array(saltBuffer));

    // AES-GCM으로 복호화
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: new Uint8Array(ivBuffer)
      },
      key,
      encryptedBuffer
    );

    // UTF-8로 디코딩하여 문자열로 변환
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('데이터 복호화 중 오류 발생:', error);
    throw new Error('데이터 복호화에 실패했습니다. 패스워드를 확인해주세요.');
  }
}

/**
 * ArrayBuffer를 Base64 문자열로 변환
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 문자열을 ArrayBuffer로 변환
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 암호화된 Firebase 설정 검증
 * 저장된 암호화 데이터의 무결성 확인
 */
export function validateEncryptedConfig(config: {
  encryptedData: string;
  salt: string;
  iv: string;
}): boolean {
  try {
    // 필수 필드 존재 확인
    if (!config.encryptedData || !config.salt || !config.iv) {
      return false;
    }

    // Base64 형식 검증
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return (
      base64Regex.test(config.encryptedData) &&
      base64Regex.test(config.salt) &&
      base64Regex.test(config.iv)
    );
  } catch (error) {
    console.error('암호화 설정 검증 중 오류:', error);
    return false;
  }
}

/**
 * 패스워드 강도 검증
 * Firebase 설정 보호를 위한 최소 보안 요구사항 확인
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
} {
  // 최소 길이 확인
  if (password.length < 8) {
    return {
      isValid: false,
      message: '패스워드는 최소 8자 이상이어야 합니다.'
    };
  }

  // 복잡성 확인 (영문 대소문자, 숫자, 특수문자 중 최소 3가지 포함)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const complexityCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (complexityCount < 3) {
    return {
      isValid: false,
      message: '패스워드는 영문 대소문자, 숫자, 특수문자 중 최소 3가지를 포함해야 합니다.'
    };
  }

  return {
    isValid: true,
    message: '안전한 패스워드입니다.'
  };
} 