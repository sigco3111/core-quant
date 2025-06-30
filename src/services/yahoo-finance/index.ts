/**
 * Yahoo Finance API 서비스
 * 프록시 API를 통해 Yahoo Finance 데이터 접근
 */

/**
 * 검색 결과 항목 타입
 */
export interface SearchResultItem {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

/**
 * 검색 응답 타입
 */
export interface SearchResponse {
  results: SearchResultItem[];
  count: number;
  query: string;
  region: string;
}

/**
 * 시세 데이터 타입
 */
export interface QuoteData {
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

/**
 * 시세 응답 타입
 */
export interface QuoteResponse {
  quotes: QuoteData[];
  count: number;
}

/**
 * 과거 데이터 항목 타입
 */
export interface HistoricalDataItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

/**
 * 과거 데이터 응답 타입
 */
export interface HistoricalDataResponse {
  symbol: string;
  interval: string;
  currency: string;
  data: HistoricalDataItem[];
  dataCount: number;
  firstDate: string | null;
  lastDate: string | null;
}

/**
 * API 응답 공통 타입
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Yahoo Finance API 서비스 클래스
 */
class YahooFinanceService {
  private baseUrl: string;
  
  /**
   * 생성자
   * @param baseUrl 프록시 API 기본 URL
   */
  constructor(baseUrl = '/api/yahoo-finance') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * API 호출 공통 메서드
   * 오류 처리 및 응답 파싱
   */
  private async callApi<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      // URL 쿼리 파라미터 생성
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const url = `${this.baseUrl}/${endpoint}?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // HTTP 오류 처리
        const errorText = await response.text();
        let errorMessage = `API 요청 실패 (${response.status})`;
        
        try {
          // 에러 응답 파싱 시도
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (e) {
          // 파싱 실패 시 원본 텍스트 사용
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json() as ApiResponse<T>;
      
      if (!result.success) {
        throw new Error(result.error || '알 수 없는 오류');
      }
      
      return result.data as T;
    } catch (error) {
      console.error('Yahoo Finance API 오류:', error);
      throw error;
    }
  }
  
  /**
   * 종목 검색
   * 키워드로 주식, ETF 등 검색
   */
  async searchSymbols(query: string, limit = 10, region = 'US'): Promise<SearchResponse> {
    return this.callApi<SearchResponse>('search', { query, limit, region });
  }
  
  /**
   * 실시간 시세 조회
   * 종목 티커로 최신 시세 정보 조회
   */
  async getQuotes(symbols: string | string[]): Promise<QuoteResponse> {
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    return this.callApi<QuoteResponse>('quote', { symbol: symbolParam });
  }
  
  /**
   * 과거 데이터 조회
   * 종목의 과거 가격 및 거래량 조회
   */
  async getHistoricalData(
    symbol: string, 
    interval = '1d', 
    period1?: string | Date, 
    period2?: string | Date
  ): Promise<HistoricalDataResponse> {
    // 날짜 객체를 문자열로 변환
    const formatDate = (date?: string | Date): string | undefined => {
      if (!date) return undefined;
      
      if (date instanceof Date) {
        // ISO 문자열로 변환 후 날짜 부분만 추출
        return date.toISOString().split('T')[0];
      }
      
      return date;
    };
    
    return this.callApi<HistoricalDataResponse>('history', {
      symbol,
      interval,
      period1: formatDate(period1),
      period2: formatDate(period2)
    });
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const yahooFinanceService = new YahooFinanceService();
export default yahooFinanceService; 