/**
 * 전략 관리 서비스
 * Firebase Firestore와 연동하여 전략 CRUD 기능 제공
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  FirestoreError,
  DocumentSnapshot,
  QueryConstraint,
  Firestore,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { getFirebaseFirestore } from '../../config/firebase';
import { Strategy, StrategyListItem, StrategyFilter } from '../../types/strategy';

/**
 * 전략 관리 서비스 클래스
 * 전략 생성, 조회, 수정, 삭제 기능 제공
 */
class StrategyService {
  private readonly collectionName = 'strategies';
  
  /**
   * Firestore 인스턴스 가져오기
   * @returns Firestore 인스턴스
   * @throws Firestore가 초기화되지 않은 경우 에러
   */
  private getDb(): Firestore {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다. Firebase 설정을 확인하세요.');
    }
    return db;
  }
  
  /**
   * 전략 생성
   * @param strategy 생성할 전략 정보
   * @returns 생성된 전략 ID
   */
  async createStrategy(strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const db = this.getDb();
      const timestamp = Date.now();
      const strategyId = nanoid();
      
      const newStrategy: Strategy = {
        ...strategy,
        id: strategyId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      // Firestore에 전략 저장
      const docRef = doc(db, this.collectionName, strategyId);
      await setDoc(docRef, newStrategy);
      
      return strategyId;
    } catch (error) {
      console.error('전략 생성 오류:', error);
      throw new Error('전략을 생성하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 전략 조회
   * @param strategyId 조회할 전략 ID
   * @returns 전략 정보
   */
  async getStrategy(strategyId: string): Promise<Strategy | null> {
    try {
      const db = this.getDb();
      const docRef = doc(db, this.collectionName, strategyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Strategy;
      } else {
        return null;
      }
    } catch (error) {
      console.error('전략 조회 오류:', error);
      throw new Error('전략을 조회하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 전략 목록 조회
   * @param userId 사용자 ID
   * @param filter 필터 옵션
   * @param lastDoc 페이지네이션 마지막 문서
   * @param pageSize 페이지 크기
   * @returns 전략 목록
   */
  async getStrategies(
    userId: string,
    filter?: StrategyFilter,
    lastDoc?: DocumentSnapshot,
    pageSize = 10
  ): Promise<{ strategies: StrategyListItem[], lastDoc: DocumentSnapshot | undefined }> {
    try {
      const db = this.getDb();
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId)
      ];
      
      // 필터 적용
      if (filter) {
        if (filter.isPublic !== undefined) {
          constraints.push(where('isPublic', '==', filter.isPublic));
        }
        
        if (filter.tags && filter.tags.length > 0) {
          constraints.push(where('tags', 'array-contains-any', filter.tags));
        }
        
        // 정렬 적용
        const sortField = filter.sortBy || 'updatedAt';
        const sortDirection = filter.sortOrder || 'desc';
        constraints.push(orderBy(sortField, sortDirection));
      } else {
        // 기본 정렬
        constraints.push(orderBy('updatedAt', 'desc'));
      }
      
      // 페이지네이션
      constraints.push(limit(pageSize));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const strategies: StrategyListItem[] = [];
      let newLastDoc: DocumentSnapshot | undefined = undefined;
      
      querySnapshot.forEach((doc) => {
        const strategyData = doc.data() as Strategy;
        
        // 검색어 필터링 (클라이언트 측에서 수행)
        if (filter?.searchTerm && filter.searchTerm.trim() !== '') {
          const searchTerm = filter.searchTerm.toLowerCase();
          const name = strategyData.name.toLowerCase();
          const description = strategyData.description.toLowerCase();
          
          if (!name.includes(searchTerm) && !description.includes(searchTerm)) {
            return;
          }
        }
        
        // 목록용 간소화된 정보만 추출
        const listItem: StrategyListItem = {
          id: strategyData.id,
          name: strategyData.name,
          description: strategyData.description,
          createdAt: strategyData.createdAt,
          updatedAt: strategyData.updatedAt,
          userId: strategyData.userId,
          isPublic: strategyData.isPublic,
          tags: strategyData.tags,
        };
        
        strategies.push(listItem);
        newLastDoc = doc;
      });
      
      return {
        strategies,
        lastDoc: newLastDoc
      };
    } catch (error) {
      console.error('전략 목록 조회 오류:', error);
      throw new Error('전략 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 전략 수정
   * @param strategyId 수정할 전략 ID
   * @param strategyData 수정할 전략 데이터
   */
  async updateStrategy(
    strategyId: string,
    strategyData: Partial<Omit<Strategy, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>
  ): Promise<void> {
    try {
      const db = this.getDb();
      const docRef = doc(db, this.collectionName, strategyId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('전략을 찾을 수 없습니다.');
      }
      
      // 업데이트 시간 갱신
      const updateData = {
        ...strategyData,
        updatedAt: Date.now(),
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('전략 수정 오류:', error);
      throw new Error('전략을 수정하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 전략 삭제
   * @param strategyId 삭제할 전략 ID
   */
  async deleteStrategy(strategyId: string): Promise<void> {
    try {
      const db = this.getDb();
      const docRef = doc(db, this.collectionName, strategyId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('전략 삭제 오류:', error);
      throw new Error('전략을 삭제하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 전략 복제
   * @param strategyId 복제할 전략 ID
   * @param newName 새 전략 이름
   * @returns 복제된 전략 ID
   */
  async cloneStrategy(strategyId: string, newName: string): Promise<string> {
    try {
      const strategy = await this.getStrategy(strategyId);
      
      if (!strategy) {
        throw new Error('복제할 전략을 찾을 수 없습니다.');
      }
      
      // 새 전략 정보 생성
      const newStrategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'> = {
        ...strategy,
        name: newName || `${strategy.name} (복사본)`,
      };
      
      // ID, 생성 시간, 수정 시간 제외
      delete (newStrategy as any).id;
      delete (newStrategy as any).createdAt;
      delete (newStrategy as any).updatedAt;
      
      // 새 전략 생성
      return await this.createStrategy(newStrategy);
    } catch (error) {
      console.error('전략 복제 오류:', error);
      throw new Error('전략을 복제하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 전략 공개/비공개 설정
   * @param strategyId 전략 ID
   * @param isPublic 공개 여부
   */
  async setStrategyVisibility(strategyId: string, isPublic: boolean): Promise<void> {
    try {
      const db = this.getDb();
      const docRef = doc(db, this.collectionName, strategyId);
      await updateDoc(docRef, {
        isPublic,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('전략 공개 설정 오류:', error);
      throw new Error('전략 공개 설정을 변경하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 공개 전략 목록 조회
   * @param filter 필터 옵션
   * @param lastDoc 페이지네이션 마지막 문서
   * @param pageSize 페이지 크기
   * @returns 공개 전략 목록
   */
  async getPublicStrategies(
    filter?: Omit<StrategyFilter, 'isPublic'>,
    lastDoc?: DocumentSnapshot,
    pageSize = 10
  ): Promise<{ strategies: StrategyListItem[], lastDoc: DocumentSnapshot | undefined }> {
    try {
      const db = this.getDb();
      const constraints: QueryConstraint[] = [
        where('isPublic', '==', true)
      ];
      
      // 필터 적용
      if (filter) {
        if (filter.tags && filter.tags.length > 0) {
          constraints.push(where('tags', 'array-contains-any', filter.tags));
        }
        
        // 정렬 적용
        const sortField = filter.sortBy || 'updatedAt';
        const sortDirection = filter.sortOrder || 'desc';
        constraints.push(orderBy(sortField, sortDirection));
      } else {
        // 기본 정렬
        constraints.push(orderBy('updatedAt', 'desc'));
      }
      
      // 페이지네이션
      constraints.push(limit(pageSize));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const strategies: StrategyListItem[] = [];
      let newLastDoc: DocumentSnapshot | undefined = undefined;
      
      querySnapshot.forEach((doc) => {
        const strategyData = doc.data() as Strategy;
        
        // 검색어 필터링 (클라이언트 측에서 수행)
        if (filter?.searchTerm && filter.searchTerm.trim() !== '') {
          const searchTerm = filter.searchTerm.toLowerCase();
          const name = strategyData.name.toLowerCase();
          const description = strategyData.description.toLowerCase();
          
          if (!name.includes(searchTerm) && !description.includes(searchTerm)) {
            return;
          }
        }
        
        // 목록용 간소화된 정보만 추출
        const listItem: StrategyListItem = {
          id: strategyData.id,
          name: strategyData.name,
          description: strategyData.description,
          createdAt: strategyData.createdAt,
          updatedAt: strategyData.updatedAt,
          userId: strategyData.userId,
          isPublic: strategyData.isPublic,
          tags: strategyData.tags,
        };
        
        strategies.push(listItem);
        newLastDoc = doc;
      });
      
      return {
        strategies,
        lastDoc: newLastDoc
      };
    } catch (error) {
      console.error('공개 전략 목록 조회 오류:', error);
      throw new Error('공개 전략 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const strategyService = new StrategyService();
export default strategyService; 