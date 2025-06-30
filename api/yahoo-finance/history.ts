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
 * 과거 데이터 조회 API 핸들러
 * 종목의 과거 가격 및 거래량 데이터 제공
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
    // CORS 및 캐시 헤더 설정 (과거 데이터는 더 오래 캐싱)
    setCorsHeaders(res);
    setCacheHeaders(res, 3600 * 24); // 24시간 캐싱
    
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
    const symbol = String(req.query.symbol);
    const period1 = req.query.period1 ? String(req.query.period1) : undefined;
    const period2 = req.query.period2 ? String(req.query.period2) : undefined;
    const interval = String(req.query.interval || '1d');
    
    // 종목 티커가 유효한지 검증
    if (!/^[A-Za-z0-9.^-]{1,30}$/.test(symbol)) {
      res.status(400).json({ success: false, error: '잘못된 종목 티커 형식' });
      return;
    }
    
    // 간격 검증 (Yahoo Finance 허용 값만)
    const allowedIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'];
    if (!allowedIntervals.includes(interval)) {
      res.status(400).json({ 
        success: false, 
        error: `잘못된 간격 값. 허용된 값: ${allowedIntervals.join(', ')}` 
      });
      return;
    }
    
    console.log(`Yahoo Finance 과거 데이터 요청: 종목=${symbol}, 간격=${interval}, 시작=${period1 || 'default'}, 종료=${period2 || 'default'}`);
    
    // 옵션 객체 생성
    const options: any = { interval };
    
    // 선택적 매개변수 추가
    if (period1) options.period1 = period1;
    if (period2) options.period2 = period2;
    
    // Yahoo Finance API를 통해 과거 데이터 조회
    const result = await yahooFinance.historical(symbol, options);
    
    // 결과 포맷팅 (일부 필드 이름 변경 및 정리)
    const formattedData = result.map((item: any) => ({
      date: item.date.toISOString().split('T')[0], // YYYY-MM-DD 형식으로
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      adjClose: item.adjClose,
      volume: item.volume
    }));
    
    // 결과 반환
    res.status(200).json(createSuccessResponse({
      symbol,
      interval,
      currency: 'USD', // Yahoo Finance는 기본적으로 USD 반환
      data: formattedData,
      dataCount: formattedData.length,
      firstDate: formattedData.length > 0 ? formattedData[0].date : null,
      lastDate: formattedData.length > 0 ? formattedData[formattedData.length - 1].date : null
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