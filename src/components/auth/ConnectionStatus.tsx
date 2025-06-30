import React, { useEffect } from 'react';
import {
  Box,
  Text,
  Badge,
  Flex,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, 
  WarningIcon, 
  TimeIcon, 
  NotAllowedIcon,
  InfoIcon
} from '@chakra-ui/icons';
import { useFirebaseStore, FirebaseConnectionStatus } from '../../store/firebase';

/**
 * 연결 상태 아이콘 선택
 * 상태에 따라 적절한 아이콘 반환
 */
const getStatusIcon = (status: FirebaseConnectionStatus) => {
  switch (status) {
    case 'connected':
      return <CheckCircleIcon color="green.500" />;
    case 'connecting':
      return <TimeIcon color="blue.500" />;
    case 'error':
      return <WarningIcon color="red.500" />;
    case 'disconnected':
    default:
      return <NotAllowedIcon color="gray.500" />;
  }
};

/**
 * 연결 상태 색상 선택
 * 상태에 따라 적절한 색상 반환
 */
const getStatusColor = (status: FirebaseConnectionStatus) => {
  switch (status) {
    case 'connected':
      return 'green';
    case 'connecting':
      return 'blue';
    case 'error':
      return 'red';
    case 'disconnected':
    default:
      return 'gray';
  }
};

interface ConnectionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Firebase 연결 상태 표시 컴포넌트
 * 현재 Firebase 연결 상태를 시각적으로 표시
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  compact = false
}) => {
  const connectionStatus = useFirebaseStore(state => state.connectionStatus);
  const connectionError = useFirebaseStore(state => state.connectionError);
  const projectId = useFirebaseStore(state => state.encryptedConfig?.projectId);
  const lastConnectedAt = useFirebaseStore(state => state.lastConnectedAt);
  
  const statusColor = getStatusColor(connectionStatus);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    // 상태가 변경될 때 로그 기록
    console.log(`Firebase 연결 상태 변경: ${connectionStatus}`);
  }, [connectionStatus]);

  // 간소화된 배지 버전
  if (compact) {
    return (
      <Tooltip 
        label={`Firebase 상태: ${connectionStatus}${connectionError ? ` - ${connectionError}` : ''}`}
        hasArrow
      >
        <Badge colorScheme={statusColor} variant="subtle" px={2} py={1}>
          <Flex alignItems="center" gap={1}>
            {getStatusIcon(connectionStatus)}
            {projectId ? projectId.substring(0, 8) + '...' : 'Firebase'}
          </Flex>
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Box
      borderWidth={1}
      borderRadius="md"
      p={3}
      bg={bgColor}
      borderColor={borderColor}
      width="100%"
    >
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={2}>
          {getStatusIcon(connectionStatus)}
          <Badge colorScheme={statusColor} variant="subtle" px={2} py={1}>
            {connectionStatus}
          </Badge>
          {projectId && (
            <Text fontSize="sm" fontWeight="medium">
              {projectId}
            </Text>
          )}
        </Flex>
        
        {showDetails && lastConnectedAt && connectionStatus === 'connected' && (
          <Tooltip label={`마지막 연결: ${new Date(lastConnectedAt).toLocaleString()}`} hasArrow>
            <InfoIcon color="blue.500" />
          </Tooltip>
        )}
      </Flex>
      
      {connectionError && (
        <Text color="red.500" fontSize="sm" mt={2}>
          {connectionError}
        </Text>
      )}
    </Box>
  );
};

export default ConnectionStatus; 