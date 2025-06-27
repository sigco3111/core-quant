import { Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';

/**
 * Core Quant 메인 애플리케이션 컴포넌트
 * 라우팅 설정 및 전체 레이아웃 구성을 담당
 */
function App(): React.ReactElement {
  useEffect(() => {
    // 개발 환경에서만 암호화 테스트 실행
    if (process.env.NODE_ENV === 'development') {
      import('./utils/crypto/test').then(({ runAllCryptoTests }) => {
        runAllCryptoTests().then((result) => {
          console.log('🔐 암호화 테스트 완료:', result ? '성공' : '실패');
        });
      });
    }
  }, []);

  return (
    <Box minH="100vh" bg="gray.50">
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </Box>
  );
}

export default App; 