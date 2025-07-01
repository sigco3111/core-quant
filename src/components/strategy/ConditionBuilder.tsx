/**
 * 전략 조건 빌더 컴포넌트
 * 전략의 매수/매도 조건을 설정하는 UI
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Text,
  VStack,
  Divider,
  Badge,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { nanoid } from 'nanoid';

import {
  ConditionGroup,
  StrategyCondition,
  IndicatorType,
  ComparisonOperator,
  LogicalOperator,
  PriceType,
  ConditionParameter,
  INDICATOR_DESCRIPTIONS,
} from '../../types/strategy';

/**
 * 조건 빌더 Props
 */
interface ConditionBuilderProps {
  conditionGroups: ConditionGroup[];
  groupOperator: LogicalOperator;
  onChange: (conditionGroups: ConditionGroup[], groupOperator: LogicalOperator) => void;
}

/**
 * 조건 파라미터 기본값
 */
const getDefaultParameters = (indicatorType: IndicatorType): ConditionParameter[] => {
  switch (indicatorType) {
    case IndicatorType.PRICE:
      return [
        { name: 'priceType', value: PriceType.CLOSE, options: Object.values(PriceType) },
      ];
    case IndicatorType.VOLUME:
      return [];
    case IndicatorType.MA:
      return [
        { name: 'period', value: 20, min: 1, max: 200, step: 1 },
        { name: 'priceType', value: PriceType.CLOSE, options: Object.values(PriceType) },
      ];
    case IndicatorType.EMA:
      return [
        { name: 'period', value: 12, min: 1, max: 200, step: 1 },
        { name: 'priceType', value: PriceType.CLOSE, options: Object.values(PriceType) },
      ];
    case IndicatorType.RSI:
      return [
        { name: 'period', value: 14, min: 1, max: 100, step: 1 },
      ];
    case IndicatorType.MACD:
      return [
        { name: 'fastPeriod', value: 12, min: 1, max: 100, step: 1 },
        { name: 'slowPeriod', value: 26, min: 1, max: 100, step: 1 },
        { name: 'signalPeriod', value: 9, min: 1, max: 100, step: 1 },
        { name: 'macdPart', value: 'macd', options: ['macd', 'signal', 'histogram'] },
      ];
    case IndicatorType.BOLLINGER:
      return [
        { name: 'period', value: 20, min: 1, max: 100, step: 1 },
        { name: 'stdDev', value: 2, min: 0.1, max: 10, step: 0.1 },
        { name: 'bandPart', value: 'upper', options: ['upper', 'middle', 'lower'] },
      ];
    case IndicatorType.STOCHASTIC:
      return [
        { name: 'kPeriod', value: 14, min: 1, max: 100, step: 1 },
        { name: 'dPeriod', value: 3, min: 1, max: 100, step: 1 },
        { name: 'slowing', value: 3, min: 1, max: 100, step: 1 },
        { name: 'stochPart', value: 'k', options: ['k', 'd'] },
      ];
    default:
      return [];
  }
};

/**
 * 조건 파라미터 컴포넌트 Props
 */
interface ParameterInputProps {
  parameter: ConditionParameter;
  onChange: (name: string, value: number | string) => void;
}

/**
 * 조건 파라미터 입력 컴포넌트
 */
const ParameterInput: React.FC<ParameterInputProps> = ({ parameter, onChange }) => {
  // 숫자 파라미터인 경우
  if (parameter.min !== undefined && parameter.max !== undefined) {
    return (
      <FormControl>
        <FormLabel fontSize="sm">{parameter.name}</FormLabel>
        <NumberInput
          size="sm"
          value={parameter.value as number}
          min={parameter.min}
          max={parameter.max}
          step={parameter.step || 1}
          onChange={(_, value) => onChange(parameter.name, value)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
    );
  }
  
  // 옵션 선택 파라미터인 경우
  if (parameter.options) {
    return (
      <FormControl>
        <FormLabel fontSize="sm">{parameter.name}</FormLabel>
        <Select
          size="sm"
          value={parameter.value as string}
          onChange={(e) => onChange(parameter.name, e.target.value)}
        >
          {parameter.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </FormControl>
    );
  }
  
  // 기본 텍스트 입력
  return (
    <FormControl>
      <FormLabel fontSize="sm">{parameter.name}</FormLabel>
      <Input
        size="sm"
        value={parameter.value as string}
        onChange={(e) => onChange(parameter.name, e.target.value)}
      />
    </FormControl>
  );
};

/**
 * 단일 조건 컴포넌트 Props
 */
interface ConditionItemProps {
  condition: StrategyCondition;
  onUpdate: (updatedCondition: StrategyCondition) => void;
  onDelete: () => void;
}

/**
 * 비교 대상 타입
 */
type ComparisonTargetType = 'value' | IndicatorType;

/**
 * 단일 조건 컴포넌트
 */
const ConditionItem: React.FC<ConditionItemProps> = ({ condition, onUpdate, onDelete }) => {
  /**
   * 지표 타입 변경 핸들러
   */
  const handleIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as IndicatorType;
    const newParameters = getDefaultParameters(newType);
    
    onUpdate({
      ...condition,
      type: newType,
      parameters: newParameters,
      valueType: undefined,
      valueParameters: undefined,
    });
  };
  
  /**
   * 비교 연산자 변경 핸들러
   */
  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({
      ...condition,
      operator: e.target.value as ComparisonOperator,
    });
  };
  
  /**
   * 비교값 타입 변경 핸들러
   */
  const handleValueTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValueType = e.target.value as ComparisonTargetType;
    
    if (newValueType !== 'value') {
      onUpdate({
        ...condition,
        valueType: newValueType as IndicatorType,
        valueParameters: getDefaultParameters(newValueType as IndicatorType),
        value: 0, // 지표 비교 시 값은 무시됨
      });
    } else {
      onUpdate({
        ...condition,
        valueType: undefined,
        valueParameters: undefined,
      });
    }
  };
  
  /**
   * 파라미터 변경 핸들러
   */
  const handleParameterChange = (name: string, value: number | string) => {
    const updatedParameters = condition.parameters.map((p) =>
      p.name === name ? { ...p, value } : p
    );
    
    onUpdate({
      ...condition,
      parameters: updatedParameters,
    });
  };
  
  /**
   * 비교값 파라미터 변경 핸들러
   */
  const handleValueParameterChange = (name: string, value: number | string) => {
    if (!condition.valueParameters) return;
    
    const updatedParameters = condition.valueParameters.map((p) =>
      p.name === name ? { ...p, value } : p
    );
    
    onUpdate({
      ...condition,
      valueParameters: updatedParameters,
    });
  };
  
  /**
   * 비교값 변경 핸들러
   */
  const handleValueChange = (value: number) => {
    onUpdate({
      ...condition,
      value,
    });
  };
  
  // 지표 설명 표시
  const indicatorDescription = condition.type ? INDICATOR_DESCRIPTIONS[condition.type] : '';
  
  return (
    <Box p={3} borderWidth="1px" borderRadius="md" bg="white">
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Tooltip label={indicatorDescription}>
          <Badge colorScheme="blue">{condition.type}</Badge>
        </Tooltip>
        <IconButton
          aria-label="삭제"
          icon={<DeleteIcon />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={onDelete}
        />
      </Flex>
      
      <VStack spacing={3} align="stretch">
        {/* 지표 선택 */}
        <FormControl>
          <FormLabel fontSize="sm">지표</FormLabel>
          <Select
            value={condition.type}
            onChange={handleIndicatorChange}
            size="sm"
          >
            {Object.values(IndicatorType).map((type) => (
              <option key={type} value={type}>
                {type} - {INDICATOR_DESCRIPTIONS[type]}
              </option>
            ))}
          </Select>
        </FormControl>
        
        {/* 지표 파라미터 */}
        {condition.parameters.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              파라미터
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              {condition.parameters.map((param) => (
                <Box key={param.name} minW="120px">
                  <ParameterInput
                    parameter={param}
                    onChange={handleParameterChange}
                  />
                </Box>
              ))}
            </HStack>
          </Box>
        )}
        
        {/* 비교 연산자 */}
        <FormControl>
          <FormLabel fontSize="sm">연산자</FormLabel>
          <Select
            value={condition.operator}
            onChange={handleOperatorChange}
            size="sm"
          >
            <option value=">">{'>'} (초과)</option>
            <option value=">=">{'≥'} (이상)</option>
            <option value="=">=</option>
            <option value="<=">{'≤'} (이하)</option>
            <option value="<">{'<'} (미만)</option>
            <option value="!=">{'≠'} (같지 않음)</option>
          </Select>
        </FormControl>
        
        {/* 비교 대상 선택 (값 또는 다른 지표) */}
        <FormControl>
          <FormLabel fontSize="sm">비교 대상</FormLabel>
          <Select
            value={condition.valueType || 'value'}
            onChange={handleValueTypeChange}
            size="sm"
          >
            <option value="value">값</option>
            {Object.values(IndicatorType).map((type) => (
              <option key={type} value={type}>
                {type} - {INDICATOR_DESCRIPTIONS[type]}
              </option>
            ))}
          </Select>
        </FormControl>
        
        {/* 비교값 또는 비교 지표 파라미터 */}
        {condition.valueType ? (
          // 지표와 비교하는 경우
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              비교 지표 파라미터
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              {condition.valueParameters?.map((param) => (
                <Box key={param.name} minW="120px">
                  <ParameterInput
                    parameter={param}
                    onChange={handleValueParameterChange}
                  />
                </Box>
              ))}
            </HStack>
          </Box>
        ) : (
          // 값과 비교하는 경우
          <FormControl>
            <FormLabel fontSize="sm">비교값</FormLabel>
            <NumberInput
              value={condition.value}
              onChange={(_, value) => handleValueChange(value)}
              size="sm"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        )}
      </VStack>
    </Box>
  );
};

/**
 * 조건 그룹 컴포넌트 Props
 */
interface ConditionGroupComponentProps {
  group: ConditionGroup;
  onUpdate: (updatedGroup: ConditionGroup) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * 조건 그룹 컴포넌트
 */
const ConditionGroupComponent: React.FC<ConditionGroupComponentProps> = ({
  group,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  /**
   * 조건 추가 핸들러
   */
  const handleAddCondition = () => {
    const newCondition: StrategyCondition = {
      id: nanoid(),
      type: IndicatorType.PRICE,
      parameters: getDefaultParameters(IndicatorType.PRICE),
      operator: '>',
      value: 0,
    };
    
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };
  
  /**
   * 조건 업데이트 핸들러
   */
  const handleUpdateCondition = (id: string, updatedCondition: StrategyCondition) => {
    onUpdate({
      ...group,
      conditions: group.conditions.map((c) =>
        c.id === id ? updatedCondition : c
      ),
    });
  };
  
  /**
   * 조건 삭제 핸들러
   */
  const handleDeleteCondition = (id: string) => {
    onUpdate({
      ...group,
      conditions: group.conditions.filter((c) => c.id !== id),
    });
  };
  
  /**
   * 논리 연산자 변경 핸들러
   */
  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({
      ...group,
      operator: e.target.value as LogicalOperator,
    });
  };
  
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50" position="relative">
      {/* 그룹 제어 버튼 */}
      <Flex justifyContent="space-between" mb={3}>
        <HStack>
          <FormControl maxW="100px">
            <Select
              size="sm"
              value={group.operator}
              onChange={handleOperatorChange}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </Select>
          </FormControl>
          <Text fontSize="sm" fontWeight="medium">
            조건 그룹
          </Text>
        </HStack>
        
        <HStack>
          <IconButton
            aria-label="위로 이동"
            icon={<ChevronUpIcon />}
            size="sm"
            isDisabled={isFirst}
            onClick={onMoveUp}
          />
          <IconButton
            aria-label="아래로 이동"
            icon={<ChevronDownIcon />}
            size="sm"
            isDisabled={isLast}
            onClick={onMoveDown}
          />
          <IconButton
            aria-label="삭제"
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            onClick={onDelete}
          />
        </HStack>
      </Flex>
      
      {/* 조건 목록 */}
      <VStack spacing={3} align="stretch">
        {group.conditions.length === 0 ? (
          <Box textAlign="center" p={4} borderWidth="1px" borderRadius="md" bg="white">
            <Text color="gray.500">조건이 없습니다. 조건을 추가하세요.</Text>
          </Box>
        ) : (
          group.conditions.map((condition, index) => (
            <ConditionItem
              key={condition.id}
              condition={condition}
              onUpdate={(updatedCondition) =>
                handleUpdateCondition(condition.id, updatedCondition)
              }
              onDelete={() => handleDeleteCondition(condition.id)}
            />
          ))
        )}
      </VStack>
      
      {/* 조건 추가 버튼 */}
      <Button
        leftIcon={<AddIcon />}
        size="sm"
        mt={3}
        onClick={handleAddCondition}
      >
        조건 추가
      </Button>
    </Box>
  );
};

/**
 * 조건 빌더 컴포넌트
 */
const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditionGroups,
  groupOperator,
  onChange,
}) => {
  const toast = useToast();
  
  /**
   * 그룹 추가 핸들러
   */
  const handleAddGroup = () => {
    const newGroup: ConditionGroup = {
      id: nanoid(),
      conditions: [],
      operator: 'AND',
    };
    
    onChange([...conditionGroups, newGroup], groupOperator);
  };
  
  /**
   * 그룹 업데이트 핸들러
   */
  const handleUpdateGroup = (id: string, updatedGroup: ConditionGroup) => {
    onChange(
      conditionGroups.map((g) => (g.id === id ? updatedGroup : g)),
      groupOperator
    );
  };
  
  /**
   * 그룹 삭제 핸들러
   */
  const handleDeleteGroup = (id: string) => {
    // 마지막 그룹은 삭제 불가
    if (conditionGroups.length <= 1) {
      toast({
        title: '그룹 삭제 불가',
        description: '최소 하나의 조건 그룹이 필요합니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    onChange(
      conditionGroups.filter((g) => g.id !== id),
      groupOperator
    );
  };
  
  /**
   * 그룹 위로 이동 핸들러
   */
  const handleMoveGroupUp = (index: number) => {
    if (index <= 0) return;
    
    const newGroups = [...conditionGroups];
    [newGroups[index - 1], newGroups[index]] = [newGroups[index], newGroups[index - 1]];
    
    onChange(newGroups, groupOperator);
  };
  
  /**
   * 그룹 아래로 이동 핸들러
   */
  const handleMoveGroupDown = (index: number) => {
    if (index >= conditionGroups.length - 1) return;
    
    const newGroups = [...conditionGroups];
    [newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]];
    
    onChange(newGroups, groupOperator);
  };
  
  /**
   * 그룹 간 논리 연산자 변경 핸들러
   */
  const handleGroupOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(conditionGroups, e.target.value as LogicalOperator);
  };
  
  // 컴포넌트 마운트 시 빈 조건 그룹 생성
  useEffect(() => {
    if (conditionGroups.length === 0) {
      handleAddGroup();
    }
  }, []);
  
  return (
    <Box>
      {/* 그룹 간 논리 연산자 */}
      {conditionGroups.length > 1 && (
        <Flex justifyContent="center" mb={4}>
          <FormControl maxW="150px">
            <FormLabel textAlign="center">그룹 간 연산자</FormLabel>
            <Select value={groupOperator} onChange={handleGroupOperatorChange}>
              <option value="AND">AND (모두 만족)</option>
              <option value="OR">OR (하나라도 만족)</option>
            </Select>
          </FormControl>
        </Flex>
      )}
      
      {/* 조건 그룹 목록 */}
      <VStack spacing={4} align="stretch">
        {conditionGroups.map((group, index) => (
          <React.Fragment key={group.id}>
            {index > 0 && (
              <Flex justifyContent="center" alignItems="center" py={1}>
                <Divider flex="1" />
                <Text mx={2} fontWeight="bold" color="gray.500">
                  {groupOperator}
                </Text>
                <Divider flex="1" />
              </Flex>
            )}
            
            <ConditionGroupComponent
              group={group}
              onUpdate={(updatedGroup) => handleUpdateGroup(group.id, updatedGroup)}
              onDelete={() => handleDeleteGroup(group.id)}
              onMoveUp={() => handleMoveGroupUp(index)}
              onMoveDown={() => handleMoveGroupDown(index)}
              isFirst={index === 0}
              isLast={index === conditionGroups.length - 1}
            />
          </React.Fragment>
        ))}
      </VStack>
      
      {/* 그룹 추가 버튼 */}
      <Button
        leftIcon={<AddIcon />}
        mt={4}
        onClick={handleAddGroup}
      >
        조건 그룹 추가
      </Button>
    </Box>
  );
};

export default ConditionBuilder; 