/**
 * 암호화 기능 테스트
 * 개발 환경에서 암호화/복호화 기능 검증용
 */

import { 
  encryptData, 
  decryptData, 
  validatePasswordStrength,
  validateEncryptedConfig 
} from './index';

/**
 * 암호화/복호화 기본 테스트
 */
export async function testBasicEncryption(): Promise<boolean> {
  try {
    console.log('🔐 암호화 기본 테스트 시작...');
    
    const testData = 'Hello, Core Quant!';
    const password = 'TestPassword123!';
    
    // 암호화
    const encrypted = await encryptData(testData, password);
    console.log('✅ 암호화 성공:', {
      dataLength: encrypted.encryptedData.length,
      saltLength: encrypted.salt.length,
      ivLength: encrypted.iv.length
    });
    
    // 복호화
    const decrypted = await decryptData(
      encrypted.encryptedData,
      encrypted.salt,
      encrypted.iv,
      password
    );
    
    const isSuccess = decrypted === testData;
    console.log('✅ 복호화 결과:', isSuccess ? '성공' : '실패');
    console.log('원본:', testData);
    console.log('복호화:', decrypted);
    
    return isSuccess;
  } catch (error) {
    console.error('❌ 암호화 테스트 실패:', error);
    return false;
  }
}

/**
 * 패스워드 강도 검증 테스트
 */
export function testPasswordValidation(): boolean {
  try {
    console.log('🔒 패스워드 검증 테스트 시작...');
    
    const testCases = [
      { password: '123', expected: false },
      { password: 'password', expected: false },
      { password: 'Password1', expected: false },
      { password: 'Password123!', expected: true },
      { password: 'MySecure123!', expected: true }
    ];
    
    let allPassed = true;
    
    testCases.forEach(({ password, expected }, index) => {
      const result = validatePasswordStrength(password);
      const passed = result.isValid === expected;
      
      console.log(`테스트 ${index + 1}: ${passed ? '✅' : '❌'} "${password}" - ${result.message}`);
      
      if (!passed) {
        allPassed = false;
      }
    });
    
    return allPassed;
  } catch (error) {
    console.error('❌ 패스워드 검증 테스트 실패:', error);
    return false;
  }
}

/**
 * 암호화 설정 검증 테스트
 */
export function testConfigValidation(): boolean {
  try {
    console.log('⚙️ 설정 검증 테스트 시작...');
    
    const validConfig = {
      encryptedData: 'dGVzdA==', // base64 encoded "test"
      salt: 'c2FsdA==', // base64 encoded "salt"
      iv: 'aXY='  // base64 encoded "iv"
    };
    
    const invalidConfig = {
      encryptedData: '',
      salt: 'invalid-base64!',
      iv: 'aXY='
    };
    
    const validResult = validateEncryptedConfig(validConfig);
    const invalidResult = validateEncryptedConfig(invalidConfig);
    
    console.log('✅ 유효한 설정 검증:', validResult ? '통과' : '실패');
    console.log('✅ 무효한 설정 검증:', !invalidResult ? '통과' : '실패');
    
    return validResult && !invalidResult;
  } catch (error) {
    console.error('❌ 설정 검증 테스트 실패:', error);
    return false;
  }
}

/**
 * Firebase 설정 암호화 시뮬레이션 테스트
 */
export async function testFirebaseConfigEncryption(): Promise<boolean> {
  try {
    console.log('🔥 Firebase 설정 암호화 테스트 시작...');
    
    const mockFirebaseConfig = {
      apiKey: 'AIzaSyExample123456789',
      authDomain: 'test-project.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef123456'
    };
    
    const password = 'MyFirebasePassword123!';
    const configJson = JSON.stringify(mockFirebaseConfig);
    
    // 암호화
    const encrypted = await encryptData(configJson, password);
    console.log('✅ Firebase 설정 암호화 성공');
    
    // 복호화
    const decrypted = await decryptData(
      encrypted.encryptedData,
      encrypted.salt,
      encrypted.iv,
      password
    );
    
    const decryptedConfig = JSON.parse(decrypted);
    const isMatch = JSON.stringify(decryptedConfig) === configJson;
    
    console.log('✅ Firebase 설정 복호화:', isMatch ? '성공' : '실패');
    console.log('프로젝트 ID:', decryptedConfig.projectId);
    
    return isMatch;
  } catch (error) {
    console.error('❌ Firebase 설정 암호화 테스트 실패:', error);
    return false;
  }
}

/**
 * 전체 테스트 실행
 */
export async function runAllCryptoTests(): Promise<boolean> {
  console.log('🚀 암호화 유틸리티 전체 테스트 시작\n');
  
  const results = await Promise.all([
    testBasicEncryption(),
    Promise.resolve(testPasswordValidation()),
    Promise.resolve(testConfigValidation()),
    testFirebaseConfigEncryption()
  ]);
  
  const allPassed = results.every(result => result);
  
  console.log('\n📊 테스트 결과 요약:');
  console.log(`기본 암호화: ${results[0] ? '✅' : '❌'}`);
  console.log(`패스워드 검증: ${results[1] ? '✅' : '❌'}`);
  console.log(`설정 검증: ${results[2] ? '✅' : '❌'}`);
  console.log(`Firebase 설정 암호화: ${results[3] ? '✅' : '❌'}`);
  console.log(`\n전체 결과: ${allPassed ? '✅ 모든 테스트 통과' : '❌ 일부 테스트 실패'}`);
  
  return allPassed;
} 