import { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';
import { 
  rateLimitRequest, 
  setCorsHeaders, 
  setCacheHeaders, 
  handleError, 
  createSuccessResponse, 
  validateRequiredParams
} from './utils';

/**
 * 검색 결과 항목 타입 정의
 */
interface SearchResultItem {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

/**
 * 종목 검색 API 핸들러
 * 키워드로 주식, ETF 등을 검색하는 기능 제공
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // OPTIONS 요청 처리 (CORS)
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }
  
  // GET 요청만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: '허용되지 않는 메소드입니다.' });
    return;
  }
  
  try {
    // CORS 및 캐시 헤더 설정
    setCorsHeaders(res);
    setCacheHeaders(res, 3600); // 검색 결과는 1시간 캐싱
    
    // Rate Limiting 적용
    const isAllowed = await rateLimitRequest(req);
    if (!isAllowed) {
      res.status(429).json({ success: false, error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
      return;
    }
    
    // 필수 매개변수 검증
    const validationError = validateRequiredParams(req, ['query']);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }
    
    // 검색 쿼리 파라미터 추출
    const query = String(req.query.query);
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
    const region = String(req.query.region || 'US');
    
    // 검색어가 너무 짧은 경우
    if (query.length < 2) {
      res.status(400).json({ success: false, error: '검색어는 최소 2자 이상이어야 합니다.' });
      return;
    }
    
    // Yahoo Finance API로 검색
    console.log(`Yahoo Finance 검색 요청: 키워드=${query}, 지역=${region}, 한도=${limit}`);
    const searchResults = await yahooFinance.search(query, {
      quotesCount: limit,
      newsCount: 0,
      enableFuzzyQuery: true,
      enableEnhancedTrivialQuery: true
    });
    
    // 결과 포맷팅
    const formattedResults: SearchResultItem[] = [];
    
    if (searchResults.quotes && searchResults.quotes.length > 0) {
      // 각 검색 결과에 대해 안전하게 처리
      for (const quote of searchResults.quotes) {
        try {
          // quote를 any로 타입 단언하여 속성에 접근
          const q = quote as any;
          
          if (q && typeof q === 'object') {
            const item: SearchResultItem = {
              symbol: q.symbol || '',
              name: q.shortname || q.longname || q.name || ''
            };
            
            // 선택적 속성 추가
            if (q.exchange) item.exchange = q.exchange;
            if (q.quoteType) item.type = q.quoteType;
            
            // 필수 속성이 있는 경우만 추가
            if (item.symbol && item.name) {
              formattedResults.push(item);
            }
          }
        } catch (err) {
          console.error('결과 처리 중 오류:', err);
          // 개별 항목 처리 오류는 무시하고 계속 진행
          continue;
        }
      }
    }
    
    // 결과 반환
    res.status(200).json(createSuccessResponse({
      results: formattedResults,
      count: formattedResults.length,
      query,
      region
    }));
    
  } catch (error) {
    // 오류 처리
    handleError(res, error);
  }
} 