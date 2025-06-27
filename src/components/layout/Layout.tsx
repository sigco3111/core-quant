import { Routes, Route } from 'react-router-dom';
import { Box, Container, Heading, Text } from '@chakra-ui/react';

/**
 * 애플리케이션의 메인 레이아웃 컴포넌트
 * 헤더, 사이드바, 메인 콘텐츠 영역을 구성
 */
function Layout(): React.ReactElement {
  return (
    <Box minH="100vh">
      {/* 임시 헤더 */}
      <Box bg="blue.600" color="white" py={4} px={6}>
        <Heading size="lg">Core Quant</Heading>
        <Text fontSize="sm">퀀트 투자 백테스팅 플랫폼</Text>
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
              </Box>
            } 
          />
        </Routes>
      </Container>
    </Box>
  );
}

export default Layout; 