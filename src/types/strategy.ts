/**
 * 전략 관련 타입 정의
 */

/**
 * 비교 연산자 타입
 */
export type ComparisonOperator = '>' | '>=' | '=' | '<=' | '<' | '!=';

/**
 * 논리 연산자 타입
 */
export type LogicalOperator = 'AND' | 'OR';

/**
 * 기술 지표 타입
 */
export enum IndicatorType {
  PRICE = 'PRICE',           // 가격
  VOLUME = 'VOLUME',         // 거래량
  MA = 'MA',                 // 이동평균선
  EMA = 'EMA',               // 지수이동평균선
  RSI = 'RSI',               // 상대강도지수
  MACD = 'MACD',             // MACD
  BOLLINGER = 'BOLLINGER',   // 볼린저밴드
  STOCHASTIC = 'STOCHASTIC', // 스토캐스틱
  OBV = 'OBV',               // OBV (On-Balance Volume)
  ATR = 'ATR',               // 평균진폭(Average True Range)
}

/**
 * 가격 타입
 */
export enum PriceType {
  OPEN = 'OPEN',       // 시가
  HIGH = 'HIGH',       // 고가
  LOW = 'LOW',         // 저가
  CLOSE = 'CLOSE',     // 종가
  ADJ_CLOSE = 'ADJ_CLOSE', // 수정종가
}

/**
 * 기간 단위 타입
 */
export enum PeriodUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

/**
 * 전략 조건 파라미터 타입
 */
export interface ConditionParameter {
  name: string;
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

/**
 * 전략 조건 타입
 */
export interface StrategyCondition {
  id: string;
  type: IndicatorType;
  parameters: ConditionParameter[];
  operator: ComparisonOperator;
  value: number;
  valueType?: IndicatorType;  // 비교 대상이 다른 지표인 경우 (예: MA(10) > MA(20))
  valueParameters?: ConditionParameter[]; // 비교 대상의 파라미터
}

/**
 * 조건 그룹 타입
 */
export interface ConditionGroup {
  id: string;
  conditions: StrategyCondition[];
  operator: LogicalOperator;
}

/**
 * 매매 신호 타입
 */
export enum SignalType {
  BUY = 'BUY',   // 매수
  SELL = 'SELL', // 매도
}

/**
 * 매매 규칙 타입
 */
export interface TradeRule {
  id: string;
  type: SignalType;
  conditionGroups: ConditionGroup[];
  operator: LogicalOperator;
}

/**
 * 자금 관리 설정 타입
 */
export interface MoneyManagement {
  initialCapital: number;     // 초기 자본
  positionSizing: number;     // 포지션 크기 (%)
  maxPositions: number;       // 최대 포지션 수
  stopLoss?: number;          // 손절 비율 (%)
  takeProfit?: number;        // 익절 비율 (%)
  trailingStop?: number;      // 트레일링 스탑 (%)
}

/**
 * 전략 타입
 */
export interface Strategy {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  buyRules: TradeRule[];
  sellRules: TradeRule[];
  moneyManagement: MoneyManagement;
  isPublic: boolean;
  tags?: string[];
}

/**
 * 전략 목록 항목 타입 (간소화된 전략 정보)
 */
export interface StrategyListItem {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  isPublic: boolean;
  tags?: string[];
}

/**
 * 전략 필터 타입
 */
export interface StrategyFilter {
  searchTerm?: string;
  tags?: string[];
  isPublic?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 기술 지표 설명
 */
export const INDICATOR_DESCRIPTIONS: Record<IndicatorType, string> = {
  [IndicatorType.PRICE]: '가격 (시가, 고가, 저가, 종가)',
  [IndicatorType.VOLUME]: '거래량',
  [IndicatorType.MA]: '이동평균선 (Moving Average)',
  [IndicatorType.EMA]: '지수이동평균선 (Exponential Moving Average)',
  [IndicatorType.RSI]: '상대강도지수 (Relative Strength Index)',
  [IndicatorType.MACD]: 'MACD (Moving Average Convergence Divergence)',
  [IndicatorType.BOLLINGER]: '볼린저밴드 (Bollinger Bands)',
  [IndicatorType.STOCHASTIC]: '스토캐스틱 (Stochastic)',
  [IndicatorType.OBV]: 'OBV (On-Balance Volume)',
  [IndicatorType.ATR]: '평균진폭 (Average True Range)',
}; 