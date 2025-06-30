/**
 * 주식 관련 타입 정의
 */

// 검색 결과 종목 타입
export interface StockSearchItem {
  symbol: string;     // 티커 심볼
  name: string;       // 회사/종목명
  exchange?: string;  // 거래소
  type?: string;      // 종목 타입 (주식, ETF 등)
}

// 검색 결과 목록 타입
export interface StockSearchResults {
  results: StockSearchItem[];
  count: number;
}

// 주가 정보 타입
export interface StockQuote {
  symbol: string;
  price: {
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketPreviousClose: number;
    regularMarketOpen: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
  };
  marketState: string;
  shortName: string;
  longName: string;
  currency: string;
  exchange: string;
  lastUpdated: string;
}

// 과거 주가 데이터 항목 타입
export interface HistoricalDataItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

// 과거 주가 데이터 응답 타입
export interface HistoricalData {
  symbol: string;
  interval: string;
  currency: string;
  data: HistoricalDataItem[];
  dataCount: number;
  firstDate: string | null;
  lastDate: string | null;
} 