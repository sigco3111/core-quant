/**
 * 주식 검색 컴포넌트
 * 종목명 또는 티커 검색 인터페이스 제공
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  Text,
  Spinner,
  Icon,
  Flex,
  useColorModeValue,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Button,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import stockService from '../../services/yahoo-finance/stock-service';
import { StockSearchItem } from '../../types/stock';
import StockCard from './StockCard';
import { useNavigate } from 'react-router-dom';

/**
 * 디바운스 훅 구현
 * 검색어 입력 시 연속 API 호출 방지
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const StockSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StockSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // 색상 설정
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  
  // 디바운스 적용된 검색어
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);
  
  /**
   * 검색 실행
   * 디바운스된 검색어로 API 호출
   */
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await stockService.searchStocks(term);
      setSearchResults(results.results);
      
      if (results.count === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 검색어 변경 시 검색 실행
  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, performSearch]);
  
  /**
   * 검색어 초기화
   */
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    inputRef.current?.focus();
  };
  
  /**
   * 종목 클릭 핸들러
   */
  const handleStockSelect = (stock: StockSearchItem) => {
    navigate(`/stock/${stock.symbol}`);
  };
  
  return (
    <Box w="100%">
      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">종목 검색</FormLabel>
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
            placeholder="티커 심볼 또는 기업명 입력 (예: AAPL, Apple)"
            borderWidth={2}
            _focus={{
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
            }}
          />
          
          {isLoading ? (
            <InputRightElement>
              <Spinner size="sm" color="blue.500" />
            </InputRightElement>
          ) : searchTerm ? (
            <InputRightElement>
              <CloseIcon 
                color="gray.400" 
                cursor="pointer" 
                onClick={clearSearch} 
                w={3} 
                h={3} 
              />
            </InputRightElement>
          ) : null}
        </InputGroup>
        
        <FormHelperText>
          미국, 한국 등 주요 시장의 주식, ETF를 검색할 수 있습니다.
        </FormHelperText>
        
        {error && <FormErrorMessage>{error}</FormErrorMessage>}
      </FormControl>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <VStack 
          mt={4} 
          spacing={3} 
          align="stretch" 
          maxH="500px" 
          overflowY="auto"
          boxShadow={isInputFocused ? "md" : "none"}
          borderRadius="md"
          bg={isInputFocused ? cardBgColor : 'transparent'}
          borderWidth={isInputFocused ? 1 : 0}
          borderColor={cardBorderColor}
          transition="all 0.2s"
          p={isInputFocused ? 4 : 0}
        >
          {searchResults.map((stock) => (
            <Box 
              key={stock.symbol}
              onClick={() => handleStockSelect(stock)}
              cursor="pointer"
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
              transition="all 0.2s"
            >
              <StockCard stock={stock} />
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default StockSearch; 