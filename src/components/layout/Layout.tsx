import { Routes, Route, Link } from 'react-router-dom';
import { Box, Container, Heading, Text, Button, Flex, Spacer, useColorModeValue } from '@chakra-ui/react';
import FirebaseSetup from '../auth/FirebaseSetup';
import ConnectionStatus from '../auth/ConnectionStatus';
import SearchPage from '../search/SearchPage';
import StockDetail from '../search/StockDetail';
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

  // 개발 중 임시 설정 - 항상 true로 설정하여 다른 화면에 접근 가능하게 함
  const allowAccess = true; // 개발 중에만 true로 설정

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
        {!allowAccess && !isConfigSaved && connectionStatus !== 'connected' ? (
          <Box py={10}>
            <FirebaseSetup />
          </Box>
        ) : (
          <Routes>
            <Route path="/" element={
              <Box py={10}>
                <Heading mb={6}>Core Quant에 오신 것을 환영합니다</Heading>
                <Text mb={4}>
                  시작하려면 아래 옵션 중 하나를 선택하세요.
                </Text>
                <Flex gap={4} wrap="wrap">
                  <Button as={Link} to="/search" colorScheme="blue">
                    종목 검색
                  </Button>
                  <Button as={Link} to="/strategy" colorScheme="teal">
                    투자 전략 생성
                  </Button>
                  <Button as={Link} to="/backtest" colorScheme="purple">
                    백테스트 실행
                  </Button>
                </Flex>
              </Box>
            } />
            <Route path="/settings" element={<FirebaseSetup />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="*" element={
              <Box py={10} textAlign="center">
                <Heading size="lg">404 - 페이지를 찾을 수 없습니다</Heading>
                <Button as={Link} to="/" mt={6} colorScheme="blue">
                  홈으로 돌아가기
                </Button>
              </Box>
            } />
          </Routes>
        )}
      </Container>
    </Box>
  );
}

export default Layout; 