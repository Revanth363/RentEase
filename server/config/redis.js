/**
 * Redis Configuration and Connection Manager
 * Phase 3: Caching Layer for Query Optimization
 * 
 * Supports two modes:
 * 1. Local/Direct Redis: For development (docker-compose)
 * 2. Upstash REST API: For production deployment
 */

const redis = require('redis');

let redisClient = null;
let isConnected = false;
let useUpstash = false;

// Upstash REST API client
class UpstashRedisClient {
  constructor(restUrl, restToken) {
    this.restUrl = restUrl.replace(/\/$/, ''); // Remove trailing slash
    this.restToken = restToken;
  }

  async executeCommand(command) {
    try {
      // Build URL path from command array
      const path = command.map(arg => encodeURIComponent(arg)).join('/');
      const url = `${this.restUrl}/${path}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.restToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Upstash API error: ${response.statusText}`);
      }

      const data = await response.json();
      // Upstash returns { result: value } directly
      return data.result;
    } catch (error) {
      console.error('[Upstash] API call failed:', error.message);
      return null;
    }
  }

  async set(key, value, ttl) {
    const command = ttl 
      ? ['SET', key, value, 'EX', ttl.toString()]
      : ['SET', key, value];
    return await this.executeCommand(command);
  }

  async get(key) {
    return await this.executeCommand(['GET', key]);
  }

  async del(key) {
    return await this.executeCommand(['DEL', key]);
  }

  async keys(pattern) {
    return await this.executeCommand(['KEYS', pattern]);
  }

  async flushAll() {
    return await this.executeCommand(['FLUSHALL']);
  }

  async info() {
    return await this.executeCommand(['INFO']);
  }

  async dbSize() {
    return await this.executeCommand(['DBSIZE']);
  }
}

/**
 * Initialize Redis connection
 * Detects Upstash credentials first, falls back to local Redis
 */
async function initializeRedis() {
  try {
    // Check if using Upstash (production)
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
      console.log('[Redis] Initializing with Upstash REST API...');
      redisClient = new UpstashRedisClient(upstashUrl, upstashToken);
      useUpstash = true;
      isConnected = true;
      console.log('[Redis] Upstash REST API connected');
      return true;
    }

    // Fall back to local Redis (development)
    console.log('[Redis] Initializing with local Redis connection...');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        connectTimeout: 5000,
      },
      legacyMode: false,
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

    if (useUpstash) {
      await redisClient.set(key, serialized, ttlSeconds);
    } else {
      await redisClient.setEx(key, ttlSeconds, serialized);
    }

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
    let cached;

    if (useUpstash) {
      cached = await redisClient.get(key);
    } else {
      cached = await redisClient.get(key);
    }

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
    if (useUpstash) {
      await redisClient.del(key);
    } else {
      await redisClient.del(key);
    }

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
    let keys;

    if (useUpstash) {
      keys = await redisClient.keys(pattern);
    } else {
      keys = await redisClient.keys(pattern);
    }

    if (!keys || keys.length === 0) return 0;

    for (const key of keys) {
      if (useUpstash) {
        await redisClient.del(key);
      } else {
        await redisClient.del(key);
      }
    }

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
    if (useUpstash) {
      await redisClient.flushAll();
    } else {
      await redisClient.flushAll();
    }

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
    let dbSize;

    if (useUpstash) {
      dbSize = await redisClient.dbSize();
    } else {
      dbSize = await redisClient.dbSize();
    }

    return {
      connected: true,
      dbSize,
      mode: useUpstash ? 'Upstash REST API' : 'Local Redis',
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
      if (!useUpstash && redisClient.quit) {
        await redisClient.quit();
      }
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
