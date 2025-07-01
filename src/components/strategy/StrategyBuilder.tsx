/**
 * 전략 빌더 컴포넌트
 * 전략 생성 및 수정을 위한 UI
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Textarea,
  useToast,
  VStack,
  HStack,
  Spinner,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { nanoid } from 'nanoid';

import ConditionBuilder from './ConditionBuilder';
import strategyService from '../../services/firebase/strategy-service';
import {
  Strategy,
  ConditionGroup,
  LogicalOperator,
  MoneyManagement,
  TradeRule,
  SignalType,
} from '../../types/strategy';

/**
 * 전략 빌더 컴포넌트
 */
const StrategyBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!id;
  
  // 상태 관리
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 전략 기본 정보
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  
  // 매수/매도 규칙
  const [buyRules, setBuyRules] = useState<TradeRule>({
    id: nanoid(),
    type: SignalType.BUY,
    conditionGroups: [],
    operator: 'AND',
  });
  
  const [sellRules, setSellRules] = useState<TradeRule>({
    id: nanoid(),
    type: SignalType.SELL,
    conditionGroups: [],
    operator: 'AND',
  });
  
  // 자금 관리 설정
  const [moneyManagement, setMoneyManagement] = useState<MoneyManagement>({
    initialCapital: 10000000, // 1천만원
    positionSizing: 20, // 20%
    maxPositions: 5,
    stopLoss: 5, // 5%
    takeProfit: 20, // 20%
  });
  
  // 사용자 ID (실제로는 인증 서비스에서 가져와야 함)
  // 임시로 고정값 사용
  const userId = 'current-user-id';
  
  /**
   * 전략 불러오기
   */
  useEffect(() => {
    if (isEditMode && id) {
      const fetchStrategy = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const strategy = await strategyService.getStrategy(id);
          
          if (!strategy) {
            setError('전략을 찾을 수 없습니다.');
            return;
          }
          
          // 전략 정보 설정
          setName(strategy.name);
          setDescription(strategy.description);
          setTags(strategy.tags || []);
          setIsPublic(strategy.isPublic);
          
          // 매수/매도 규칙 설정
          if (strategy.buyRules.length > 0) {
            setBuyRules(strategy.buyRules[0]);
          }
          
          if (strategy.sellRules.length > 0) {
            setSellRules(strategy.sellRules[0]);
          }
          
          // 자금 관리 설정
          setMoneyManagement(strategy.moneyManagement);
          
        } catch (err) {
          console.error('전략 불러오기 오류:', err);
          setError('전략을 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchStrategy();
    }
  }, [id, isEditMode]);
  
  /**
   * 매수 규칙 업데이트 핸들러
   */
  const handleBuyRulesChange = (
    conditionGroups: ConditionGroup[],
    operator: LogicalOperator
  ) => {
    setBuyRules({
      ...buyRules,
      conditionGroups,
      operator,
    });
  };
  
  /**
   * 매도 규칙 업데이트 핸들러
   */
  const handleSellRulesChange = (
    conditionGroups: ConditionGroup[],
    operator: LogicalOperator
  ) => {
    setSellRules({
      ...sellRules,
      conditionGroups,
      operator,
    });
  };
  
  /**
   * 자금 관리 설정 업데이트 핸들러
   */
  const handleMoneyManagementChange = (
    field: keyof MoneyManagement,
    value: number | undefined
  ) => {
    setMoneyManagement({
      ...moneyManagement,
      [field]: value,
    });
  };
  
  /**
   * 태그 추가 핸들러
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };
  
  /**
   * 태그 삭제 핸들러
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  
  /**
   * 태그 입력 엔터 키 핸들러
   */
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  /**
   * 전략 저장 핸들러
   */
  const handleSave = async () => {
    // 입력 검증
    if (!name.trim()) {
      toast({
        title: '전략 이름을 입력하세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (buyRules.conditionGroups.length === 0 || 
        buyRules.conditionGroups.some(g => g.conditions.length === 0)) {
      toast({
        title: '매수 조건을 설정하세요.',
        description: '최소 하나 이상의 매수 조건이 필요합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (sellRules.conditionGroups.length === 0 || 
        sellRules.conditionGroups.some(g => g.conditions.length === 0)) {
      toast({
        title: '매도 조건을 설정하세요.',
        description: '최소 하나 이상의 매도 조건이 필요합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const strategyData: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        description,
        userId,
        buyRules: [buyRules],
        sellRules: [sellRules],
        moneyManagement,
        isPublic,
        tags: tags.length > 0 ? tags : undefined,
      };
      
      if (isEditMode && id) {
        // 전략 수정
        await strategyService.updateStrategy(id, strategyData);
        
        toast({
          title: '전략 수정 완료',
          description: '전략이 성공적으로 수정되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // 새 전략 생성
        const newId = await strategyService.createStrategy(strategyData);
        
        toast({
          title: '전략 생성 완료',
          description: '새 전략이 성공적으로 생성되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // 편집 페이지로 이동 (선택적)
        // navigate(`/strategy/edit/${newId}`);
      }
      
      // 전략 목록 페이지로 이동
      navigate('/strategy');
      
    } catch (err) {
      console.error('전략 저장 오류:', err);
      
      toast({
        title: '오류 발생',
        description: '전략을 저장하는 중 문제가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  /**
   * 취소 핸들러
   */
  const handleCancel = () => {
    navigate('/strategy');
  };
  
  // 로딩 중 표시
  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="400px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  // 오류 표시
  if (error) {
    return (
      <Alert status="error" variant="solid" borderRadius="md">
        <AlertIcon />
        <AlertTitle mr={2}>오류 발생</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Container maxW="container.lg" py={6}>
      <Box mb={6}>
        <Flex alignItems="center" mb={4}>
          <IconButton
            aria-label="뒤로 가기"
            icon={<ArrowBackIcon />}
            mr={4}
            onClick={handleCancel}
          />
          <Heading size="lg">
            {isEditMode ? '전략 수정' : '새 전략 만들기'}
          </Heading>
        </Flex>
        
        {/* 기본 정보 */}
        <VStack spacing={4} align="stretch" mb={6}>
          <FormControl isRequired>
            <FormLabel>전략 이름</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="전략 이름을 입력하세요"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>설명</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="전략에 대한 설명을 입력하세요"
              rows={3}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>태그</FormLabel>
            <Box mb={2}>
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  size="md"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="blue"
                  mr={2}
                  mb={2}
                >
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                </Tag>
              ))}
            </Box>
            <InputGroup size="md">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="태그 입력 후 엔터"
                onKeyDown={handleTagKeyDown}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={handleAddTag}>
                  추가
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>
          
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="is-public" mb="0">
              공개 전략
            </FormLabel>
            <Switch
              id="is-public"
              isChecked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </FormControl>
        </VStack>
        
        <Divider my={6} />
        
        {/* 매수/매도 규칙 및 자금 관리 */}
        <Tabs isFitted variant="enclosed" colorScheme="blue">
          <TabList mb="1em">
            <Tab>매수 조건</Tab>
            <Tab>매도 조건</Tab>
            <Tab>자금 관리</Tab>
          </TabList>
          <TabPanels>
            {/* 매수 조건 탭 */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="md" mb={4}>매수 조건 설정</Heading>
                <ConditionBuilder
                  conditionGroups={buyRules.conditionGroups}
                  groupOperator={buyRules.operator}
                  onChange={handleBuyRulesChange}
                />
              </Box>
            </TabPanel>
            
            {/* 매도 조건 탭 */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="md" mb={4}>매도 조건 설정</Heading>
                <ConditionBuilder
                  conditionGroups={sellRules.conditionGroups}
                  groupOperator={sellRules.operator}
                  onChange={handleSellRulesChange}
                />
              </Box>
            </TabPanel>
            
            {/* 자금 관리 탭 */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="md" mb={4}>자금 관리 설정</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>초기 자본 (원)</FormLabel>
                    <NumberInput
                      value={moneyManagement.initialCapital}
                      onChange={(_, value) => handleMoneyManagementChange('initialCapital', value)}
                      min={100000}
                      step={100000}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>포지션 크기 (%)</FormLabel>
                    <NumberInput
                      value={moneyManagement.positionSizing}
                      onChange={(_, value) => handleMoneyManagementChange('positionSizing', value)}
                      min={1}
                      max={100}
                      step={1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      각 종목당 투자 비율
                    </Text>
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>최대 포지션 수</FormLabel>
                    <NumberInput
                      value={moneyManagement.maxPositions}
                      onChange={(_, value) => handleMoneyManagementChange('maxPositions', value)}
                      min={1}
                      max={50}
                      step={1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      동시에 보유할 수 있는 최대 종목 수
                    </Text>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>손절 비율 (%)</FormLabel>
                    <NumberInput
                      value={moneyManagement.stopLoss}
                      onChange={(_, value) => handleMoneyManagementChange('stopLoss', value)}
                      min={0}
                      max={100}
                      step={0.5}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      0으로 설정 시 손절 사용 안 함
                    </Text>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>익절 비율 (%)</FormLabel>
                    <NumberInput
                      value={moneyManagement.takeProfit}
                      onChange={(_, value) => handleMoneyManagementChange('takeProfit', value)}
                      min={0}
                      max={1000}
                      step={1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      0으로 설정 시 익절 사용 안 함
                    </Text>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>트레일링 스탑 (%)</FormLabel>
                    <NumberInput
                      value={moneyManagement.trailingStop ?? 0}
                      onChange={(_, value) => handleMoneyManagementChange('trailingStop', value)}
                      min={0}
                      max={100}
                      step={0.5}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      0으로 설정 시 트레일링 스탑 사용 안 함
                    </Text>
                  </FormControl>
                </VStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* 저장/취소 버튼 */}
        <Flex justifyContent="flex-end" mt={6}>
          <Button
            variant="outline"
            mr={3}
            onClick={handleCancel}
            isDisabled={saving}
          >
            취소
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={saving}
            loadingText="저장 중"
            leftIcon={<CheckIcon />}
          >
            {isEditMode ? '수정 완료' : '전략 생성'}
          </Button>
        </Flex>
      </Box>
    </Container>
  );
};

export default StrategyBuilder; 