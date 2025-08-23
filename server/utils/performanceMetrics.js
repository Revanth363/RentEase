/**
 * Phase 2: Performance Metrics & Comparison Script
 * 
 * This script measures query performance before and after optimization.
 * It tracks query counts, response times, and provides detailed metrics.
 */

class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Track a query or operation
   */
  track(operation, duration, queryCount = 1) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalTime: 0,
        totalQueries: 0,
        min: Infinity,
        max: 0,
        samples: []
      });
    }

    const metric = this.metrics.get(operation);
    metric.count++;
    metric.totalTime += duration;
    metric.totalQueries += queryCount;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);
    metric.samples.push({ duration, queryCount, timestamp: new Date() });

    // Keep only last 100 samples
    if (metric.samples.length > 100) {
      metric.samples.shift();
    }
  }

  /**
   * Get average metrics for an operation
   */
  getMetrics(operation) {
    const metric = this.metrics.get(operation);
    if (!metric || metric.count === 0) return null;

    return {
      operation,
      samples: metric.count,
      avgTime: Math.round(metric.totalTime / metric.count),
      minTime: metric.min,
      maxTime: metric.max,
      totalQueries: metric.totalQueries,
      avgQueriesPerCall: Math.round((metric.totalQueries / metric.count) * 100) / 100,
      totalTime: metric.totalTime
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const all = [];
    for (const [operation] of this.metrics) {
      all.push(this.getMetrics(operation));
    }
    return all;
  }

  /**
   * Generate comparison report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: PERFORMANCE METRICS REPORT');
    console.log('='.repeat(80));

    const metrics = this.getAllMetrics();
    metrics.sort((a, b) => b.totalTime - a.totalTime);

    // Summary table
    console.log('\n📊 OPERATION METRICS:');
    console.log('-'.repeat(80));
    console.table(metrics.map(m => ({
      'Operation': m.operation,
      'Avg Time (ms)': m.avgTime,
      'Min/Max (ms)': `${m.minTime}/${m.maxTime}`,
      'Samples': m.samples,
      'Avg Queries': m.avgQueriesPerCall,
      'Total Time (ms)': m.totalTime
    })));

    // Performance summary
    const totalAvgTime = metrics.reduce((sum, m) => sum + m.avgTime, 0) / metrics.length;
    const totalQueries = metrics.reduce((sum, m) => sum + m.totalQueries, 0);
    const totalCalls = metrics.reduce((sum, m) => sum + m.samples, 0);

    console.log('\n📈 SUMMARY STATISTICS:');
    console.log('-'.repeat(80));
    console.log(`  Total Operations Tracked: ${metrics.length}`);
    console.log(`  Total Function Calls: ${totalCalls}`);
    console.log(`  Total Database Queries: ${totalQueries}`);
    console.log(`  Average Queries Per Call: ${Math.round((totalQueries / totalCalls) * 100) / 100}`);
    console.log(`  Average Response Time: ${Math.round(totalAvgTime)}ms`);
    console.log(`  Total Time: ${metrics.reduce((sum, m) => sum + m.totalTime, 0)}ms`);

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Compare two metric points
   */
  compareMetrics(operation1, operation2) {
    const m1 = this.getMetrics(operation1);
    const m2 = this.getMetrics(operation2);

    if (!m1 || !m2) {
      console.log('One or both operations not found');
      return null;
    }

    const timeImprovement = ((m1.avgTime - m2.avgTime) / m1.avgTime * 100).toFixed(1);
    const queryImprovement = ((m1.avgQueriesPerCall - m2.avgQueriesPerCall) / m1.avgQueriesPerCall * 100).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log(`COMPARISON: ${operation1} vs ${operation2}`);
    console.log('='.repeat(60));
    console.table({
      [operation1]: {
        'Avg Time (ms)': m1.avgTime,
        'Avg Queries': m1.avgQueriesPerCall,
        'Samples': m1.samples
      },
      [operation2]: {
        'Avg Time (ms)': m2.avgTime,
        'Avg Queries': m2.avgQueriesPerCall,
        'Samples': m2.samples
      }
    });

    console.log(`\n✨ IMPROVEMENTS:`);
    console.log(`  Response Time: ${timeImprovement}% faster`);
    console.log(`  Query Count: ${queryImprovement}% fewer queries`);
    console.log('='.repeat(60) + '\n');

    return {
      timeImprovement: parseFloat(timeImprovement),
      queryImprovement: parseFloat(queryImprovement)
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
  }

  /**
   * Get metrics as JSON
   */
  toJSON() {
    return {
      metrics: this.getAllMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Expected Phase 2 Performance Baselines
 */
const PHASE_2_BASELINES = {
  // Before optimization
  before: {
    'ownerController.getOwnerDashboard': {
      expectedTime: 3500,
      expectedQueries: 18,
      description: '15-20 queries for properties, tenants, payments, etc.'
    },
    'tenantController.getDashboard': {
      expectedTime: 2000,
      expectedQueries: 18,
      description: '15-20 queries for current property, maintenance, complaints, etc.'
    },
    'superadminController.getPlatformStats': {
      expectedTime: 5000,
      expectedQueries: 9,
      description: '8-10 separate aggregation queries for statistics'
    },
    'superadminownerController.getOwnerEarnings': {
      expectedTime: 8000,
      expectedQueries: 500,
      description: '400-600 queries in nested loops'
    },
    'adminMaintenanceController.getAllMaintenanceRequests': {
      expectedTime: 1500,
      expectedQueries: 15,
      description: '10-20 queries with nested populates'
    },
    'superadminfinancialController.getFinancialAnalytics': {
      expectedTime: 3000,
      expectedQueries: 3,
      description: '2-4 separate aggregation queries'
    },
    'workerController.renderWorkerDashboardSafer': {
      expectedTime: 1800,
      expectedQueries: 12,
      description: '8-15 queries for worker data'
    },
    'propertyController.searchProperties': {
      expectedTime: 2500,
      expectedQueries: 8,
      description: 'Multiple queries with regex + populates'
    }
  },

  // After optimization
  after: {
    'ownerController.getOwnerDashboard': {
      expectedTime: 900,
      expectedQueries: 2,
      description: '1 aggregation pipeline + 1 simple lookup'
    },
    'tenantController.getDashboard': {
      expectedTime: 400,
      expectedQueries: 2,
      description: '1 aggregation pipeline + 1 simple lookup'
    },
    'superadminController.getPlatformStats': {
      expectedTime: 600,
      expectedQueries: 1,
      description: '1 $facet aggregation with all stats'
    },
    'superadminownerController.getOwnerEarnings': {
      expectedTime: 1200,
      expectedQueries: 1,
      description: '1 aggregation with unwind + group'
    },
    'adminMaintenanceController.getAllMaintenanceRequests': {
      expectedTime: 200,
      expectedQueries: 1,
      description: '1 aggregation with lookups'
    },
    'superadminfinancialController.getFinancialAnalytics': {
      expectedTime: 300,
      expectedQueries: 1,
      description: '1 $facet aggregation'
    },
    'workerController.renderWorkerDashboardSafer': {
      expectedTime: 400,
      expectedQueries: 1,
      description: '1 aggregation pipeline'
    },
    'propertyController.searchProperties': {
      expectedTime: 300,
      expectedQueries: 1,
      description: '1 aggregation with $match + $lookup'
    }
  }
};

/**
 * Validate performance metrics against targets
 */
function validatePerformance(operation, actualTime, actualQueries, expectedTarget = 'after') {
  const baseline = PHASE_2_BASELINES[expectedTarget][operation];
  if (!baseline) return null;

  const timeMet = actualTime <= baseline.expectedTime * 1.1; // 10% buffer
  const queriesMet = actualQueries <= baseline.expectedQueries * 1.1;

  return {
    operation,
    actualTime,
    expectedTime: baseline.expectedTime,
    timeMet,
    timeStatus: timeMet ? '✓ PASS' : '✗ FAIL',
    actualQueries,
    expectedQueries: baseline.expectedQueries,
    queriesMet,
    queryStatus: queriesMet ? '✓ PASS' : '✗ FAIL',
    improvement: {
      timeVsBefore: ((PHASE_2_BASELINES.before[operation].expectedTime - actualTime) / PHASE_2_BASELINES.before[operation].expectedTime * 100).toFixed(1) + '%',
      queriesVsBefore: ((PHASE_2_BASELINES.before[operation].expectedQueries - actualQueries) / PHASE_2_BASELINES.before[operation].expectedQueries * 100).toFixed(1) + '%'
    }
  };
}

/**
 * Generate performance report comparing all operations
 */
function generateComparisonReport() {
  console.log('\n' + '='.repeat(100));
  console.log('PHASE 2: EXPECTED PERFORMANCE IMPROVEMENTS');
  console.log('='.repeat(100));

  const operations = Object.keys(PHASE_2_BASELINES.before);
  const improvements = [];

  console.log('\n📊 OPERATION-BY-OPERATION COMPARISON:\n');

  operations.forEach(op => {
    const before = PHASE_2_BASELINES.before[op];
    const after = PHASE_2_BASELINES.after[op];

    const timeImprovement = ((before.expectedTime - after.expectedTime) / before.expectedTime * 100).toFixed(1);
    const queryImprovement = ((before.expectedQueries - after.expectedQueries) / before.expectedQueries * 100).toFixed(1);

    improvements.push({
      'Operation': op.split('.')[1],
      'Before Time': `${before.expectedTime}ms`,
      'After Time': `${after.expectedTime}ms`,
      'Time Gain': `${timeImprovement}%`,
      'Before Queries': before.expectedQueries,
      'After Queries': after.expectedQueries,
      'Query Gain': `${queryImprovement}%`
    });

    console.log(`${op}:`);
    console.log(`  Before: ${before.expectedTime}ms, ${before.expectedQueries} queries`);
    console.log(`  After:  ${after.expectedTime}ms, ${after.expectedQueries} queries`);
    console.log(`  Gain:   ${timeImprovement}% faster, ${queryImprovement}% fewer queries`);
    console.log('');
  });

  console.log('📈 SUMMARY TABLE:\n');
  console.table(improvements);

  // Calculate averages
  const avgTimeBefore = Object.values(PHASE_2_BASELINES.before)
    .reduce((sum, op) => sum + op.expectedTime, 0) / operations.length;
  const avgTimeAfter = Object.values(PHASE_2_BASELINES.after)
    .reduce((sum, op) => sum + op.expectedTime, 0) / operations.length;
  const avgQueriesBefore = Object.values(PHASE_2_BASELINES.before)
    .reduce((sum, op) => sum + op.expectedQueries, 0) / operations.length;
  const avgQueriesAfter = Object.values(PHASE_2_BASELINES.after)
    .reduce((sum, op) => sum + op.expectedQueries, 0) / operations.length;

  const avgTimeGain = ((avgTimeBefore - avgTimeAfter) / avgTimeBefore * 100).toFixed(1);
  const avgQueryGain = ((avgQueriesBefore - avgQueriesAfter) / avgQueriesBefore * 100).toFixed(1);

  console.log('\n🎯 OVERALL IMPACT:');
  console.log(`  Average Response Time: ${Math.round(avgTimeBefore)}ms → ${Math.round(avgTimeAfter)}ms (${avgTimeGain}% improvement)`);
  console.log(`  Average Queries: ${Math.round(avgQueriesBefore)} → ${Math.round(avgQueriesAfter)} (${avgQueryGain}% reduction)`);

  console.log('='.repeat(100) + '\n');
}

// Export for use in controllers
module.exports = {
  PerformanceMetrics,
  PHASE_2_BASELINES,
  validatePerformance,
  generateComparisonReport
};

// Usage example:
/*
const { PerformanceMetrics } = require('./utils/performanceMetrics');

const metrics = new PerformanceMetrics();

// Track operations
metrics.track('ownerController.getOwnerDashboard', 234, 1);
metrics.track('ownerController.getOwnerDashboard', 245, 1);
metrics.track('ownerController.getOwnerDashboard', 256, 1);

// Generate report
metrics.generateReport();

// Compare operations
metrics.compareMetrics('op1', 'op2');

// Validate against targets
const validation = validatePerformance(
  'ownerController.getOwnerDashboard',
  234,  // actual time
  1,    // actual queries
  'after'
);
*/
