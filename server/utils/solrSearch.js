/**
 * PHASE 5: Solr Search Wrapper
 * Unified search interface with automatic fallback to MongoDB
 * Tracks search performance and automatically selects best strategy
 */

const { isSolrConnected, executeSolrQuery } = require('../config/solr');
const Property = require('../models/property');
const metricsCollector = require('./metricsCollector');

// Search statistics
let searchStats = {
  solrQueries: 0,
  mongoQueries: 0,
  solrTime: 0,
  mongoTime: 0,
  avgSolrTime: 0,
  avgMongoTime: 0,
  solrErrors: 0
};

/**
 * Execute search with intelligent fallback
 * Tries Solr first, falls back to MongoDB if unavailable
 * 
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.query - Search query string
 * @param {string} searchParams.location - Location filter
 * @param {string} searchParams.propertyType - Property type filter
 * @param {Array} searchParams.amenities - Amenities filter
 * @param {number} searchParams.start - Pagination start (default: 0)
 * @param {number} searchParams.rows - Results per page (default: 20)
 * @returns {Promise<Object>} - {success, results, total, source, responseTime, ...}
 */
async function solrSearch(searchParams) {
  const startTime = Date.now();

  try {
    const { query, location, propertyType, amenities, maxPrice, start = 0, rows = 20 } = searchParams;

    // Build Solr query - only indexed documents match criteria, so start simple
    let queryParts = [];

    // Add text search - match all if no query
    if (query && query.trim()) {
      const q = query.trim().replace(/"/g, '').replace(/\\/g, '');
      queryParts.push(`(name:${q}* OR description:${q}* OR address:${q}* OR location:${q}*)`);
    } else {
      queryParts.push('*:*'); // Match all docs in index (already filtered at index time)
    }

    // Add location filter - exact matching
    if (location && location.trim()) {
      const loc = location.trim();
      queryParts.push(`location:"${loc}"`);
    }

    // Add property type filter
    if (propertyType && propertyType.trim() && propertyType !== 'all') {
      const type = propertyType.trim();
      queryParts.push(`subtype:"${type}"`);
    }

    // Add amenities filter
    if (amenities && amenities.length > 0) {
      // Search for each amenity - property must have ALL selected amenities
      const amenitiesQueries = amenities.map(a => {
        const cleanAmenity = a.trim().replace(/"/g, '');
        return `amenities:${cleanAmenity}`;
      }).join(' AND ');
      queryParts.push(`(${amenitiesQueries})`);
    }

    // Note: Price filter applied AFTER fetching (client-side) due to Solr storing as string

    const solrQuery = queryParts.join(' AND ');

    // Try Solr search first
    if (isSolrConnected()) {
      const solrResult = await executeSolrQuery(solrQuery, {
        start,
        rows: rows + 50, // Fetch more since we'll filter by price client-side
        sort: 'createdAt desc'
      });

      console.log('🔍 Solr Query:', solrQuery);
      console.log('📊 Raw Solr Result:', JSON.stringify(solrResult, null, 2));

      const responseTime = Date.now() - startTime;
      searchStats.solrQueries++;
      searchStats.solrTime = (searchStats.solrTime + responseTime) / 2;
      searchStats.avgSolrTime = searchStats.solrTime;

      if (solrResult.success) {
        let formatted = formatSolrResults(solrResult.results);
        
        // Apply price filter after fetching (since price might be stored as string in Solr)
        if (maxPrice && maxPrice > 0) {
          formatted = formatted.filter(p => (parseInt(p.price) || 0) <= maxPrice);
        }
        
        // Apply pagination after filtering
        const paginatedResults = formatted.slice(start, start + rows);
        
        console.log('✅ Filtered Results Count:', paginatedResults.length);
        return {
          success: true,
          results: paginatedResults,
          total: formatted.length,
          source: 'solr',
          responseTime,
          query: solrQuery,
          stats: {
            solrQueries: searchStats.solrQueries,
            mongoQueries: searchStats.mongoQueries,
            avgSolrTime: searchStats.avgSolrTime.toFixed(2) + 'ms',
            avgMongoTime: searchStats.avgMongoTime.toFixed(2) + 'ms'
          }
        };
      } else {
        // Solr query failed, fall through to MongoDB
        searchStats.solrErrors++;
        console.warn('❌ Solr query failed, falling back to MongoDB');
      }
    }

    // Fallback to MongoDB regex search
    return await mongoSearch(searchParams, startTime);
  } catch (error) {
    console.error('Error in solrSearch:', error);
    // Fallback to MongoDB on any error
    return await mongoSearch(searchParams, startTime);
  }
}

/**
 * MongoDB fallback search with regex
 * Used when Solr is unavailable or fails
 * Significantly slower but ensures search always works
 * 
 * Before Phase 2: 10-15 separate queries
 * After Phase 2: 1 aggregation query = ~320ms
 * With Solr: Expected ~50-100ms (95% improvement)
 * 
 * @param {Object} searchParams - Search parameters
 * @param {number} startTime - Query start time for metrics
 * @returns {Promise<Object>}
 */
async function mongoSearch(searchParams, startTime) {
  try {
    const { query, location, propertyType, amenities, maxPrice, start = 0, rows = 20 } = searchParams;
    const mongoStartTime = Date.now();

    const pipeline = [
      { $match: { isRented: false, isVerified: true } }
    ];

    // Build dynamic match conditions
    const matchConditions = [];

    if (location && location.trim() !== '') {
      matchConditions.push({
        location: { $regex: location, $options: 'i' }
      });
    }

    if (propertyType && propertyType.trim() !== '' && propertyType !== 'all') {
      matchConditions.push({
        subtype: { $regex: propertyType, $options: 'i' }
      });
    }

    if (query && query.trim() !== '') {
      matchConditions.push({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } }
        ]
      });
    }

    if (amenities && amenities.length > 0) {
      matchConditions.push({
        amenities: { $all: amenities }
      });
    }

    if (maxPrice && maxPrice > 0) {
      matchConditions.push({
        price: { $lte: maxPrice }
      });
    }

    if (matchConditions.length > 0) {
      pipeline.push({
        $match: { $and: matchConditions }
      });
    }

    // Add pagination and sorting
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: start },
          { $limit: rows },
          { $project: { __v: 0 } }
        ]
      }}
    );

    const result = await Property.aggregate(pipeline);
    const mongoResponseTime = Date.now() - mongoStartTime;

    searchStats.mongoQueries++;
    searchStats.mongoTime = (searchStats.mongoTime + mongoResponseTime) / 2;
    searchStats.avgMongoTime = searchStats.mongoTime;

    const total = result[0].metadata.length > 0 ? result[0].metadata[0].total : 0;
    const properties = result[0].data || [];

    return {
      success: true,
      results: properties,
      total,
      source: isSolrConnected() ? 'mongodb-fallback' : 'mongodb',
      responseTime: Date.now() - startTime,
      queryTime: mongoResponseTime,
      stats: {
        solrQueries: searchStats.solrQueries,
        mongoQueries: searchStats.mongoQueries,
        avgSolrTime: searchStats.avgSolrTime.toFixed(2) + 'ms',
        avgMongoTime: searchStats.avgMongoTime.toFixed(2) + 'ms',
        expectedSolrImprovement: '95%'
      }
    };
  } catch (error) {
    console.error('Error in mongoSearch:', error);
    return {
      success: false,
      results: [],
      total: 0,
      source: 'error',
      error: error.message
    };
  }
}

/**
 * Format Solr results to match MongoDB document format
 * Ensures consistent response regardless of search source
 * 
 * @param {Array} solrDocs - Results from Solr
 * @returns {Array} - Formatted documents
 */
function formatSolrResults(solrDocs) {
  if (!solrDocs || !Array.isArray(solrDocs)) {
    return [];
  }

  return solrDocs.map(doc => {
    // Parse amenities from space-separated string to array
    let amenitiesArray = [];
    if (typeof doc.amenities === 'string') {
      amenitiesArray = doc.amenities.split(/\s+/).filter(a => a.length > 0);
    } else if (Array.isArray(doc.amenities)) {
      amenitiesArray = doc.amenities;
    }

    return {
      _id: doc.id,
      name: String(doc.name || ''),
      description: String(doc.description || ''),
      address: String(doc.address || ''),
      location: String(doc.location || ''),
      subtype: String(doc.subtype || ''),
      amenities: amenitiesArray,
      price: parseInt(doc.price) || 0,
      bedrooms: parseInt(doc.bedrooms) || 0,
      bathrooms: parseInt(doc.bathrooms) || 0,
      area: parseInt(doc.area) || 0,
      isRented: doc.isRented === 'True' || doc.isRented === true,
      isVerified: doc.isVerified === 'True' || doc.isVerified === true,
      createdAt: Array.isArray(doc.createdAt) ? doc.createdAt[0] : doc.createdAt,
      ownerId: Array.isArray(doc.ownerId) ? doc.ownerId[0] : doc.ownerId
    };
  });
}

/**
 * Get search performance statistics
 * Shows Solr vs MongoDB performance comparison
 * 
 * @returns {Object}
 */
function getSearchStats() {
  const totalQueries = searchStats.solrQueries + searchStats.mongoQueries;
  const solrPercentage = totalQueries > 0 ? ((searchStats.solrQueries / totalQueries) * 100).toFixed(2) : 0;

  return {
    totalSearches: totalQueries,
    solrSearches: searchStats.solrQueries,
    mongoSearches: searchStats.mongoQueries,
    solrPercentage: solrPercentage + '%',
    mongoPercentage: (100 - solrPercentage).toFixed(2) + '%',
    avgSolrTime: searchStats.avgSolrTime.toFixed(2) + 'ms',
    avgMongoTime: searchStats.avgMongoTime.toFixed(2) + 'ms',
    solrErrors: searchStats.solrErrors,
    improvement: searchStats.avgMongoTime > 0 
      ? ((searchStats.avgMongoTime - searchStats.avgSolrTime) / searchStats.avgMongoTime * 100).toFixed(2) + '%'
      : '0%',
    expectedImprovement: '95%'
  };
}

/**
 * Reset search statistics (for testing)
 */
function resetSearchStats() {
  searchStats = {
    solrQueries: 0,
    mongoQueries: 0,
    solrTime: 0,
    mongoTime: 0,
    avgSolrTime: 0,
    avgMongoTime: 0,
    solrErrors: 0
  };
}

module.exports = {
  solrSearch,
  mongoSearch,
  formatSolrResults,
  getSearchStats,
  resetSearchStats
};
