import { Routes, Route, Link } from 'react-router-dom';
import { Box, Container, Heading, Text, Button, Flex, Spacer, useColorModeValue } from '@chakra-ui/react';
import FirebaseSetup from '../auth/FirebaseSetup';
import ConnectionStatus from '../auth/ConnectionStatus';
import { useFirebaseStore } from '../../store/firebase';

/**
 * 애플리케이션의 메인 레이아웃 컴포넌트
 * 헤더, 사이드바, 메인 콘텐츠 영역을 구성
 */
function Layout(): React.ReactElement {
  const isConfigSaved = useFirebaseStore(state => state.isConfigSaved);
  const connectionStatus = useFirebaseStore(state => state.connectionStatus);
  const headerBg = useColorModeValue('blue.600', 'blue.800');
  const headerColor = useColorModeValue('white', 'gray.100');

  return (
    <Box minH="100vh">
      {/* 헤더 */}
      <Box bg={headerBg} color={headerColor} py={4} px={6} boxShadow="md">
        <Flex alignItems="center">
          <Heading size="lg" as={Link} to="/">Core Quant</Heading>
          <Text fontSize="sm" ml={2}>퀀트 투자 백테스팅 플랫폼</Text>
          <Spacer />
          <ConnectionStatus compact={true} />
          <Button as={Link} to="/settings" size="sm" ml={4} colorScheme="blue" variant="outline">
            설정
          </Button>
        </Flex>
      </Box>

      {/* 메인 콘텐츠 */}
      <Container maxW="container.xl" py={8}>
        <Routes>
          <Route 
            path="/" 
            element={
              <Box textAlign="center">
                <Heading mb={4}>Core Quant에 오신 것을 환영합니다!</Heading>
                <Text>Firebase 기반 퀀트 투자 백테스팅 플랫폼</Text>
                <Text mt={2} color="gray.600">
                  프로젝트 초기 설정이 완료되었습니다.
                </Text>
                <Text mt={2} color="green.600" fontWeight="bold">
                  🔐 암호화 유틸리티 및 Firebase 연동 기반 구현 완료
                </Text>
                
                {!isConfigSaved && (
                  <Button 
                    as={Link}
                    to="/settings"
                    colorScheme="blue"
                    size="lg"
                    mt={6}
                  >
                    Firebase 설정 시작하기
                  </Button>
                )}
              </Box>
            } 
          />
          <Route path="/settings" element={<FirebaseSetup />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default Layout; 