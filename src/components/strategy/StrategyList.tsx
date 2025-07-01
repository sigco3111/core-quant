/**
 * 전략 목록 컴포넌트
 * 사용자의 전략 목록을 표시하고 관리하는 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Tag,
  Text,
  useToast,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, ChevronDownIcon, DeleteIcon, EditIcon, CopyIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { DocumentSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import strategyService from '../../services/firebase/strategy-service';
import { StrategyListItem, StrategyFilter } from '../../types/strategy';

/**
 * 전략 카드 컴포넌트 Props
 */
interface StrategyCardProps {
  strategy: StrategyListItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClone: (id: string) => void;
  onVisibilityToggle: (id: string, isPublic: boolean) => void;
}

/**
 * 전략 카드 컴포넌트
 * 개별 전략 정보를 카드 형태로 표시
 */
const StrategyCard: React.FC<StrategyCardProps> = ({ 
  strategy, 
  onEdit, 
  onDelete, 
  onClone,
  onVisibilityToggle 
}) => {
  const navigate = useNavigate();
  
  // 날짜 포맷 함수
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // 전략 상세 페이지로 이동
  const handleClick = () => {
    navigate(`/strategy/${strategy.id}`);
  };
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      p={4} 
      cursor="pointer" 
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      position="relative"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Heading size="md" onClick={handleClick} isTruncated>{strategy.name}</Heading>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<ChevronDownIcon />}
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList onClick={(e) => e.stopPropagation()}>
            <MenuItem icon={<EditIcon />} onClick={() => onEdit(strategy.id)}>
              편집
            </MenuItem>
            <MenuItem icon={<CopyIcon />} onClick={() => onClone(strategy.id)}>
              복제
            </MenuItem>
            <MenuItem 
              icon={strategy.isPublic ? <LockIcon /> : <UnlockIcon />}
              onClick={() => onVisibilityToggle(strategy.id, !strategy.isPublic)}
            >
              {strategy.isPublic ? '비공개로 전환' : '공개로 전환'}
            </MenuItem>
            <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => onDelete(strategy.id)}>
              삭제
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      
      <Text fontSize="sm" color="gray.600" mb={3} noOfLines={2}>
        {strategy.description || '설명 없음'}
      </Text>
      
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="xs" color="gray.500">
          {formatDate(strategy.updatedAt)}
        </Text>
        {strategy.isPublic && (
          <Badge colorScheme="green" fontSize="xs">공개</Badge>
        )}
      </Flex>
      
      {strategy.tags && strategy.tags.length > 0 && (
        <Box mt={3}>
          {strategy.tags.map((tag) => (
            <Tag size="sm" key={tag} mr={2} mb={1} colorScheme="blue">
              {tag}
            </Tag>
          ))}
        </Box>
      )}
    </Box>
  );
};

/**
 * 전략 목록 컴포넌트
 */
const StrategyList: React.FC = () => {
  // 상태 관리
  const [strategies, setStrategies] = useState<StrategyListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(false);
  
  // 삭제 확인 모달 관련 상태
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
  
  // 클론 모달 관련 상태
  const {
    isOpen: isCloneModalOpen,
    onOpen: onCloneModalOpen,
    onClose: onCloneModalClose
  } = useDisclosure();
  const [strategyToClone, setStrategyToClone] = useState<string | null>(null);
  const [newStrategyName, setNewStrategyName] = useState<string>('');
  
  const toast = useToast();
  const navigate = useNavigate();
  
  // 사용자 ID (실제로는 인증 서비스에서 가져와야 함)
  // 임시로 고정값 사용
  const userId = 'current-user-id';
  
  /**
   * 전략 목록 불러오기
   * @param refresh 목록 초기화 여부
   */
  const fetchStrategies = async (refresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: StrategyFilter = {
        searchTerm,
        sortBy,
        sortOrder,
        isPublic: showPublicOnly ? true : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };
      
      const result = await strategyService.getStrategies(
        userId,
        filter,
        refresh ? undefined : lastDoc
      );
      
      if (refresh) {
        setStrategies(result.strategies);
      } else {
        setStrategies((prev) => [...prev, ...result.strategies]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.strategies.length === 10); // 10개 미만이면 더 이상 없음
      
    } catch (err) {
      setError('전략 목록을 불러오는 중 오류가 발생했습니다.');
      console.error('전략 목록 조회 오류:', err);
      
      toast({
        title: '오류 발생',
        description: '전략 목록을 불러오는 중 문제가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 전략 목록 로드
  useEffect(() => {
    fetchStrategies(true);
  }, [searchTerm, sortBy, sortOrder, showPublicOnly, selectedTags]);
  
  /**
   * 전략 생성 페이지로 이동
   */
  const handleCreateStrategy = () => {
    navigate('/strategy/create');
  };
  
  /**
   * 전략 편집 페이지로 이동
   */
  const handleEditStrategy = (id: string) => {
    navigate(`/strategy/edit/${id}`);
  };
  
  /**
   * 전략 삭제 처리
   */
  const handleDeleteStrategy = async () => {
    if (!strategyToDelete) return;
    
    try {
      await strategyService.deleteStrategy(strategyToDelete);
      
      // 목록에서 삭제된 전략 제거
      setStrategies((prev) => prev.filter((s) => s.id !== strategyToDelete));
      
      toast({
        title: '전략 삭제 완료',
        description: '전략이 성공적으로 삭제되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('전략 삭제 오류:', err);
      
      toast({
        title: '오류 발생',
        description: '전략을 삭제하는 중 문제가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setStrategyToDelete(null);
      onClose();
    }
  };
  
  /**
   * 전략 삭제 확인 모달 열기
   */
  const openDeleteModal = (id: string) => {
    setStrategyToDelete(id);
    onOpen();
  };
  
  /**
   * 전략 복제 모달 열기
   */
  const openCloneModal = (id: string) => {
    // 복제할 전략의 이름 가져오기
    const strategy = strategies.find((s) => s.id === id);
    if (strategy) {
      setNewStrategyName(`${strategy.name} (복사본)`);
      setStrategyToClone(id);
      onCloneModalOpen();
    }
  };
  
  /**
   * 전략 복제 처리
   */
  const handleCloneStrategy = async () => {
    if (!strategyToClone || !newStrategyName.trim()) return;
    
    try {
      const newStrategyId = await strategyService.cloneStrategy(strategyToClone, newStrategyName);
      
      // 목록 새로고침
      fetchStrategies(true);
      
      toast({
        title: '전략 복제 완료',
        description: '전략이 성공적으로 복제되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 새로 생성된 전략으로 이동 (선택적)
      // navigate(`/strategy/${newStrategyId}`);
    } catch (err) {
      console.error('전략 복제 오류:', err);
      
      toast({
        title: '오류 발생',
        description: '전략을 복제하는 중 문제가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setStrategyToClone(null);
      setNewStrategyName('');
      onCloneModalClose();
    }
  };
  
  /**
   * 전략 공개/비공개 설정 변경
   */
  const handleVisibilityToggle = async (id: string, isPublic: boolean) => {
    try {
      await strategyService.setStrategyVisibility(id, isPublic);
      
      // 목록에서 해당 전략 업데이트
      setStrategies((prev) => 
        prev.map((s) => s.id === id ? { ...s, isPublic } : s)
      );
      
      toast({
        title: '설정 변경 완료',
        description: `전략이 ${isPublic ? '공개' : '비공개'}로 설정되었습니다.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('전략 공개 설정 변경 오류:', err);
      
      toast({
        title: '오류 발생',
        description: '설정을 변경하는 중 문제가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  /**
   * 정렬 방식 변경 핸들러
   */
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'name-asc') {
      setSortBy('name');
      setSortOrder('asc');
    } else if (value === 'name-desc') {
      setSortBy('name');
      setSortOrder('desc');
    } else if (value === 'createdAt-asc') {
      setSortBy('createdAt');
      setSortOrder('asc');
    } else if (value === 'createdAt-desc') {
      setSortBy('createdAt');
      setSortOrder('desc');
    } else if (value === 'updatedAt-asc') {
      setSortBy('updatedAt');
      setSortOrder('asc');
    } else {
      // 기본값: updatedAt-desc
      setSortBy('updatedAt');
      setSortOrder('desc');
    }
  };
  
  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">내 전략 목록</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleCreateStrategy}
        >
          새 전략 만들기
        </Button>
      </Flex>
      
      {/* 검색 및 필터 영역 */}
      <Flex mb={6} flexWrap="wrap" gap={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="전략 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <Select 
          maxW="200px"
          value={`${sortBy}-${sortOrder}`}
          onChange={handleSortChange}
        >
          <option value="updatedAt-desc">최근 수정순</option>
          <option value="updatedAt-asc">오래된 수정순</option>
          <option value="createdAt-desc">최근 생성순</option>
          <option value="createdAt-asc">오래된 생성순</option>
          <option value="name-asc">이름 오름차순</option>
          <option value="name-desc">이름 내림차순</option>
        </Select>
      </Flex>
      
      {/* 전략 목록 */}
      {loading && strategies.length === 0 ? (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : error ? (
        <Box textAlign="center" p={6} color="red.500">
          <Text>{error}</Text>
          <Button mt={4} onClick={() => fetchStrategies(true)}>
            다시 시도
          </Button>
        </Box>
      ) : strategies.length === 0 ? (
        <Box textAlign="center" p={10} borderWidth="1px" borderRadius="lg">
          <Text mb={4}>아직 생성된 전략이 없습니다.</Text>
          <Button colorScheme="blue" onClick={handleCreateStrategy}>
            첫 번째 전략 만들기
          </Button>
        </Box>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {strategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onEdit={handleEditStrategy}
                onDelete={openDeleteModal}
                onClone={openCloneModal}
                onVisibilityToggle={handleVisibilityToggle}
              />
            ))}
          </SimpleGrid>
          
          {/* 더 보기 버튼 */}
          {hasMore && (
            <Flex justifyContent="center" mt={6}>
              <Button
                onClick={() => fetchStrategies()}
                isLoading={loading}
                loadingText="불러오는 중"
                disabled={!hasMore}
              >
                더 보기
              </Button>
            </Flex>
          )}
        </>
      )}
      
      {/* 삭제 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>전략 삭제</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>정말 이 전략을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              취소
            </Button>
            <Button colorScheme="red" onClick={handleDeleteStrategy}>
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 복제 모달 */}
      <Modal isOpen={isCloneModalOpen} onClose={onCloneModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>전략 복제</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>새 전략 이름</FormLabel>
              <Input
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloneModalClose}>
              취소
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCloneStrategy}
              isDisabled={!newStrategyName.trim()}
            >
              복제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StrategyList; 