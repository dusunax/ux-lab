/**
 * Search Validation Utilities
 * 검색 결과 데이터 유효성 검사 및 정제
 *
 * [Image #N] 패턴이나 기타 잘못된 데이터 필터링
 */

type EntityType = 'DEITY' | 'HUMAN' | 'MONSTER' | 'PLACE';

export interface GraphQLEntity {
  id: string;
  name: string;
  type: EntityType;
  description?: string | null;
}

export interface SearchResult {
  entity: GraphQLEntity | null | undefined;
  matchScore: number;
}

const VALID_ENTITY_TYPES: EntityType[] = ['DEITY', 'HUMAN', 'MONSTER', 'PLACE'];
const IMAGE_PATTERN = /^\[Image\s+#\d+\]$/;

/**
 * 검색 결과 전체 유효성 검사
 * @param result GraphQL 검색 결과
 * @returns 유효 여부
 */
export function validateSearchResult(result: any): result is SearchResult {
  if (!result || typeof result !== 'object') {
    return false;
  }

  if (!('entity' in result) || !('matchScore' in result)) {
    return false;
  }

  const { entity, matchScore } = result;

  // entity 유효성 검사
  if (!isValidEntity(entity)) {
    return false;
  }

  // matchScore 유효성 검사
  if (typeof matchScore !== 'number' || matchScore < 0 || matchScore > 1) {
    return false;
  }

  return true;
}

/**
 * 개별 엔티티 유효성 검사
 * @param entity 엔티티 객체
 * @returns 유효 여부
 */
export function isValidEntity(entity: any): entity is GraphQLEntity {
  if (!entity || typeof entity !== 'object') {
    return false;
  }

  const { id, name, type, description } = entity;

  // 필수 필드 확인
  if (typeof id !== 'string' || typeof name !== 'string' || typeof type !== 'string') {
    return false;
  }

  // id와 name이 비어있지 않은지 확인
  if (!id.trim() || !name.trim()) {
    return false;
  }

  // 타입이 유효한지 확인
  if (!VALID_ENTITY_TYPES.includes(type as EntityType)) {
    return false;
  }

  // [Image #N] 패턴 확인 (잘못된 렌더링 방지)
  if (IMAGE_PATTERN.test(id) || IMAGE_PATTERN.test(name)) {
    return false;
  }

  // description은 선택사항이지만, null이 아닌 경우 문자열이어야 함
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return false;
  }

  return true;
}

/**
 * 엔티티 데이터 정제 및 보정
 * @param entity 원본 엔티티
 * @returns 정제된 엔티티 또는 null (유효하지 않은 경우)
 */
export function sanitizeEntity(entity: any): GraphQLEntity | null {
  if (!entity || typeof entity !== 'object') {
    return null;
  }

  const { id, name, type, description } = entity;

  // 필수 필드 확인
  if (typeof id !== 'string' || typeof name !== 'string' || typeof type !== 'string') {
    return null;
  }

  // 공백 제거
  const trimmedId = id.trim();
  const trimmedName = name.trim();

  // 빈 문자열 확인
  if (!trimmedId || !trimmedName) {
    return null;
  }

  // 타입 유효성 확인
  if (!VALID_ENTITY_TYPES.includes(type as EntityType)) {
    return null;
  }

  // [Image #N] 패턴 확인
  if (IMAGE_PATTERN.test(trimmedId) || IMAGE_PATTERN.test(trimmedName)) {
    return null;
  }

  // description 정제 (null 또는 빈 문자열로 통일)
  const sanitizedDescription = typeof description === 'string' ? description : '';

  return {
    id: trimmedId,
    name: trimmedName,
    type: type as EntityType,
    description: sanitizedDescription,
  };
}

/**
 * 검색 결과 배열 필터링
 * @param results 원본 검색 결과 배열
 * @returns 유효한 결과만 필터링된 배열
 */
export function filterValidSearchResults(results: any[]): SearchResult[] {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .filter((result) => {
      if (!result || typeof result !== 'object') return false;
      const { entity, matchScore } = result;

      // entity 유효성 검사
      if (!isValidEntity(entity)) return false;

      // matchScore 유효성 검사
      if (typeof matchScore !== 'number' || matchScore < 0 || matchScore > 1) return false;

      return true;
    })
    .map((result) => ({
      entity: result.entity as GraphQLEntity,
      matchScore: result.matchScore as number,
    }));
}

/**
 * 엔티티 배열 정제
 * @param entities 원본 엔티티 배열
 * @returns 정제된 유효한 엔티티 배열
 */
export function sanitizeEntities(entities: any[]): GraphQLEntity[] {
  if (!Array.isArray(entities)) {
    return [];
  }

  return entities
    .map(sanitizeEntity)
    .filter((entity): entity is GraphQLEntity => entity !== null);
}

/**
 * 검색 결과 처리 (안전 래퍼)
 * @param results GraphQL에서 받은 검색 결과
 * @returns 안전하게 처리된 결과
 */
export function processSearchResults(results: any[]): {
  valid: SearchResult[];
  invalid: number;
} {
  const valid = filterValidSearchResults(results);
  const invalid = (Array.isArray(results) ? results.length : 0) - valid.length;

  return { valid, invalid };
}
