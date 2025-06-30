import { VercelRequest, VercelResponse } from '@vercel/node';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Rate Limiter 설정
 * IP 기반으로 요청 제한을 적용하는 인스턴스
 */
const rateLimiter = new RateLimiterMemory({
  points: 30, // 요청 포인트 수
  duration: 60, // 1분 기준
  blockDuration: 60 * 10 // 제한 초과 시 차단 시간 (10분)
});

/**
 * 응답 형태 타입 정의
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Rate Limiting 미들웨어
 * IP 기반으로 요청 빈도를 제한하는 함수
 */
export async function rateLimitRequest(req: VercelRequest): Promise<boolean> {
  try {
    // IP 주소 가져오기
    const ipAddr = req.headers['x-forwarded-for'] || 
                   req.socket.remoteAddress || 
                   'unknown';
                   
    // 문자열로 변환
    const ip = Array.isArray(ipAddr) ? ipAddr[0] : String(ipAddr);
    
    // Rate Limiter 적용
    await rateLimiter.consume(ip);
    return true;
  } catch (error) {
    // 요청 한도 초과
    return false;
  }
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now()
  };
}

/**
 * 오류 응답 생성
 */
export function createErrorResponse(error: string): ApiResponse {
  return {
    success: false,
    error,
    timestamp: Date.now()
  };
}

/**
 * 오류 처리 함수
 * API 응답으로 적절한 오류 메시지와 상태 코드 반환
 */
export function handleError(res: VercelResponse, error: any, statusCode = 500): void {
  console.error('Yahoo Finance API Error:', error);
  
  // 오류 메시지 결정
  let errorMessage = '알 수 없는 오류가 발생했습니다.';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  // HTTP 상태 코드 설정
  res.status(statusCode).json(createErrorResponse(errorMessage));
}

/**
 * 요청 매개변수 검증
 * 필수 매개변수가 있는지 확인
 */
export function validateRequiredParams(req: VercelRequest, params: string[]): string | null {
  for (const param of params) {
    if (!req.query[param]) {
      return `${param} 매개변수는 필수입니다.`;
    }
  }
  return null;
}

/**
 * CORS 헤더 설정
 */
export function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * 캐시 헤더 설정
 * 데이터 종류에 따라 적절한 캐시 시간 설정
 */
export function setCacheHeaders(res: VercelResponse, cacheTime = 300): void {
  res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate=60`);
} 