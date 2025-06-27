import { Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Layout from './components/layout/Layout';

/**
 * Core Quant 메인 애플리케이션 컴포넌트
 * 라우팅 설정 및 전체 레이아웃 구성을 담당
 */
function App(): React.ReactElement {
  return (
    <Box minH="100vh" bg="gray.50">
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </Box>
  );
}

export default App; 