import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  VStack,
  Heading,
  Text,
  useToast,
  Divider,
  Flex,
  InputGroup,
  InputRightElement,
  Switch,
  FormHelperText,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  Collapse
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { FirebaseConfig } from '../../config/firebase';
import { encryptData, validatePasswordStrength } from '../../utils/crypto';
import { useFirebaseStore, EncryptedFirebaseConfig } from '../../store/firebase';
import ConnectionStatus from './ConnectionStatus';
import { 
  validateEmail, 
  validateApiKey, 
  validateProjectId,
  validateAuthDomain,
  validateStorageBucket,
  validateMessagingSenderId,
  validateAppId,
  validatePassword,
  isEmpty
} from '../../utils/validators';
import { initializeFirebase, testFirebaseConnection } from '../../config/firebase';
import { signInAnonymous } from '../../services/firebase/auth';

/**
 * Firebase 설정 UI 컴포넌트
 * 사용자 Firebase 인증 정보 입력 및 저장 기능 제공
 */
const FirebaseSetup: React.FC = () => {
  // Firebase 설정 상태
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  });

  // 이메일 및 패스워드 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberConfig, setRememberConfig] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);

  // Firebase 스토어
  const { 
    encryptedConfig, 
    setEncryptedConfig, 
    connectionStatus, 
    setConnectionStatus,
    setConnectionError
  } = useFirebaseStore();

  const toast = useToast();
  const formBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // 저장된 설정이 있으면 로드
  useEffect(() => {
    if (encryptedConfig) {
      setConfig(prev => ({ ...prev, projectId: encryptedConfig.projectId }));
    }
  }, [encryptedConfig]);

  /**
   * 입력값 변경 처리
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
    
    // 에러 메시지 지우기
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * 이메일 변경 처리
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  /**
   * 패스워드 변경 처리
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  /**
   * 패스워드 표시 전환
   */
  const toggleShowPassword = () => setShowPassword(!showPassword);

  /**
   * 입력값 유효성 검증
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Firebase 설정 검증
    const apiKeyValidation = validateApiKey(config.apiKey);
    if (!apiKeyValidation.isValid) {
      newErrors.apiKey = apiKeyValidation.message;
      isValid = false;
    }

    const projectIdValidation = validateProjectId(config.projectId);
    if (!projectIdValidation.isValid) {
      newErrors.projectId = projectIdValidation.message;
      isValid = false;
    }

    const authDomainValidation = validateAuthDomain(config.authDomain);
    if (!authDomainValidation.isValid) {
      newErrors.authDomain = authDomainValidation.message;
      isValid = false;
    }

    const storageBucketValidation = validateStorageBucket(config.storageBucket);
    if (!storageBucketValidation.isValid) {
      newErrors.storageBucket = storageBucketValidation.message;
      isValid = false;
    }

    const messagingSenderIdValidation = validateMessagingSenderId(config.messagingSenderId);
    if (!messagingSenderIdValidation.isValid) {
      newErrors.messagingSenderId = messagingSenderIdValidation.message;
      isValid = false;
    }

    const appIdValidation = validateAppId(config.appId);
    if (!appIdValidation.isValid) {
      newErrors.appId = appIdValidation.message;
      isValid = false;
    }

    // 설정을 저장하려면 이메일과 패스워드 검증
    if (rememberConfig) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.message;
        isValid = false;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setShowErrorSummary(!isValid);
    return isValid;
  };

  /**
   * 설정 저장 및 연결 시작
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setConnectionStatus('connecting');

    try {
      // Firebase 초기화
      const initResult = await initializeFirebase(config);
      
      if (!initResult.success) {
        throw new Error(initResult.error || '알 수 없는 오류가 발생했습니다.');
      }

      // 설정 저장 (선택 사항)
      if (rememberConfig) {
        try {
          // 암호화하여 저장
          const encryptResult = await encryptData(
            JSON.stringify(config),
            password
          );

          const encryptedConfig: EncryptedFirebaseConfig = {
            encryptedData: encryptResult.encryptedData,
            salt: encryptResult.salt,
            iv: encryptResult.iv,
            projectId: config.projectId, // 프로젝트 ID는 암호화되지 않음 (표시용)
            lastModified: Date.now()
          };

          setEncryptedConfig(encryptedConfig);
          
          toast({
            title: '설정 저장 완료',
            description: '암호화된 Firebase 설정이 저장되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('암호화 중 오류:', error);
          toast({
            title: '설정 저장 실패',
            description: '설정 암호화 중 오류가 발생했습니다.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }

      // 연결 테스트
      setTestingConnection(true);
      const testResult = await testFirebaseConnection();
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'Firebase 연결 테스트에 실패했습니다.');
      }

      // 익명 인증 수행
      const authResult = await signInAnonymous();
      if (!authResult.success) {
        throw new Error(authResult.error || '익명 인증에 실패했습니다.');
      }

      // 모든 과정 성공
      setConnectionStatus('connected');
      
      toast({
        title: 'Firebase 연결 성공',
        description: `${config.projectId} 프로젝트에 연결되었습니다.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Firebase 설정 중 오류:', error);
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      
      toast({
        title: 'Firebase 연결 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setTestingConnection(false);
    }
  };

  /**
   * Firebase에서 프로젝트 ID 자동 채우기
   */
  const autoFillFromProjectId = () => {
    if (isEmpty(config.projectId)) return;

    const projectId = config.projectId.trim();
    setConfig(prev => ({
      ...prev,
      authDomain: `${projectId}.firebaseapp.com`,
      storageBucket: `${projectId}.appspot.com`,
    }));
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      borderWidth={1}
      borderRadius="lg"
      p={6}
      bg={formBg}
      borderColor={borderColor}
      boxShadow="sm"
      width="100%"
      maxWidth="600px"
      mx="auto"
    >
      <VStack spacing={5} align="stretch">
        <Box textAlign="center">
          <Heading size="md" mb={2}>Firebase 설정</Heading>
          <Text color="gray.600" fontSize="sm">
            Firebase 프로젝트 연결을 위한 인증 정보를 입력하세요
          </Text>
        </Box>
        
        <ConnectionStatus showDetails={true} />
        
        <Collapse in={showErrorSummary}>
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            입력 정보에 오류가 있습니다. 모든 필수 항목을 올바르게 입력해주세요.
          </Alert>
        </Collapse>

        {/* API Key */}
        <FormControl isInvalid={!!errors.apiKey} isRequired>
          <FormLabel htmlFor="apiKey">API Key</FormLabel>
          <Input
            id="apiKey"
            name="apiKey"
            value={config.apiKey}
            onChange={handleChange}
            placeholder="AIzaSyA1b2C3d4e5F6g7H8i9J0k1L2m3N4o5P6q"
          />
          <FormErrorMessage>{errors.apiKey}</FormErrorMessage>
        </FormControl>

        {/* Project ID */}
        <FormControl isInvalid={!!errors.projectId} isRequired>
          <FormLabel htmlFor="projectId">Project ID</FormLabel>
          <Input
            id="projectId"
            name="projectId"
            value={config.projectId}
            onChange={handleChange}
            placeholder="my-project-12345"
            onBlur={autoFillFromProjectId}
          />
          <FormErrorMessage>{errors.projectId}</FormErrorMessage>
          <FormHelperText>
            프로젝트 ID를 입력하면 일부 필드가 자동으로 채워집니다.
          </FormHelperText>
        </FormControl>

        {/* Auth Domain */}
        <FormControl isInvalid={!!errors.authDomain} isRequired>
          <FormLabel htmlFor="authDomain">Auth Domain</FormLabel>
          <Input
            id="authDomain"
            name="authDomain"
            value={config.authDomain}
            onChange={handleChange}
            placeholder="my-project-12345.firebaseapp.com"
          />
          <FormErrorMessage>{errors.authDomain}</FormErrorMessage>
        </FormControl>

        {/* Storage Bucket */}
        <FormControl isInvalid={!!errors.storageBucket} isRequired>
          <FormLabel htmlFor="storageBucket">Storage Bucket</FormLabel>
          <Input
            id="storageBucket"
            name="storageBucket"
            value={config.storageBucket}
            onChange={handleChange}
            placeholder="my-project-12345.appspot.com"
          />
          <FormErrorMessage>{errors.storageBucket}</FormErrorMessage>
        </FormControl>

        {/* Messaging Sender ID */}
        <FormControl isInvalid={!!errors.messagingSenderId} isRequired>
          <FormLabel htmlFor="messagingSenderId">Messaging Sender ID</FormLabel>
          <Input
            id="messagingSenderId"
            name="messagingSenderId"
            value={config.messagingSenderId}
            onChange={handleChange}
            placeholder="123456789012"
          />
          <FormErrorMessage>{errors.messagingSenderId}</FormErrorMessage>
        </FormControl>

        {/* App ID */}
        <FormControl isInvalid={!!errors.appId} isRequired>
          <FormLabel htmlFor="appId">App ID</FormLabel>
          <Input
            id="appId"
            name="appId"
            value={config.appId}
            onChange={handleChange}
            placeholder="1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
          />
          <FormErrorMessage>{errors.appId}</FormErrorMessage>
        </FormControl>

        {/* Measurement ID (optional) */}
        <FormControl>
          <FormLabel htmlFor="measurementId">Measurement ID (선택)</FormLabel>
          <Input
            id="measurementId"
            name="measurementId"
            value={config.measurementId || ''}
            onChange={handleChange}
            placeholder="G-ABCDEF1234"
          />
          <FormHelperText>
            Google Analytics를 사용하는 경우에만 필요합니다.
          </FormHelperText>
        </FormControl>

        <Divider my={2} />
        
        {/* 설정 저장 옵션 */}
        <FormControl display="flex" alignItems="center">
          <Switch
            id="rememberConfig"
            isChecked={rememberConfig}
            onChange={() => setRememberConfig(!rememberConfig)}
            colorScheme="blue"
            mr={3}
          />
          <FormLabel htmlFor="rememberConfig" mb={0}>
            설정 저장하기
          </FormLabel>
        </FormControl>

        {/* 설정 저장 시에만 표시할 필드들 */}
        <Collapse in={rememberConfig}>
          <VStack spacing={4} mt={2}>
            <FormControl isInvalid={!!errors.email} isRequired={rememberConfig}>
              <FormLabel htmlFor="email">이메일 주소</FormLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
              <FormHelperText>
                암호화 키 복구를 위해 사용됩니다. 저장되지 않습니다.
              </FormHelperText>
            </FormControl>

            <FormControl isInvalid={!!errors.password} isRequired={rememberConfig}>
              <FormLabel htmlFor="password">보안 패스워드</FormLabel>
              <InputGroup>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="8자 이상 안전한 패스워드"
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={toggleShowPassword}>
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password}</FormErrorMessage>
              <FormHelperText>
                Firebase 설정을 암호화하기 위한 패스워드입니다. 안전하게 보관하세요.
              </FormHelperText>
            </FormControl>
          </VStack>
        </Collapse>

        <Button
          mt={4}
          colorScheme="blue"
          type="submit"
          isLoading={isLoading || testingConnection}
          loadingText={testingConnection ? '연결 테스트 중...' : '처리 중...'}
          width="100%"
        >
          {connectionStatus === 'connected' ? (
            <Flex align="center">
              <Icon as={CheckCircleIcon} mr={2} />
              연결됨 - 재연결
            </Flex>
          ) : (
            '연결 및 저장'
          )}
        </Button>
      </VStack>
    </Box>
  );
};

export default FirebaseSetup; 