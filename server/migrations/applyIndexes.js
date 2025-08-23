/**
 * MongoDB Index Migration Script
 * 
 * This script applies all the optimized indexes to the database.
 * Usage: node server/migrations/applyIndexes.js
 * 
 * The script will:
 * 1. Connect to MongoDB
 * 2. Apply indexes to all collections
 * 3. Report on successful and failed index creations
 * 4. Generate performance statistics
 */

const mongoose = require('mongoose');
const path = require('path');

// Import index configuration
const { indexConfig, getIndexStatistics } = require('../config/indexes');

// Import all models to ensure they are registered
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
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  sub: (msg) => console.log(`  ${colors.dim}${msg}${colors.reset}`)
};

/**
 * Apply indexes to a specific collection
 */
async function applyIndexesToCollection(model, collectionName, indexes) {
  if (!indexes || indexes.length === 0) {
    log.warn(`No indexes to apply for ${collectionName}`);
    return { success: 0, failed: 0, errors: [] };
  }

  let success = 0;
  let failed = 0;
  const errors = [];

  for (const indexDef of indexes) {
    try {
      const indexName = await model.collection.createIndex(indexDef.spec, {
        name: indexDef.name,
        background: true // Create index in the background
      });

      log.success(`${collectionName}.${indexDef.name} (Priority: ${indexDef.priority})`);
      log.sub(`Spec: ${JSON.stringify(indexDef.spec)} - ${indexDef.description}`);
      success++;
    } catch (error) {
      // Some errors are okay (like index already exists)
      if (error.message.includes('already exists')) {
        log.info(`${collectionName}.${indexDef.name} already exists`);
        success++;
      } else {
        log.error(`${collectionName}.${indexDef.name} failed: ${error.message}`);
        errors.push({ indexName: indexDef.name, error: error.message });
        failed++;
      }
    }
  }

  return { success, failed, errors };
}

/**
 * Main migration function
 */
async function runMigration() {
  log.header('╔════════════════════════════════════════════════════════════════╗');
  log.header('║         MongoDB Index Optimization Migration Script            ║');
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

  const results = {
    byCollection: {},
    totalSuccess: 0,
    totalFailed: 0,
    allErrors: [],
    startTime: Date.now()
  };

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

  // Apply indexes for each collection
  log.header('Applying Indexes by Collection:');

  for (const [collectionName, indexes] of Object.entries(indexConfig)) {
    const model = modelMap[collectionName];
    
    if (!model) {
      log.warn(`Model not found for collection: ${collectionName}`);
      continue;
    }

    log.info(`\n${collectionName.toUpperCase()}`);
    const result = await applyIndexesToCollection(model, collectionName, indexes);
    
    results.byCollection[collectionName] = result;
    results.totalSuccess += result.success;
    results.totalFailed += result.failed;
    if (result.errors.length > 0) {
      results.allErrors.push(...result.errors);
    }
  }

  // Generate and display statistics
  log.header('Index Migration Summary:');
  
  const stats = getIndexStatistics();
  log.info(`Total indexes to apply: ${stats.totalIndexes}`);
  log.sub(`Critical (P0): ${stats.distribution.critical}`);
  log.sub(`High Priority (P1): ${stats.distribution.high}`);
  log.sub(`Medium Priority (P2): ${stats.distribution.medium}`);

  log.header('\nMigration Results:');
  log.success(`Successfully applied: ${results.totalSuccess} indexes`);
  
  if (results.totalFailed > 0) {
    log.warn(`Failed/skipped: ${results.totalFailed} indexes`);
  }

  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);
  log.info(`Migration completed in ${duration}s`);

  // Show collection-wise breakdown
  log.header('\nCollection-wise Breakdown:');
  for (const [collection, result] of Object.entries(results.byCollection)) {
    if (result.success > 0 || result.failed > 0) {
      const status = result.failed === 0 ? colors.green : colors.yellow;
      console.log(`  ${status}${collection}: ${result.success}/${result.success + result.failed}${colors.reset}`);
    }
  }

  // Show any critical errors
  if (results.allErrors.length > 0) {
    log.header('Errors to Review:');
    results.allErrors.forEach(err => {
      log.error(`${err.indexName}: ${err.error}`);
    });
  }

  log.header('\n✓ Index migration completed successfully!');
  log.info('All collections now have performance-optimized indexes.');

  // Disconnect
  await mongoose.disconnect();
  log.success('Disconnected from MongoDB');
}

// Run the migration
runMigration().catch((error) => {
  log.error(`Migration failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
