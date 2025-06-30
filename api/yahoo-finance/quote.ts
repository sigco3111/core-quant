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
 * 실시간 시세 API 핸들러
 * 종목 티커를 통해 최신 시세 데이터 제공
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
    // CORS 및 캐시 헤더 설정 (시세 데이터는 1분만 캐싱)
    setCorsHeaders(res);
    setCacheHeaders(res, 60);
    
    // Rate Limiting 적용
    const isAllowed = await rateLimitRequest(req);
    if (!isAllowed) {
      res.status(429).json({ success: false, error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
      return;
    }
    
    // 필수 매개변수 검증
    const validationError = validateRequiredParams(req, ['symbol']);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }
    
    // 매개변수 추출
    const symbols = String(req.query.symbol).split(',');
    
    if (symbols.length === 0) {
      res.status(400).json({ success: false, error: '유효한 종목 티커를 입력해주세요.' });
      return;
    }
    
    if (symbols.length > 20) {
      res.status(400).json({ success: false, error: '한 번에 최대 20개의 종목만 조회할 수 있습니다.' });
      return;
    }
    
    // 종목 티커가 유효한지 검증
    for (const symbol of symbols) {
      if (!/^[A-Za-z0-9.^-]{1,30}$/.test(symbol)) {
        res.status(400).json({ success: false, error: `잘못된 종목 티커 형식: ${symbol}` });
        return;
      }
    }
    
    console.log(`Yahoo Finance 시세 요청: 종목=${symbols.join(',')}`);
    
    // Yahoo Finance API를 통해 시세 데이터 조회
    const quotes = await yahooFinance.quote(symbols);
    
    // 결과가 배열이 아닌 경우 (단일 종목) 배열로 변환
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    
    // 필요한 데이터만 추출하여 반환
    const formattedQuotes = quotesArray.map((quote: any) => ({
      symbol: quote.symbol,
      price: {
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        regularMarketPreviousClose: quote.regularMarketPreviousClose,
        regularMarketOpen: quote.regularMarketOpen,
        regularMarketDayHigh: quote.regularMarketDayHigh,
        regularMarketDayLow: quote.regularMarketDayLow,
      },
      marketState: quote.marketState,
      shortName: quote.shortName || quote.longName || '',
      longName: quote.longName || quote.shortName || '',
      currency: quote.currency,
      exchange: quote.fullExchangeName || quote.exchange || '',
      lastUpdated: new Date().toISOString()
    }));
    
    // 결과 반환
    res.status(200).json(createSuccessResponse({
      quotes: formattedQuotes,
      count: formattedQuotes.length
    }));
    
  } catch (error) {
    // 오류 처리 - 특정 종목이 존재하지 않는 경우 404 오류 반환
    if (error instanceof Error && error.message.includes('Not Found')) {
      handleError(res, '해당 종목을 찾을 수 없습니다. 유효한 티커인지 확인해주세요.', 404);
    } else {
      handleError(res, error);
    }
  }
} 