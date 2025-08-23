/**
 * Redis Configuration and Connection Manager
 * Phase 3: Caching Layer for Query Optimization
 * 
 * This module provides Redis connection management and caching utilities
 * for the optimized database queries from Phase 2.
 */

const redis = require('redis');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 * Uses environment variable REDIS_URL or defaults to localhost
 * Falls back gracefully if Redis is unavailable
 */
async function initializeRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        connectTimeout: 5000,
      },
      legacyMode: false
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready to accept commands');
    });

    await redisClient.connect();
    isConnected = true;
    console.log('[Redis] Initialization successful');
    return true;
  } catch (error) {
    console.warn('[Redis] Failed to initialize - caching disabled:', error.message);
    console.warn('[Redis] Application will continue without caching layer');
    isConnected = false;
    return false;
  }
}

/**
 * Get Redis client
 * Returns null if not connected - callers should handle gracefully
 */
function getRedisClient() {
  return isConnected ? redisClient : null;
}

/**
 * Check if Redis is connected
 */
function isRedisConnected() {
  return isConnected;
}

/**
 * Cache data with TTL (Time To Live)
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be JSON stringified)
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {boolean} - Success status
 */
async function cacheSet(key, data, ttlSeconds = 300) {
  if (!isConnected || !redisClient) return false;
  
  try {
    const serialized = JSON.stringify(data);
    await redisClient.setEx(key, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.warn(`[Redis] Cache set failed for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Retrieve cached data
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found/expired
 */
async function cacheGet(key) {
  if (!isConnected || !redisClient) return null;
  
  try {
    const cached = await redisClient.get(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (error) {
    console.warn(`[Redis] Cache get failed for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Delete cache entry
 * @param {string} key - Cache key
 * @returns {boolean} - Success status
 */
async function cacheDel(key) {
  if (!isConnected || !redisClient) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.warn(`[Redis] Cache delete failed for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete multiple cache entries by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'dashboard:tenant:*')
 * @returns {number} - Number of keys deleted
 */
async function cacheDelPattern(pattern) {
  if (!isConnected || !redisClient) return 0;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    
    await redisClient.del(keys);
    return keys.length;
  } catch (error) {
    console.warn(`[Redis] Pattern delete failed for ${pattern}:`, error.message);
    return 0;
  }
}

/**
 * Flush all cache
 * USE WITH CAUTION - clears entire Redis database
 */
async function cacheFlushAll() {
  if (!isConnected || !redisClient) return false;
  
  try {
    await redisClient.flushAll();
    console.log('[Redis] All cache flushed');
    return true;
  } catch (error) {
    console.warn('[Redis] Flush all failed:', error.message);
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {object} - Redis statistics
 */
async function getCacheStats() {
  if (!isConnected || !redisClient) {
    return { connected: false };
  }
  
  try {
    const info = await redisClient.info();
    const dbSize = await redisClient.dbSize();
    
    return {
      connected: true,
      dbSize,
      info: info.substring(0, 500) // First 500 chars of info
    };
  } catch (error) {
    console.warn('[Redis] Stats retrieval failed:', error.message);
    return { connected: false, error: error.message };
  }
}

/**
 * Close Redis connection gracefully
 */
async function closeRedis() {
  if (redisClient && isConnected) {
    try {
      await redisClient.quit();
      isConnected = false;
      console.log('[Redis] Connection closed gracefully');
    } catch (error) {
      console.error('[Redis] Error closing connection:', error.message);
    }
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  cacheSet,
  cacheGet,
  cacheDel,
  cacheDelPattern,
  cacheFlushAll,
  getCacheStats,
  closeRedis
};
