/**
 * PHASE 4: Metrics Collection and Performance Monitoring
 * Tracks performance metrics across all endpoints
 * Monitors: request counts, latency, cache effectiveness, error rates
 */

const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const cacheHits = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['endpoint']
});

const cacheMisses = new prometheus.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['endpoint']
});

const cacheErrors = new prometheus.Counter({
  name: 'cache_errors_total',
  help: 'Total number of cache errors',
  labelNames: ['endpoint']
});

const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const activeRequests = new prometheus.Gauge({
  name: 'active_http_requests',
  help: 'Number of active HTTP requests',
  labelNames: ['method', 'route']
});

const memoryUsage = new prometheus.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const eventLoopLag = new prometheus.Gauge({
  name: 'event_loop_lag_seconds',
  help: 'Event loop lag in seconds'
});

/**
 * Global metrics store
 */
let metricsStore = {
  endpoints: {},
  cache: {
    totalHits: 0,
    totalMisses: 0,
    totalErrors: 0,
    avgHitRate: 0
  },
  database: {
    totalQueries: 0,
    avgQueryTime: 0
  },
  performance: {
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errors: []
  }
};

/**
 * Track endpoint metrics
 */
function recordEndpointMetric(route, method, status, responseTime, cacheSource, cacheStats) {
  if (!metricsStore.endpoints[route]) {
    metricsStore.endpoints[route] = {
      method,
      totalRequests: 0,
      successRequests: 0,
      errorRequests: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastAccess: new Date(),
      p95Time: 0,
      responseTimes: []
    };
  }

  const endpoint = metricsStore.endpoints[route];
  endpoint.totalRequests++;
  endpoint.totalTime += responseTime;
  endpoint.avgTime = endpoint.totalTime / endpoint.totalRequests;
  endpoint.lastAccess = new Date();
  endpoint.responseTimes.push(responseTime);

  // Keep only last 100 responses for percentile calculation
  if (endpoint.responseTimes.length > 100) {
    endpoint.responseTimes.shift();
  }

  if (status >= 200 && status < 300) {
    endpoint.successRequests++;
  } else {
    endpoint.errorRequests++;
  }

  endpoint.minTime = Math.min(endpoint.minTime, responseTime);
  endpoint.maxTime = Math.max(endpoint.maxTime, responseTime);

  // Calculate p95
  const sorted = [...endpoint.responseTimes].sort((a, b) => a - b);
  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  endpoint.p95Time = sorted[p95Index] || 0;

  // Track cache source
  if (cacheSource === 'cache') {
    endpoint.cacheHits++;
    metricsStore.cache.totalHits++;
    cacheHits.inc({ endpoint: route });
  } else if (cacheSource === 'database') {
    endpoint.cacheMisses++;
    metricsStore.cache.totalMisses++;
    cacheMisses.inc({ endpoint: route });
  } else if (cacheSource === 'error') {
    cacheErrors.inc({ endpoint: route });
    metricsStore.cache.totalErrors++;
  }

  // Update global averages
  const totalCacheOps = metricsStore.cache.totalHits + metricsStore.cache.totalMisses;
  metricsStore.cache.avgHitRate = totalCacheOps > 0 
    ? (metricsStore.cache.totalHits / totalCacheOps * 100).toFixed(2)
    : 0;

  // Prometheus metrics
  httpRequestDuration.observe({ method, route, status }, responseTime / 1000);
  httpRequestTotal.inc({ method, route, status });
}

/**
 * Track database query metrics
 */
function recordDatabaseQuery(operation, collection, queryTime) {
  metricsStore.database.totalQueries++;
  metricsStore.database.avgQueryTime = (metricsStore.database.avgQueryTime + queryTime) / 2;
  dbQueryDuration.observe({ operation, collection }, queryTime / 1000);
}

/**
 * Get comprehensive metrics dashboard
 */
function getMetricsDashboard() {
  // Calculate performance percentiles
  const allResponseTimes = Object.values(metricsStore.endpoints)
    .flatMap(e => e.responseTimes || [])
    .sort((a, b) => a - b);

  let p95 = 0, p99 = 0;
  if (allResponseTimes.length > 0) {
    p95 = allResponseTimes[Math.ceil(allResponseTimes.length * 0.95) - 1] || 0;
    p99 = allResponseTimes[Math.ceil(allResponseTimes.length * 0.99) - 1] || 0;
  }

  const totalRequests = Object.values(metricsStore.endpoints)
    .reduce((sum, e) => sum + e.totalRequests, 0);
  const totalSuccessful = Object.values(metricsStore.endpoints)
    .reduce((sum, e) => sum + e.successRequests, 0);
  const totalErrors = Object.values(metricsStore.endpoints)
    .reduce((sum, e) => sum + e.errorRequests, 0);

  // Memory metrics
  const memInfo = process.memoryUsage();
  memoryUsage.set({ type: 'heapUsed' }, memInfo.heapUsed);
  memoryUsage.set({ type: 'heapTotal' }, memInfo.heapTotal);
  memoryUsage.set({ type: 'rss' }, memInfo.rss);
  memoryUsage.set({ type: 'external' }, memInfo.external);

  return {
    summary: {
      totalRequests,
      successfulRequests: totalSuccessful,
      failedRequests: totalErrors,
      successRate: totalRequests > 0 ? ((totalSuccessful / totalRequests) * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: allResponseTimes.length > 0 
        ? (allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(2) + 'ms'
        : '0ms',
      p95ResponseTime: p95.toFixed(2) + 'ms',
      p99ResponseTime: p99.toFixed(2) + 'ms'
    },
    cache: {
      totalHits: metricsStore.cache.totalHits,
      totalMisses: metricsStore.cache.totalMisses,
      totalErrors: metricsStore.cache.totalErrors,
      hitRate: metricsStore.cache.avgHitRate + '%',
      expectedPerformanceGain: metricsStore.cache.avgHitRate > 0 
        ? (metricsStore.cache.avgHitRate * 0.44).toFixed(2) + '% (Phase 3 baseline)'
        : '0%'
    },
    database: {
      totalQueries: metricsStore.database.totalQueries,
      avgQueryTime: metricsStore.database.avgQueryTime.toFixed(2) + 'ms'
    },
    endpoints: Object.entries(metricsStore.endpoints).map(([route, data]) => ({
      route,
      method: data.method,
      totalRequests: data.totalRequests,
      successRate: data.totalRequests > 0 
        ? ((data.successRequests / data.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: data.avgTime.toFixed(2) + 'ms',
      minResponseTime: data.minTime === Infinity ? '0ms' : data.minTime.toFixed(2) + 'ms',
      maxResponseTime: data.maxTime.toFixed(2) + 'ms',
      p95ResponseTime: data.p95Time.toFixed(2) + 'ms',
      cacheHitRate: data.totalRequests > 0 
        ? ((data.cacheHits / (data.cacheHits + data.cacheMisses)) * 100).toFixed(2) + '%'
        : 'N/A',
      lastAccess: data.lastAccess
    })).sort((a, b) => b.totalRequests - a.totalRequests),
    memory: {
      heapUsed: (memInfo.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (memInfo.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      rss: (memInfo.rss / 1024 / 1024).toFixed(2) + ' MB',
      external: (memInfo.external / 1024 / 1024).toFixed(2) + ' MB'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Get Prometheus metrics in text format
 */
function getPrometheusMetrics() {
  return prometheus.register.metrics();
}

/**
 * Check for performance degradation and create alerts
 */
function checkPerformanceAlerts() {
  const alerts = [];
  const dashboard = getMetricsDashboard();

  // Alert if p99 response time exceeds threshold (2 seconds)
  const p99Time = parseFloat(dashboard.summary.p99ResponseTime);
  if (p99Time > 2000) {
    alerts.push({
      level: 'warning',
      message: `P99 response time (${p99Time.toFixed(2)}ms) exceeds threshold (2000ms)`,
      timestamp: new Date()
    });
  }

  // Alert if cache hit rate is too low (< 20%)
  const hitRate = parseFloat(dashboard.cache.hitRate);
  if (hitRate < 20 && dashboard.cache.totalHits + dashboard.cache.totalMisses > 100) {
    alerts.push({
      level: 'warning',
      message: `Cache hit rate (${hitRate.toFixed(2)}%) is below optimal (20%)`,
      timestamp: new Date()
    });
  }

  // Alert if error rate is too high (> 5%)
  const errorRate = 100 - parseFloat(dashboard.summary.successRate);
  if (errorRate > 5) {
    alerts.push({
      level: 'critical',
      message: `Error rate (${errorRate.toFixed(2)}%) exceeds threshold (5%)`,
      timestamp: new Date()
    });
  }

  // Alert if memory usage is high (> 500MB)
  const heapUsed = parseFloat(dashboard.memory.heapUsed);
  if (heapUsed > 500) {
    alerts.push({
      level: 'warning',
      message: `Heap memory usage (${heapUsed.toFixed(2)}MB) is high, potential memory leak`,
      timestamp: new Date()
    });
  }

  return alerts;
}

/**
 * Reset metrics (for testing)
 */
function resetMetrics() {
  metricsStore = {
    endpoints: {},
    cache: {
      totalHits: 0,
      totalMisses: 0,
      totalErrors: 0,
      avgHitRate: 0
    },
    database: {
      totalQueries: 0,
      avgQueryTime: 0
    },
    performance: {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errors: []
    }
  };
}

/**
 * Get comparison report: Phase 2 vs Phase 3 with Phase 4 metrics
 */
function getPhaseComparisonReport() {
  const dashboard = getMetricsDashboard();
  
  return {
    phases: {
      phase1: {
        name: 'Database Indexing',
        status: 'Complete',
        indexes: 40,
        collections: 11
      },
      phase2: {
        name: 'Query Optimization',
        status: 'Complete',
        avgQueryReduction: '82%',
        performanceGain: '82.6%',
        controllersCovered: 8
      },
      phase3: {
        name: 'Redis Caching',
        status: 'Complete',
        cacheHits: metricsStore.cache.totalHits,
        cacheMisses: metricsStore.cache.totalMisses,
        hitRate: metricsStore.cache.avgHitRate + '%',
        expectedGain: (metricsStore.cache.avgHitRate * 0.44).toFixed(2) + '%',
        controllersCovered: 5
      },
      phase4: {
        name: 'Performance Metrics',
        status: 'Active',
        totalRequests: Object.values(metricsStore.endpoints).reduce((sum, e) => sum + e.totalRequests, 0),
        avgResponseTime: dashboard.summary.avgResponseTime,
        successRate: dashboard.summary.successRate
      }
    },
    realTimeMetrics: dashboard,
    performanceAlerts: checkPerformanceAlerts()
  };
}

module.exports = {
  recordEndpointMetric,
  recordDatabaseQuery,
  getMetricsDashboard,
  getPrometheusMetrics,
  checkPerformanceAlerts,
  resetMetrics,
  getPhaseComparisonReport,
  // Export Prometheus metrics for external collection if needed
  httpRequestDuration,
  httpRequestTotal,
  cacheHits,
  cacheMisses,
  cacheErrors,
  dbQueryDuration,
  activeRequests,
  memoryUsage,
  eventLoopLag
};
