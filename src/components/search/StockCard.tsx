/**
 * 종목 정보 카드 컴포넌트
 * 검색 결과 및 종목 목록에서 사용하는 종목 카드
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Spacer,
  Skeleton,
  useColorModeValue,
  HStack,
  Tag,
} from '@chakra-ui/react';
import { StockSearchItem, StockQuote } from '../../types/stock';
import stockService from '../../services/yahoo-finance/stock-service';

interface StockCardProps {
  stock: StockSearchItem;
  showPrice?: boolean;
}

/**
 * 가격 변동에 따른 색상 반환
 */
const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'green.500';
  if (change < 0) return 'red.500';
  return 'gray.500';
};

/**
 * 거래소 약어 변환
 */
const formatExchange = (exchange?: string): string => {
  if (!exchange) return '';
  
  // 거래소 이름 약어로 변환
  const exchanges: Record<string, string> = {
    'NASDAQ': 'NASDAQ',
    'New York Stock Exchange': 'NYSE',
    'NYSE': 'NYSE',
    'Korea Stock Exchange': 'KRX',
    'KRX': 'KRX',
    'Shanghai': 'SSE',
    'Hong Kong': 'HKEX',
    'Tokyo': 'TSE',
    'London': 'LSE',
    'Euronext': 'EURONEXT',
    'Toronto': 'TSX',
  };
  
  return exchanges[exchange] || exchange;
};

const StockCard: React.FC<StockCardProps> = ({ stock, showPrice = false }) => {
  const [quoteData, setQuoteData] = useState<StockQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(showPrice);
  const [error, setError] = useState<string | null>(null);
  
  // 색상 설정
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  
  // 시세 정보 로드 (showPrice가 true일 때만)
  useEffect(() => {
    if (!showPrice || !stock.symbol) return;
    
    const fetchQuote = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await stockService.getStockQuote(stock.symbol);
        setQuoteData(data);
      } catch (err) {
        console.error('시세 조회 오류:', err);
        setError('시세 정보를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuote();
  }, [stock.symbol, showPrice]);
  
  // 환율 포맷 함수
  const formatCurrency = (value: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // 퍼센트 포맷 함수
  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always'
    }).format(value / 100);
  };
  
  return (
    <Box
      p={4}
      borderRadius="md"
      borderWidth={1}
      borderColor={borderColor}
      bg={cardBg}
      boxShadow="sm"
      _hover={{ boxShadow: 'md' }}
      transition="all 0.2s"
    >
      <Flex direction="column" gap={2}>
        {/* 종목 기본 정보 */}
        <Flex align="center">
          <Box>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              {stock.symbol}
            </Text>
            <Text fontSize="sm" color={subTextColor} noOfLines={1}>
              {stock.name}
            </Text>
          </Box>
          <Spacer />
          
          {/* 거래소 정보 */}
          {stock.exchange && (
            <Tag size="sm" variant="subtle" colorScheme="blue">
              {formatExchange(stock.exchange)}
            </Tag>
          )}
          
          {/* 종목 유형 */}
          {stock.type && (
            <Tag size="sm" ml={2} variant="subtle" colorScheme="purple">
              {stock.type}
            </Tag>
          )}
        </Flex>
        
        {/* 가격 정보 (showPrice가 true일 때만) */}
        {showPrice && (
          <Box mt={2}>
            {isLoading ? (
              <Skeleton height="24px" width="120px" />
            ) : error ? (
              <Text fontSize="sm" color="red.500">{error}</Text>
            ) : quoteData ? (
              <Flex align="center">
                <Text fontSize="lg" fontWeight="bold">
                  {formatCurrency(quoteData.price.regularMarketPrice, quoteData.currency)}
                </Text>
                <HStack ml={2} spacing={1}>
                  <Text 
                    fontSize="sm" 
                    color={getPriceChangeColor(quoteData.price.regularMarketChange)}
                  >
                    {quoteData.price.regularMarketChange > 0 ? '+' : ''}
                    {formatCurrency(quoteData.price.regularMarketChange, quoteData.currency)}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color={getPriceChangeColor(quoteData.price.regularMarketChangePercent)}
                  >
                    ({formatPercent(quoteData.price.regularMarketChangePercent)})
                  </Text>
                </HStack>
              </Flex>
            ) : null}
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default StockCard; 