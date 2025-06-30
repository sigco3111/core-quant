/**
 * 종목 검색 페이지 컴포넌트
 * 검색 인터페이스 및 관련 기능 제공
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import StockSearch from './StockSearch';

/**
 * 종목 검색 페이지
 * 종목 검색 및 결과 표시 화면
 */
const SearchPage: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Box>
      {/* 페이지 경로 */}
      <Breadcrumb mb={5} fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">홈</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>종목 검색</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* 페이지 제목 */}
      <VStack spacing={2} align="start" mb={8}>
        <Heading as="h1" size="xl">종목 검색</Heading>
        <Text color={textColor}>
          종목명 또는 티커 심볼로 주식, ETF 등을 검색하세요.
        </Text>
      </VStack>
      
      {/* 검색 컴포넌트 */}
      <Box
        p={6}
        bg={useColorModeValue('white', 'gray.700')}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
      >
        <StockSearch />
      </Box>
      
      {/* 도움말 */}
      <Box mt={8} p={4} bg={bgColor} borderRadius="md">
        <Heading size="sm" mb={2}>검색 도움말</Heading>
        <VStack align="start" spacing={2}>
          <Text fontSize="sm">• 티커 심볼(예: AAPL, MSFT) 또는 회사명(예: Apple, Microsoft)으로 검색하세요.</Text>
          <Text fontSize="sm">• 미국, 한국 등 주요 시장의 주식, ETF를 검색할 수 있습니다.</Text>
          <Text fontSize="sm">• 종목 카드를 클릭하면 해당 종목의 상세 정보와 차트를 볼 수 있습니다.</Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default SearchPage; 