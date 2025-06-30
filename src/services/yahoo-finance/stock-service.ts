/**
 * 주식 데이터 서비스
 * Yahoo Finance API를 활용한 주식 데이터 처리
 */

import yahooFinanceService from '.';
import { 
  StockSearchItem, 
  StockSearchResults, 
  StockQuote, 
  HistoricalData,
  HistoricalDataItem 
} from '../../types/stock';

/**
 * 검색 결과 캐시 타입
 */
interface SearchCache {
  [query: string]: {
    results: StockSearchItem[];
    timestamp: number;
  }
}

/**
 * 시세 데이터 캐시 타입
 */
interface QuoteCache {
  [symbol: string]: {
    data: StockQuote;
    timestamp: number;
  }
}

/**
 * 개발 환경용 모의 데이터
 */
const MOCK_SEARCH_RESULTS: Record<string, StockSearchItem[]> = {
  'apple': [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
    { symbol: 'AAPL.NE', name: 'Apple Inc.', exchange: 'NEO', type: 'EQUITY' },
    { symbol: 'AAPL.MX', name: 'Apple Inc.', exchange: 'Mexico', type: 'EQUITY' },
  ],
  'microsoft': [
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
    { symbol: 'MSFT.NE', name: 'Microsoft Corporation', exchange: 'NEO', type: 'EQUITY' },
  ],
  'amazon': [
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  ],
  'google': [
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
    { symbol: 'GOOG', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  ],
  'tesla': [
    { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  ],
  'samsung': [
    { symbol: '005930.KS', name: 'Samsung Electronics Co., Ltd.', exchange: 'KRX', type: 'EQUITY' },
  ],
  'hyundai': [
    { symbol: '005380.KS', name: 'Hyundai Motor Company', exchange: 'KRX', type: 'EQUITY' },
  ]
};

/**
 * 모의 시세 데이터
 */
const MOCK_QUOTES: Record<string, StockQuote> = {
  'AAPL': {
    symbol: 'AAPL',
    price: {
      regularMarketPrice: 187.32,
      regularMarketChange: 1.25,
      regularMarketChangePercent: 0.67,
      regularMarketPreviousClose: 186.07,
      regularMarketOpen: 186.12,
      regularMarketDayHigh: 188.45,
      regularMarketDayLow: 185.83,
    },
    marketState: 'REGULAR',
    shortName: 'Apple Inc.',
    longName: 'Apple Inc.',
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date().toISOString(),
  },
  'MSFT': {
    symbol: 'MSFT',
    price: {
      regularMarketPrice: 407.75,
      regularMarketChange: 3.21,
      regularMarketChangePercent: 0.79,
      regularMarketPreviousClose: 404.54,
      regularMarketOpen: 405.32,
      regularMarketDayHigh: 408.93,
      regularMarketDayLow: 403.12,
    },
    marketState: 'REGULAR',
    shortName: 'Microsoft Corporation',
    longName: 'Microsoft Corporation',
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date().toISOString(),
  },
  'AMZN': {
    symbol: 'AMZN',
    price: {
      regularMarketPrice: 178.45,
      regularMarketChange: -1.32,
      regularMarketChangePercent: -0.73,
      regularMarketPreviousClose: 179.77,
      regularMarketOpen: 179.50,
      regularMarketDayHigh: 180.12,
      regularMarketDayLow: 177.89,
    },
    marketState: 'REGULAR',
    shortName: 'Amazon.com, Inc.',
    longName: 'Amazon.com, Inc.',
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date().toISOString(),
  }
};

/**
 * 모의 과거 데이터 생성
 */
const generateMockHistoricalData = (symbol: string, days: number): HistoricalData => {
  const data: HistoricalDataItem[] = [];
  const endDate = new Date();
  const basePrice = (MOCK_QUOTES[symbol]?.price.regularMarketPrice) || 100;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(endDate.getDate() - i);
    
    // 약간의 변동성 추가
    const volatility = 0.02; // 2%
    const changePercent = (Math.random() - 0.5) * volatility;
    const change = basePrice * changePercent;
    
    // 기준 가격에 누적 변화 적용
    const close = basePrice + (change * (days - i));
    const open = close - (Math.random() * 2 - 1);
    const high = Math.max(open, close) + (Math.random() * 2);
    const low = Math.min(open, close) - (Math.random() * 2);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      adjClose: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  
  return {
    symbol,
    interval: '1d',
    currency: MOCK_QUOTES[symbol]?.currency || 'USD',
    data,
    dataCount: data.length,
    firstDate: data[0]?.date || null,
    lastDate: data[data.length - 1]?.date || null,
  };
};

/**
 * 주식 데이터 서비스 클래스
 * 검색, 시세 조회, 과거 데이터 조회 기능 제공
 */
class StockService {
  // 캐시 만료 시간 (5분)
  private CACHE_EXPIRY = 5 * 60 * 1000;
  
  // 캐시 저장소
  private searchCache: SearchCache = {};
  private quoteCache: QuoteCache = {};
  
  // 개발 환경 여부
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * 종목 검색
   * @param query 검색어
   * @param limit 결과 제한 수
   * @param useCache 캐시 사용 여부
   * @returns 검색 결과
   */
  async searchStocks(
    query: string, 
    limit = 10, 
    useCache = true
  ): Promise<StockSearchResults> {
    // 빈 검색어 처리
    if (!query.trim()) {
      return { results: [], count: 0 };
    }
    
    // 캐시 확인
    const cacheKey = `${query.toLowerCase()}_${limit}`;
    const cachedResult = this.searchCache[cacheKey];
    const now = Date.now();
    
    if (useCache && cachedResult && (now - cachedResult.timestamp < this.CACHE_EXPIRY)) {
      return { 
        results: cachedResult.results,
        count: cachedResult.results.length 
      };
    }
    
    try {
      let results: StockSearchItem[] = [];
      
      // 개발 환경에서는 모의 데이터 사용
      if (this.isDevelopment) {
        console.log('개발 환경: 모의 검색 데이터 사용');
        
        // 모든 모의 데이터에서 검색어와 일치하는 결과 찾기
        const searchTerm = query.toLowerCase();
        const allResults: StockSearchItem[] = [];
        
        // 미리 정의된 키워드에서 검색
        if (MOCK_SEARCH_RESULTS[searchTerm]) {
          allResults.push(...MOCK_SEARCH_RESULTS[searchTerm]);
        }
        
        // 심볼 또는 이름으로 검색
        Object.values(MOCK_SEARCH_RESULTS).forEach(items => {
          items.forEach(item => {
            if (
              item.symbol.toLowerCase().includes(searchTerm) ||
              item.name.toLowerCase().includes(searchTerm)
            ) {
              // 중복 방지
              if (!allResults.some(r => r.symbol === item.symbol)) {
                allResults.push(item);
              }
            }
          });
        });
        
        results = allResults.slice(0, limit);
      } else {
        // 실제 API 호출
        const response = await yahooFinanceService.searchSymbols(query, limit);
        results = response.results.map(item => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchange,
          type: item.type
        }));
      }
      
      // 캐시 저장
      this.searchCache[cacheKey] = {
        results,
        timestamp: now
      };
      
      return {
        results,
        count: results.length
      };
    } catch (error) {
      console.error('종목 검색 오류:', error);
      throw new Error('종목 검색 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 종목 시세 조회
   * @param symbol 티커 심볼
   * @param useCache 캐시 사용 여부
   * @returns 종목 시세 정보
   */
  async getStockQuote(symbol: string, useCache = true): Promise<StockQuote> {
    if (!symbol) {
      throw new Error('종목 심볼이 필요합니다.');
    }
    
    // 캐시 확인
    const cachedQuote = this.quoteCache[symbol];
    const now = Date.now();
    
    if (useCache && cachedQuote && (now - cachedQuote.timestamp < this.CACHE_EXPIRY)) {
      return cachedQuote.data;
    }
    
    try {
      let quoteData: StockQuote;
      
      // 개발 환경에서는 모의 데이터 사용
      if (this.isDevelopment) {
        console.log('개발 환경: 모의 시세 데이터 사용');
        
        // 기본 모의 데이터에서 찾기
        if (MOCK_QUOTES[symbol]) {
          quoteData = {...MOCK_QUOTES[symbol], lastUpdated: new Date().toISOString()};
        } else {
          // 없으면 기본 데이터 생성
          quoteData = {
            symbol,
            price: {
              regularMarketPrice: 100 + Math.random() * 100,
              regularMarketChange: (Math.random() * 10) - 5,
              regularMarketChangePercent: (Math.random() * 5) - 2.5,
              regularMarketPreviousClose: 100 + Math.random() * 100,
              regularMarketOpen: 100 + Math.random() * 100,
              regularMarketDayHigh: 100 + Math.random() * 120,
              regularMarketDayLow: 100 + Math.random() * 80,
            },
            marketState: 'REGULAR',
            shortName: `${symbol} Inc.`,
            longName: `${symbol} Corporation`,
            currency: 'USD',
            exchange: 'MOCK',
            lastUpdated: new Date().toISOString(),
          };
        }
      } else {
        // 실제 API 호출
        const response = await yahooFinanceService.getQuotes(symbol);
        
        if (!response.quotes.length) {
          throw new Error(`${symbol} 종목 정보를 찾을 수 없습니다.`);
        }
        
        quoteData = response.quotes[0];
      }
      
      // 캐시 저장
      this.quoteCache[symbol] = {
        data: quoteData,
        timestamp: now
      };
      
      return quoteData;
    } catch (error) {
      console.error('종목 시세 조회 오류:', error);
      throw new Error('종목 시세 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 여러 종목 시세 동시 조회
   * @param symbols 티커 심볼 배열
   * @returns 종목 시세 정보 배열
   */
  async getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (!symbols.length) {
      return [];
    }
    
    try {
      // 개발 환경에서는 모의 데이터 사용
      if (this.isDevelopment) {
        console.log('개발 환경: 모의 다중 시세 데이터 사용');
        return Promise.all(symbols.map(symbol => this.getStockQuote(symbol)));
      }
      
      // 캐시된 데이터와 필요한 API 호출 분리
      const now = Date.now();
      const cachedResults: StockQuote[] = [];
      const symbolsToFetch: string[] = [];
      
      symbols.forEach(symbol => {
        const cachedQuote = this.quoteCache[symbol];
        
        if (cachedQuote && (now - cachedQuote.timestamp < this.CACHE_EXPIRY)) {
          cachedResults.push(cachedQuote.data);
        } else {
          symbolsToFetch.push(symbol);
        }
      });
      
      // 필요한 데이터만 API 호출
      if (symbolsToFetch.length > 0) {
        const response = await yahooFinanceService.getQuotes(symbolsToFetch);
        
        // 새 결과 캐싱
        response.quotes.forEach(quote => {
          this.quoteCache[quote.symbol] = {
            data: quote,
            timestamp: now
          };
        });
        
        return [...cachedResults, ...response.quotes];
      }
      
      return cachedResults;
    } catch (error) {
      console.error('다중 종목 시세 조회 오류:', error);
      throw new Error('다중 종목 시세 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 과거 주가 데이터 조회
   * @param symbol 티커 심볼
   * @param interval 데이터 간격
   * @param period1 시작일
   * @param period2 종료일
   * @returns 과거 주가 데이터
   */
  async getHistoricalData(
    symbol: string,
    interval = '1d',
    period1?: Date | string,
    period2?: Date | string
  ): Promise<HistoricalData> {
    if (!symbol) {
      throw new Error('종목 심볼이 필요합니다.');
    }
    
    try {
      // 개발 환경에서는 모의 데이터 사용
      if (this.isDevelopment) {
        console.log('개발 환경: 모의 과거 데이터 사용');
        
        // 기간 계산
        const endDate = period2 ? new Date(period2) : new Date();
        const startDate = period1 ? new Date(period1) : new Date();
        const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return generateMockHistoricalData(symbol, days > 0 ? days : 30);
      }
      
      // 실제 API 호출
      return await yahooFinanceService.getHistoricalData(
        symbol,
        interval,
        period1,
        period2
      );
    } catch (error) {
      console.error('과거 데이터 조회 오류:', error);
      throw new Error('과거 주가 데이터 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 캐시 클리어
   * @param type 클리어할 캐시 유형 ('search', 'quote', 'all')
   */
  clearCache(type: 'search' | 'quote' | 'all' = 'all'): void {
    if (type === 'search' || type === 'all') {
      this.searchCache = {};
    }
    
    if (type === 'quote' || type === 'all') {
      this.quoteCache = {};
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const stockService = new StockService();
export default stockService; 