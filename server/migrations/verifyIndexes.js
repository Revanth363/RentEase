/**
 * MongoDB Index Verification Script
 * 
 * This script verifies that all indexes have been properly created.
 * Usage: node server/migrations/verifyIndexes.js
 * 
 * The script will:
 * 1. Connect to MongoDB
 * 2. Check all collections for expected indexes
 * 3. List existing indexes
 * 4. Identify missing or extra indexes
 * 5. Generate a verification report
 */

const mongoose = require('mongoose');

// Import index configuration
const { indexConfig } = require('../config/indexes');

// Import all models
require('../models/property');
require('../models/tenant');
require('../models/owner');
require('../models/worker');
require('../models/payment');
require('../models/booking');
require('../models/MaintenanceRequest');
require('../models/notification');
require('../models/workerBooking');
require('../models/workerPayment');
require('../models/Agreement');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  table: (data) => console.table(data),
  line: () => console.log(colors.gray + '─'.repeat(80) + colors.reset)
};

/**
 * Convert spec object to index array format
 * Input: { ownerId: 1, status: 1 }
 * Output: [["ownerId", 1], ["status", 1]]
 */
function specToIndexArray(spec) {
  return Object.entries(spec)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => [key, value]);
}

/**
 * Check if index spec exists in the collection
 */
function indexSpecExists(existingIndexes, expectedSpec) {
  const expectedArray = specToIndexArray(expectedSpec);
  const expectedStr = JSON.stringify(expectedArray);

  // Check each existing index
  for (const [indexName, indexArray] of Object.entries(existingIndexes)) {
    if (indexName === '_id_') continue; // Skip default _id index
    
    const indexArraySorted = (Array.isArray(indexArray) ? indexArray : [])
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    
    if (JSON.stringify(indexArraySorted) === expectedStr) {
      return true; // Exact match found
    }
  }
  
  return false;
}

/**
 * Verify indexes for a specific collection
 */
async function verifyCollectionIndexes(model, collectionName, expectedIndexes) {
  if (!expectedIndexes || expectedIndexes.length === 0) {
    return { collection: collectionName, status: 'SKIP', reason: 'No indexes defined' };
  }

  try {
    // Get existing indexes
    const existingIndexes = await model.collection.getIndexes();
    
    const missing = [];
    const present = [];
    
    // Check each expected index
    expectedIndexes.forEach(idx => {
      if (indexSpecExists(existingIndexes, idx.spec)) {
        present.push(idx.name);
      } else {
        missing.push(idx.name);
      }
    });

    // Count extra indexes (excluding _id)
    const extraIndexNames = Object.keys(existingIndexes)
      .filter(name => name !== '_id_');

    const allPresent = missing.length === 0;

    return {
      collection: collectionName,
      status: allPresent ? 'PASS' : 'FAIL',
      expected: expectedIndexes.length,
      existing: extraIndexNames.length,
      present: present.length,
      missing,
      extra: extraIndexNames,
      details: {
        expectedIndexes: expectedIndexes.map(idx => ({
          name: idx.name,
          spec: idx.spec,
          priority: idx.priority,
          present: present.includes(idx.name)
        })),
        existingIndexNames: Object.keys(existingIndexes)
      }
    };
  } catch (error) {
    return {
      collection: collectionName,
      status: 'ERROR',
      error: error.message
    };
  }
}

/**
 * Main verification function
 */
async function verifyIndexes() {
  log.header('╔════════════════════════════════════════════════════════════════╗');
  log.header('║         MongoDB Index Verification Script                     ║');
  log.header('╚════════════════════════════════════════════════════════════════╝');

  // Connect to MongoDB
  log.info('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://revanthkumardompaka:qqo8F9xCiY5DPQLT@ffsd.pjcw0o6.mongodb.net/rentease', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }

  // Map of collection names to their models
  const modelMap = {
    property: mongoose.model('Property'),
    tenant: mongoose.model('Tenant'),
    owner: mongoose.model('Owner'),
    worker: mongoose.model('Worker'),
    payment: mongoose.model('Payment'),
    booking: mongoose.model('Booking'),
    maintenanceRequest: mongoose.model('MaintenanceRequest'),
    notification: mongoose.model('Notification'),
    workerBooking: mongoose.model('WorkerBooking'),
    workerPayment: mongoose.model('WorkerPayment'),
    agreement: mongoose.model('Agreement')
  };

  const verificationResults = [];
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;

  // Verify indexes for each collection
  log.header('Verifying Indexes:');
  log.line();

  for (const [collectionName, expectedIndexes] of Object.entries(indexConfig)) {
    const model = modelMap[collectionName];
    
    if (!model) {
      log.warning(`Model not found for collection: ${collectionName}`);
      continue;
    }

    const result = await verifyCollectionIndexes(model, collectionName, expectedIndexes);
    verificationResults.push(result);

    // Display result
    if (result.status === 'PASS') {
      log.success(`${collectionName}: All ${result.expected} indexes present`);
      passCount++;
    } else if (result.status === 'FAIL') {
      log.error(`${collectionName}: ${result.missing.length} missing indexes`);
      result.missing.forEach(indexName => {
        log.info(`  Missing: ${indexName}`);
      });
      failCount++;
    } else if (result.status === 'ERROR') {
      log.error(`${collectionName}: ${result.error}`);
      errorCount++;
    }

    // Show extra indexes if any
    if (result.extra && result.extra.length > 0) {
      log.warning(`${collectionName}: ${result.extra.length} extra indexes found`);
      result.extra.forEach(indexName => {
        log.info(`  Extra: ${indexName}`);
      });
    }
  }

  // Summary
  log.header('Verification Summary:');
  log.line();
  
  const totalCollections = passCount + failCount + errorCount;
  log.info(`Total collections checked: ${totalCollections}`);
  log.success(`Passed: ${passCount}`);
  
  if (failCount > 0) {
    log.error(`Failed: ${failCount}`);
  }
  if (errorCount > 0) {
    log.error(`Errors: ${errorCount}`);
  }

  // Detailed statistics
  log.header('Index Statistics:');
  log.line();

  let totalExpectedIndexes = 0;
  let totalPresentIndexes = 0;

  const statsData = verificationResults
    .filter(r => r.status !== 'SKIP' && r.status !== 'ERROR')
    .map(r => {
      totalExpectedIndexes += r.expected;
      totalPresentIndexes += r.present;
      return {
        Collection: r.collection,
        'Expected': r.expected,
        'Present': r.present,
        'Missing': r.missing.length,
        'Extra': r.extra.length,
        'Status': r.status === 'PASS' ? '✓ PASS' : '✗ FAIL'
      };
    });

  log.table(statsData);

  console.log(`\nTotal expected indexes: ${totalExpectedIndexes}`);
  console.log(`Total present indexes: ${totalPresentIndexes}`);
  console.log(`Coverage: ${((totalPresentIndexes / totalExpectedIndexes) * 100).toFixed(1)}%`);

  // Overall result
  log.header('Overall Result:');
  log.line();

  if (failCount === 0 && errorCount === 0) {
    log.success('✓ All indexes verified successfully!');
    log.info('Your database is optimized with all critical indexes in place.');
  } else {
    log.error('✗ Some indexes are missing or errors occurred.');
    log.info('Please run: node server/migrations/applyIndexes.js');
  }

  // Disconnect
  await mongoose.disconnect();
  log.success('\nDisconnected from MongoDB');

  // Exit with appropriate code
  process.exit(failCount > 0 || errorCount > 0 ? 1 : 0);
}

// Run verification
verifyIndexes().catch((error) => {
  log.error(`Verification failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
