/**
 * 종목 상세 정보 컴포넌트
 * 선택된 종목의 상세 정보와 차트 표시
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  GridItem,
  Button,
  Divider,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Skeleton,
  useColorModeValue,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tag,
} from '@chakra-ui/react';
import { ArrowBackIcon, InfoOutlineIcon, CalendarIcon } from '@chakra-ui/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { useParams, useNavigate, Link } from 'react-router-dom';
import stockService from '../../services/yahoo-finance/stock-service';
import { StockQuote, HistoricalData, HistoricalDataItem } from '../../types/stock';

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * 날짜 포맷 함수
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * 통화 포맷 함수
 */
const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * 퍼센트 포맷 함수
 */
const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always'
  }).format(value / 100);
};

/**
 * 거래량 포맷 함수
 */
const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }
  return volume.toString();
};

/**
 * 기간별 옵션 타입
 */
interface PeriodOption {
  label: string;
  days: number;
  interval: string;
}

/**
 * 기간 옵션 정의
 */
const PERIOD_OPTIONS: PeriodOption[] = [
  { label: '1D', days: 1, interval: '5m' },
  { label: '5D', days: 5, interval: '15m' },
  { label: '1M', days: 30, interval: '1d' },
  { label: '3M', days: 90, interval: '1d' },
  { label: '6M', days: 180, interval: '1d' },
  { label: '1Y', days: 365, interval: '1d' },
  { label: '5Y', days: 365 * 5, interval: '1wk' },
  { label: 'MAX', days: 365 * 20, interval: '1mo' },
];

const StockDetail: React.FC = () => {
  // URL 파라미터에서 종목 심볼 가져오기
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  
  // 상태 관리
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(PERIOD_OPTIONS[2]); // 기본 1개월
  
  // 색상 설정
  const chartBgColor = useColorModeValue('rgba(99, 179, 237, 0.1)', 'rgba(99, 179, 237, 0.1)');
  const chartBorderColor = useColorModeValue('rgba(49, 130, 206, 1)', 'rgba(99, 179, 237, 1)');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300');
  
  // 종목 시세 정보 로드
  useEffect(() => {
    if (!symbol) return;
    
    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      setError(null);
      
      try {
        const data = await stockService.getStockQuote(symbol);
        setQuote(data);
      } catch (err) {
        console.error('시세 조회 오류:', err);
        setError('종목 정보를 불러올 수 없습니다.');
      } finally {
        setIsLoadingQuote(false);
      }
    };
    
    fetchQuote();
  }, [symbol]);
  
  // 과거 데이터 로드
  useEffect(() => {
    if (!symbol || !selectedPeriod) return;
    
    const fetchHistoricalData = async () => {
      setIsLoadingHistory(true);
      
      try {
        // 시작일 계산 (오늘로부터 선택된 기간만큼 이전)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - selectedPeriod.days);
        
        const data = await stockService.getHistoricalData(
          symbol,
          selectedPeriod.interval,
          startDate,
          endDate
        );
        
        setHistoricalData(data);
      } catch (err) {
        console.error('과거 데이터 조회 오류:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchHistoricalData();
  }, [symbol, selectedPeriod]);
  
  // 차트 데이터 생성
  const chartData: ChartData<'line'> = {
    labels: historicalData?.data.map((item) => {
      // 간격에 따라 다른 포맷 적용
      if (selectedPeriod.interval === '5m' || selectedPeriod.interval === '15m') {
        return new Date(item.date).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return new Date(item.date).toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }) || [],
    datasets: [
      {
        label: symbol || '',
        data: historicalData?.data.map((item) => item.close) || [],
        borderColor: chartBorderColor,
        backgroundColor: chartBgColor,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 5,
        pointHitRadius: 10,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        fill: true,
        tension: 0.1,
      },
    ],
  };
  
  // 차트 옵션
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return `${formatCurrency(value, quote?.currency || 'USD')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        position: 'right',
        grid: {
          color: useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)'),
        },
      },
    },
  };

  /**
   * 가격 변화에 따른 색상 반환
   */
  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'green.500';
    if (change < 0) return 'red.500';
    return 'gray.500';
  };

  /**
   * 이전 화면으로 돌아가기
   */
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // 종목 심볼 없을 때
  if (!symbol) {
    return (
      <Alert status="error">
        <AlertIcon />
        종목 심볼이 지정되지 않았습니다.
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* 상단 네비게이션 */}
      <Breadcrumb mb={5} fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">홈</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/search">종목 검색</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{symbol}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* 돌아가기 버튼 */}
      <Button 
        leftIcon={<ArrowBackIcon />} 
        variant="outline" 
        mb={6} 
        onClick={handleGoBack}
      >
        돌아가기
      </Button>
      
      {/* 오류 메시지 */}
      {error && (
        <Alert status="error" mb={5}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* 종목 기본 정보 */}
      <Box mb={8}>
        {isLoadingQuote ? (
          <VStack align="start" spacing={3}>
            <Skeleton height="36px" width="300px" />
            <Skeleton height="28px" width="200px" />
            <Skeleton height="24px" width="150px" />
          </VStack>
        ) : quote ? (
          <Grid templateColumns="1fr auto" gap={4}>
            <GridItem>
              <Heading as="h1" size="xl" mb={1}>{quote.longName || quote.shortName}</Heading>
              <Flex align="center" mb={3}>
                <Text fontSize="lg" fontWeight="bold" color="gray.500" mr={3}>
                  {quote.symbol}
                </Text>
                <Tag colorScheme="blue">{quote.exchange}</Tag>
              </Flex>
              
              <HStack spacing={4}>
                <Stat>
                  <StatLabel>현재 가격</StatLabel>
                  <StatNumber>{formatCurrency(quote.price.regularMarketPrice, quote.currency)}</StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>변화</StatLabel>
                  <StatNumber color={getPriceChangeColor(quote.price.regularMarketChange)}>
                    {quote.price.regularMarketChange > 0 ? '+' : ''}
                    {formatCurrency(quote.price.regularMarketChange, quote.currency)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow 
                      type={quote.price.regularMarketChangePercent > 0 ? 'increase' : 'decrease'} 
                    />
                    {formatPercent(quote.price.regularMarketChangePercent)}
                  </StatHelpText>
                </Stat>
              </HStack>
            </GridItem>
            
            <GridItem>
              <VStack align="end" spacing={1}>
                <Text fontSize="sm" color={textColorSecondary}>
                  시장 상태: {quote.marketState === 'REGULAR' ? '정규장' : 
                             quote.marketState === 'PRE' ? '장전' : 
                             quote.marketState === 'POST' ? '장후' : 
                             quote.marketState === 'CLOSED' ? '장종료' : 
                             quote.marketState}
                </Text>
                <Text fontSize="sm" color={textColorSecondary}>
                  최종 업데이트: {new Date(quote.lastUpdated).toLocaleString('ko-KR')}
                </Text>
              </VStack>
            </GridItem>
          </Grid>
        ) : null}
      </Box>
      
      {/* 가격 차트 */}
      <Box 
        p={6}
        borderRadius="lg"
        borderWidth="1px"
        bg={cardBgColor}
        borderColor={borderColor}
        boxShadow="sm"
        mb={8}
      >
        {/* 기간 선택 버튼 */}
        <HStack mb={6} spacing={2}>
          {PERIOD_OPTIONS.map((period) => (
            <Button
              key={period.label}
              size="sm"
              variant={selectedPeriod.label === period.label ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setSelectedPeriod(period)}
            >
              {period.label}
            </Button>
          ))}
        </HStack>
        
        {/* 차트 영역 */}
        <Box height="400px" position="relative">
          {isLoadingHistory ? (
            <Flex justify="center" align="center" height="100%">
              <Skeleton height="100%" width="100%" />
            </Flex>
          ) : historicalData && historicalData.data.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Flex justify="center" align="center" height="100%">
              <Text color="gray.500">
                <InfoOutlineIcon mr={2} />
                데이터가 없습니다.
              </Text>
            </Flex>
          )}
        </Box>
      </Box>
      
      {/* 상세 정보 탭 */}
      <Box 
        borderRadius="lg"
        borderWidth="1px"
        bg={cardBgColor}
        borderColor={borderColor}
        boxShadow="sm"
      >
        <Tabs>
          <TabList>
            <Tab>요약</Tab>
            <Tab>거래 정보</Tab>
            <Tab>과거 데이터</Tab>
          </TabList>
          
          <TabPanels>
            {/* 요약 정보 탭 */}
            <TabPanel>
              {isLoadingQuote ? (
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} height="80px" />
                  ))}
                </Grid>
              ) : quote ? (
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                  <Stat>
                    <StatLabel>시가</StatLabel>
                    <StatNumber>{formatCurrency(quote.price.regularMarketOpen, quote.currency)}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>종가(전일)</StatLabel>
                    <StatNumber>{formatCurrency(quote.price.regularMarketPreviousClose, quote.currency)}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>당일 고가</StatLabel>
                    <StatNumber>{formatCurrency(quote.price.regularMarketDayHigh, quote.currency)}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>당일 저가</StatLabel>
                    <StatNumber>{formatCurrency(quote.price.regularMarketDayLow, quote.currency)}</StatNumber>
                  </Stat>
                </Grid>
              ) : (
                <Text color="gray.500">데이터를 불러올 수 없습니다.</Text>
              )}
            </TabPanel>
            
            {/* 거래 정보 탭 */}
            <TabPanel>
              <Text>추가 정보는 향후 업데이트됩니다.</Text>
            </TabPanel>
            
            {/* 과거 데이터 탭 */}
            <TabPanel>
              {isLoadingHistory ? (
                <Skeleton height="300px" />
              ) : historicalData && historicalData.data.length > 0 ? (
                <Box overflowX="auto">
                  <Box as="table" width="100%" borderWidth="1px" borderColor={borderColor} borderRadius="md">
                    <Box as="thead" bg={useColorModeValue('gray.50', 'gray.800')}>
                      <Box as="tr">
                        <Box as="th" p={3} textAlign="left">날짜</Box>
                        <Box as="th" p={3} textAlign="right">시가</Box>
                        <Box as="th" p={3} textAlign="right">고가</Box>
                        <Box as="th" p={3} textAlign="right">저가</Box>
                        <Box as="th" p={3} textAlign="right">종가</Box>
                        <Box as="th" p={3} textAlign="right">거래량</Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {historicalData.data.slice(0, 10).map((item, index) => (
                        <Box 
                          as="tr" 
                          key={index}
                          bg={index % 2 === 0 ? 'transparent' : useColorModeValue('gray.50', 'gray.800')}
                        >
                          <Box as="td" p={3}>{formatDate(item.date)}</Box>
                          <Box as="td" p={3} textAlign="right">
                            {formatCurrency(item.open, historicalData.currency)}
                          </Box>
                          <Box as="td" p={3} textAlign="right">
                            {formatCurrency(item.high, historicalData.currency)}
                          </Box>
                          <Box as="td" p={3} textAlign="right">
                            {formatCurrency(item.low, historicalData.currency)}
                          </Box>
                          <Box as="td" p={3} textAlign="right">
                            {formatCurrency(item.close, historicalData.currency)}
                          </Box>
                          <Box as="td" p={3} textAlign="right">
                            {formatVolume(item.volume)}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  
                  {historicalData.data.length > 10 && (
                    <Text mt={2} fontSize="sm" color="gray.500" textAlign="right">
                      최근 10개 레코드만 표시됩니다.
                    </Text>
                  )}
                </Box>
              ) : (
                <Text color="gray.500">과거 데이터가 없습니다.</Text>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default StockDetail; 