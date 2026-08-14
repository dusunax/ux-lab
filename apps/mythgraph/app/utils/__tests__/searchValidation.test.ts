/**
 * SearchValidation 테스트
 * E2E를 고려한 검색 결과 유효성 검사
 */

import { validateSearchResult, isValidEntity, sanitizeEntity } from '../searchValidation';

describe('Search Validation', () => {
  // Valid entity
  const validEntity = {
    id: 'zeus',
    name: 'Zeus',
    type: 'DEITY',
    description: 'King of the gods',
  };

  const validSearchResult = {
    entity: validEntity,
    matchScore: 0.95,
  };

  describe('validateSearchResult', () => {
    it('should return true for valid search result', () => {
      expect(validateSearchResult(validSearchResult)).toBe(true);
    });

    it('should return false when entity is null', () => {
      expect(validateSearchResult({ entity: null, matchScore: 0.95 })).toBe(false);
    });

    it('should return false when entity is undefined', () => {
      expect(validateSearchResult({ entity: undefined, matchScore: 0.95 })).toBe(false);
    });

    it('should return false when matchScore is missing', () => {
      const result = { entity: validEntity };
      expect(validateSearchResult(result as any)).toBe(false);
    });

    it('should return false when result object is null', () => {
      expect(validateSearchResult(null as any)).toBe(false);
    });

    it('should return false when result object is undefined', () => {
      expect(validateSearchResult(undefined as any)).toBe(false);
    });

    it('should return false when result is not an object', () => {
      expect(validateSearchResult('invalid' as any)).toBe(false);
      expect(validateSearchResult(123 as any)).toBe(false);
      expect(validateSearchResult([] as any)).toBe(false);
    });
  });

  describe('isValidEntity', () => {
    it('should return true for valid entity', () => {
      expect(isValidEntity(validEntity)).toBe(true);
    });

    it('should return false when entity is null', () => {
      expect(isValidEntity(null as any)).toBe(false);
    });

    it('should return false when entity is undefined', () => {
      expect(isValidEntity(undefined as any)).toBe(false);
    });

    it('should return false when id is missing', () => {
      const entity = { name: 'Zeus', type: 'DEITY', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });

    it('should return false when name is missing', () => {
      const entity = { id: 'zeus', type: 'DEITY', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });

    it('should return false when type is missing', () => {
      const entity = { id: 'zeus', name: 'Zeus', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });

    it('should return false when type is invalid', () => {
      const entity = { id: 'zeus', name: 'Zeus', type: 'INVALID_TYPE', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });

    it('should allow missing description', () => {
      const entity = { id: 'zeus', name: 'Zeus', type: 'DEITY' };
      expect(isValidEntity(entity as any)).toBe(true);
    });

    it('should return false when id is empty string', () => {
      const entity = { id: '', name: 'Zeus', type: 'DEITY', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });

    it('should return false when name is empty string', () => {
      const entity = { id: 'zeus', name: '', type: 'DEITY', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });

    it('should return false when result contains [Image #N] pattern', () => {
      const entity = { id: '[Image #36]', name: 'Zeus', type: 'DEITY', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });

    it('should return false when name contains [Image #N] pattern', () => {
      const entity = { id: 'zeus', name: '[Image #36]', type: 'DEITY', description: 'King' };
      expect(isValidEntity(entity as any)).toBe(false);
    });
  });

  describe('sanitizeEntity', () => {
    it('should return valid entity as-is', () => {
      const result = sanitizeEntity(validEntity);
      expect(result).toEqual(validEntity);
    });

    it('should return null for invalid entity', () => {
      expect(sanitizeEntity(null as any)).toBeNull();
    });

    it('should return null when id is [Image #N] pattern', () => {
      const entity = { id: '[Image #36]', name: 'Zeus', type: 'DEITY', description: 'King' };
      expect(sanitizeEntity(entity as any)).toBeNull();
    });

    it('should trim whitespace from id and name', () => {
      const entity = { id: '  zeus  ', name: '  Zeus  ', type: 'DEITY', description: 'King' };
      const result = sanitizeEntity(entity as any);
      expect(result?.id).toBe('zeus');
      expect(result?.name).toBe('Zeus');
    });

    it('should handle missing description gracefully', () => {
      const entity = { id: 'zeus', name: 'Zeus', type: 'DEITY' };
      const result = sanitizeEntity(entity as any);
      expect(result).toEqual({ id: 'zeus', name: 'Zeus', type: 'DEITY', description: '' });
    });

    it('should remove malformed entities from results', () => {
      const entities = [
        validEntity,
        { id: '', name: 'Invalid', type: 'DEITY', description: 'Bad' },
        { id: 'poseidon', name: 'Poseidon', type: 'DEITY', description: 'Sea god' },
      ];

      const sanitized = entities
        .map(sanitizeEntity)
        .filter((e): e is ReturnType<typeof sanitizeEntity> => e !== null);

      expect(sanitized).toHaveLength(2);
      expect(sanitized[0].id).toBe('zeus');
      expect(sanitized[1].id).toBe('poseidon');
    });
  });

  describe('Empty search results', () => {
    it('should handle empty array of search results', () => {
      const results: any[] = [];
      const validated = results.filter(validateSearchResult);
      expect(validated).toHaveLength(0);
    });

    it('should filter out invalid results from mixed array', () => {
      const results = [
        validSearchResult,
        { entity: null, matchScore: 0.5 },
        { entity: { id: '', name: 'Invalid', type: 'DEITY' }, matchScore: 0.3 },
        validSearchResult,
      ];

      const validated = results.filter(validateSearchResult);
      expect(validated).toHaveLength(2);
    });

    it('should display empty message when no valid results', () => {
      const invalidResults = [
        { entity: null, matchScore: 0.5 },
        { entity: undefined, matchScore: 0.5 },
      ];

      const validResults = invalidResults.filter(validateSearchResult);
      expect(validResults).toHaveLength(0);
      expect(validResults.length === 0).toBe(true);
    });
  });

  describe('Special characters and edge cases', () => {
    it('should handle entities with special characters in name', () => {
      const entity = {
        id: 'aphrodite',
        name: 'Aphrodite (Ἀφροδίτη)',
        type: 'DEITY',
        description: 'Goddess of love',
      };
      expect(isValidEntity(entity as any)).toBe(true);
    });

    it('should handle entities with accented characters', () => {
      const entity = {
        id: 'nemean-lion',
        name: 'Nemean Lion',
        type: 'MONSTER',
        description: 'A creature from Greek mythology',
      };
      expect(isValidEntity(entity as any)).toBe(true);
    });

    it('should sanitize entity with very long description', () => {
      const entity = {
        id: 'zeus',
        name: 'Zeus',
        type: 'DEITY',
        description: 'a'.repeat(10000),
      };
      const result = sanitizeEntity(entity as any);
      expect(result).not.toBeNull();
      expect(result?.description).toBe('a'.repeat(10000));
    });

    it('should handle numeric strings in entity fields', () => {
      const entity = {
        id: '123',
        name: '456',
        type: 'DEITY',
        description: '789',
      };
      expect(isValidEntity(entity as any)).toBe(true);
    });
  });

  describe('GraphQL error scenarios', () => {
    it('should handle GraphQL error response gracefully', () => {
      const errorResponse = {
        errors: [{ message: 'Query timeout' }],
        data: null,
      };
      // Should not throw
      expect(() => {
        const isValid = validateSearchResult(errorResponse as any);
        expect(isValid).toBe(false);
      }).not.toThrow();
    });

    it('should handle malformed GraphQL response', () => {
      const malformedResponse = {
        entity: {
          id: 'zeus',
          name: 'Zeus',
          // Missing type field
          description: 'King',
        },
        matchScore: 0.95,
      };
      expect(validateSearchResult(malformedResponse as any)).toBe(false);
    });

    it('should validate matchScore is a number', () => {
      const result = {
        entity: validEntity,
        matchScore: 'not-a-number' as any,
      };
      expect(validateSearchResult(result as any)).toBe(false);
    });

    it('should validate matchScore is within valid range', () => {
      const validScores = [
        { entity: validEntity, matchScore: 0 },
        { entity: validEntity, matchScore: 0.5 },
        { entity: validEntity, matchScore: 1.0 },
      ];

      validScores.forEach((result) => {
        expect(validateSearchResult(result as any)).toBe(true);
      });

      const invalidScores = [
        { entity: validEntity, matchScore: -0.1 },
        { entity: validEntity, matchScore: 1.1 },
      ];

      invalidScores.forEach((result) => {
        expect(validateSearchResult(result as any)).toBe(false);
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle search with no results', () => {
      const response = {
        data: {
          searchEntities: [],
        },
      };

      const results = response.data.searchEntities.filter(validateSearchResult);
      expect(results).toHaveLength(0);
    });

    it('should handle partial entity data from Neo4j', () => {
      const result = {
        entity: {
          id: 'zeus',
          name: 'Zeus',
          type: 'DEITY',
          description: null, // Neo4j may return null
        },
        matchScore: 0.95,
      };

      const isValid = validateSearchResult(result as any);
      expect(isValid).toBe(true); // description can be null
    });

    it('should handle multiple search results with mixed validity', () => {
      const results = [
        { entity: { id: 'zeus', name: 'Zeus', type: 'DEITY', description: 'King' }, matchScore: 0.95 },
        { entity: { id: '', name: 'Invalid', type: 'DEITY', description: 'Bad' }, matchScore: 0.5 },
        { entity: { id: 'apollo', name: 'Apollo', type: 'DEITY', description: 'Sun god' }, matchScore: 0.92 },
        { entity: null, matchScore: 0.3 },
      ];

      const validResults = results.filter(validateSearchResult);
      expect(validResults).toHaveLength(2);
      expect(validResults[0].entity.name).toBe('Zeus');
      expect(validResults[1].entity.name).toBe('Apollo');
    });
  });
});
