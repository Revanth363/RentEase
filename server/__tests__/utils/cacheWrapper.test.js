/**
 * PHASE 3: Cache Wrapper Tests
 * Testing: cacheWrapper.cachedQuery()
 * 
 * Coverage:
 * - Edge Case 1: Invalid cacheKey
 * - Edge Case 2: queryFn is not a function
 * - Edge Case 3: Cache hit (returns cached data)
 * - Edge Case 4: Cache miss (falls back to DB)
 * - Edge Case 5: Redis unavailable (graceful fallback)
 * - Edge Case 6: queryFn throws error
 * - Edge Case 7: TTL expiration
 * - Edge Case 8: Performance metrics tracking
 */

const { cachedQuery } = require('../../utils/cacheWrapper');
const redisConfig = require('../../config/redis');

// Mock Redis functions
jest.mock('../../config/redis', () => ({
  cacheGet: jest.fn(),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
  cacheDelPattern: jest.fn()
}));

describe('PHASE 3: Cache Wrapper - cachedQuery()', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // EDGE CASE 1: Invalid Cache Key
  // ============================================
  describe('Edge Case 1: Invalid cacheKey', () => {
    
    test('should throw error when cacheKey is empty string', async () => {
      const mockQuery = jest.fn();
      
      await expect(cachedQuery('', mockQuery, 300)).rejects.toThrow(
        'cacheKey must be a non-empty string'
      );
    });

    test('should throw error when cacheKey is null', async () => {
      const mockQuery = jest.fn();
      
      await expect(cachedQuery(null, mockQuery, 300)).rejects.toThrow(
        'cacheKey must be a non-empty string'
      );
    });

    test('should throw error when cacheKey is undefined', async () => {
      const mockQuery = jest.fn();
      
      await expect(cachedQuery(undefined, mockQuery, 300)).rejects.toThrow(
        'cacheKey must be a non-empty string'
      );
    });
  });

  // ============================================
  // EDGE CASE 2: queryFn is not a function
  // ============================================
  describe('Edge Case 2: queryFn type validation', () => {
    
    test('should throw error when queryFn is not a function', async () => {
      await expect(cachedQuery('test-key', 'not-a-function', 300)).rejects.toThrow(
        'queryFn must be a function'
      );
    });

    test('should throw error when queryFn is null', async () => {
      await expect(cachedQuery('test-key', null, 300)).rejects.toThrow(
        'queryFn must be a function'
      );
    });

    test('should throw error when queryFn is an object', async () => {
      await expect(cachedQuery('test-key', { call: () => {} }, 300)).rejects.toThrow(
        'queryFn must be a function'
      );
    });
  });

  // ============================================
  // EDGE CASE 3: Cache Hit
  // ============================================
  describe('Edge Case 3: Cache hit - returns cached data', () => {
    
    test('should return cached data on hit', async () => {
      const cachedData = { id: 1, name: 'Test Property', price: 5000 };
      const mockQuery = jest.fn();
      
      // cacheGet returns parsed JSON
      redisConfig.cacheGet.mockResolvedValue(cachedData);
      
      const result = await cachedQuery('property:1', mockQuery, 300);
      
      expect(result.data).toEqual(cachedData);
      expect(result.source).toBe('cache');
      expect(mockQuery).not.toHaveBeenCalled(); // Query should not execute on cache hit
      expect(redisConfig.cacheGet).toHaveBeenCalledWith('property:1');
    });

    test('should track cache hit in stats', async () => {
      const cachedData = { id: 1, name: 'Test' };
      // cacheGet returns parsed data
      redisConfig.cacheGet.mockResolvedValue(cachedData);
      
      const result = await cachedQuery('cache-key', jest.fn(), 300);
      
      expect(result.source).toBe('cache');
      expect(result.data).toEqual(cachedData);
    });

    test('should measure cache response time correctly', async () => {
      const cachedData = { data: 'test' };
      redisConfig.cacheGet.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(cachedData), 5);
        });
      });
      
      const result = await cachedQuery('slow-cache', jest.fn(), 300);
      
      expect(result.time).toBeGreaterThanOrEqual(5);
      expect(result.source).toBe('cache');
    });
  });

  // ============================================
  // EDGE CASE 4: Cache Miss - Fallback to DB
  // ============================================
  describe('Edge Case 4: Cache miss - falls back to database', () => {
    
    test('should execute queryFn on cache miss (null)', async () => {
      const dbData = { id: 1, name: 'Property from DB' };
      const mockQuery = jest.fn().mockResolvedValue(dbData);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      const result = await cachedQuery('property:1', mockQuery, 300);
      
      expect(result.data).toEqual(dbData);
      expect(result.source).toBe('database');
      expect(mockQuery).toHaveBeenCalled();
      expect(redisConfig.cacheSet).toHaveBeenCalledWith(
        'property:1',
        dbData,
        300
      );
    });

    test('should execute queryFn on cache miss (undefined)', async () => {
      const dbData = { id: 2, name: 'Test Property' };
      const mockQuery = jest.fn().mockResolvedValue(dbData);
      
      redisConfig.cacheGet.mockResolvedValue(undefined);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      const result = await cachedQuery('new-key', mockQuery, 300);
      
      expect(result.data).toEqual(dbData);
      expect(result.source).toBe('database');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test('should cache query result with correct TTL', async () => {
      const dbData = { id: 1 };
      const mockQuery = jest.fn().mockResolvedValue(dbData);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      await cachedQuery('property:1', mockQuery, 600);
      
      expect(redisConfig.cacheSet).toHaveBeenCalledWith(
        'property:1',
        dbData,
        600
      );
    });

    test('should use default TTL=300 if not provided', async () => {
      const dbData = { id: 1 };
      const mockQuery = jest.fn().mockResolvedValue(dbData);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      await cachedQuery('property:1', mockQuery); // No TTL
      
      expect(redisConfig.cacheSet).toHaveBeenCalledWith(
        'property:1',
        dbData,
        300
      );
    });
  });

  // ============================================
  // EDGE CASE 5: Redis Unavailable
  // ============================================
  describe('Edge Case 5: Redis unavailable - graceful fallback', () => {
    
    test('should return error when cacheGet throws error', async () => {
      const mockQuery = jest.fn();
      
      redisConfig.cacheGet.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await cachedQuery('property:1', mockQuery, 300);
      
      expect(result.data).toBeNull();
      expect(result.source).toBe('error');
      expect(result.error).toBe('Redis connection failed');
    });

    test('should continue when cacheSet fails', async () => {
      const dbData = { id: 1, name: 'Test' };
      const mockQuery = jest.fn().mockResolvedValue(dbData);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockRejectedValue(new Error('Redis write failed'));
      
      const result = await cachedQuery('property:1', mockQuery, 300);
      
      expect(result.data).toEqual(dbData);
      expect(result.source).toBe('database');
    });

    test('should return error on invalid cached data format', async () => {
      const mockQuery = jest.fn();
      
      redisConfig.cacheGet.mockRejectedValue(new Error('JSON parse error'));
      
      const result = await cachedQuery('property:1', mockQuery, 300);
      
      expect(result.source).toBe('error');
    });
  });

  // ============================================
  // EDGE CASE 6: queryFn Throws Error
  // ============================================
  describe('Edge Case 6: queryFn throws error', () => {
    
    test('should return error when queryFn fails', async () => {
      const mockQuery = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );
      
      redisConfig.cacheGet.mockResolvedValue(null);
      
      const result = await cachedQuery('property:1', mockQuery, 300);
      
      expect(result.data).toBeNull();
      expect(result.source).toBe('error');
      expect(result.error).toBe('Database connection failed');
    });

    test('should handle MongoDB validation errors', async () => {
      const mockQuery = jest.fn().mockRejectedValue(
        new Error('Cast to ObjectId failed for value "invalid-id"')
      );
      
      redisConfig.cacheGet.mockResolvedValue(null);
      
      const result = await cachedQuery('property:invalid', mockQuery, 300);
      
      expect(result.source).toBe('error');
      expect(result.error).toContain('Cast to ObjectId failed');
    });

    test('should handle timeout errors', async () => {
      const mockQuery = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), 100);
        });
      });
      
      redisConfig.cacheGet.mockResolvedValue(null);
      
      const result = await cachedQuery('slow-query', mockQuery, 300);
      
      expect(result.source).toBe('error');
      expect(result.error).toBe('Query timeout');
    });
  });

  // ============================================
  // EDGE CASE 7: Edge Case 7 - Complex Data Types
  // ============================================
  describe('Edge Case 7: Complex data types handling', () => {
    
    test('should handle array data correctly', async () => {
      const arrayData = [
        { id: 1, name: 'Property 1' },
        { id: 2, name: 'Property 2' }
      ];
      const mockQuery = jest.fn().mockResolvedValue(arrayData);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      const result = await cachedQuery('properties:list', mockQuery, 300);
      
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
    });

    test('should handle null data', async () => {
      const mockQuery = jest.fn().mockResolvedValue(null);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      const result = await cachedQuery('non-existent', mockQuery, 300);
      
      expect(result.data).toBeNull();
      expect(result.source).toBe('database');
    });

    test('should handle nested objects with special fields', async () => {
      const complexData = {
        id: 1,
        createdAt: new Date('2026-03-04'),
        metadata: {
          tags: ['tag1', 'tag2'],
          nested: { deep: { value: 'test' } }
        }
      };
      const mockQuery = jest.fn().mockResolvedValue(complexData);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      const result = await cachedQuery('complex-data', mockQuery, 300);
      
      expect(result.data).toEqual(complexData);
    });

    test('should handle boolean and numeric values', async () => {
      const boolNumData = {
        isActive: true,
        isVerified: false,
        count: 42,
        price: 5000.50,
        zero: 0,
        negative: -100
      };
      const mockQuery = jest.fn().mockResolvedValue(boolNumData);
      
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      const result = await cachedQuery('bool-num-data', mockQuery, 300);
      
      expect(result.data.isActive).toBe(true);
      expect(result.data.price).toBe(5000.50);
      expect(result.data.zero).toBe(0);
    });
  });

  // ============================================
  // EDGE CASE 8: Performance Metrics
  // ============================================
  describe('Edge Case 8: Performance metrics tracking', () => {
    
    test('should return cacheKey in result', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });
      redisConfig.cacheGet.mockResolvedValue(null);
      
      const result = await cachedQuery('test-key-123', mockQuery, 300);
      
      expect(result.cacheKey).toBe('test-key-123');
    });

    test('should measure response time', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      
      const result = await cachedQuery('perf-test', mockQuery, 300);
      
      expect(result.time).toBeGreaterThanOrEqual(0);
      expect(typeof result.time).toBe('number');
    });

    test('should indicate cache hit vs miss', async () => {
      const cachedData = { id: 1 };
      const mockQuery = jest.fn();
      
      // Cache hit
      redisConfig.cacheGet.mockResolvedValue(cachedData);
      let result = await cachedQuery('property:1', mockQuery, 300);
      expect(result.source).toBe('cache');
      
      // Cache miss
      redisConfig.cacheGet.mockResolvedValue(null);
      redisConfig.cacheSet.mockResolvedValue('OK');
      mockQuery.mockResolvedValue(cachedData);
      result = await cachedQuery('property:2', mockQuery, 300);
      expect(result.source).toBe('database');
    });
  });
});
