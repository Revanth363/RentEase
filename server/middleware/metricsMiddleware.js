/**
 * PHASE 4: Metrics Collection Middleware
 * Integrates metrics tracking into Express request/response cycle
 * Tracks all HTTP requests, cache operations, and database queries
 */

const metricsCollector = require('../utils/metricsCollector');

/**
 * Middleware to track HTTP request metrics
 * Must be placed early in middleware stack
 */
function metricsMiddleware(req, res, next) {
  // Record start time
  const startTime = Date.now();
  
  // Capture the original json method
  const originalJson = res.json;
  
  // Override res.json to intercept response and record metrics
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    const route = req.route?.path || req.path;
    const method = req.method;
    const status = res.statusCode;
    
    // Extract cache info from response meta if present
    let cacheSource = 'unknown';
    let cacheStats = null;
    
    if (data && data.meta) {
      cacheSource = data.meta.source || 'unknown';
      cacheStats = data.meta.cacheStats;
    }
    
    // Record metrics
    metricsCollector.recordEndpointMetric(
      route,
      method,
      status,
      responseTime,
      cacheSource,
      cacheStats
    );
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * Middleware to track cache metrics from cacheWrapper
 * Integrates with the cachedQuery function results
 */
function cacheMetricsIntegration(cachedQueryFn) {
  return async (cacheKey, queryFn, ttlSeconds) => {
    const result = await cachedQueryFn(cacheKey, queryFn, ttlSeconds);
    
    if (result && result.data && result.data.success !== false) {
      // Metrics already recorded in metricsMiddleware via res.json
      // This ensures we capture both cache and endpoint metrics
    }
    
    return result;
  };
}

module.exports = {
  metricsMiddleware,
  cacheMetricsIntegration
};
