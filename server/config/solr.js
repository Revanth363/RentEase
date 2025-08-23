/**
 * PHASE 5: Apache Solr Configuration Manager
 * Handles connection pooling, index management, and query execution
 * Provides graceful degradation if Solr unavailable (falls back to MongoDB)
 */

let solr;
try {
  solr = require('solr-client');
} catch (err) {
  console.warn('⚠ solr-client not installed - Solr disabled, using MongoDB search as fallback');
  solr = null;
}
const http = require('http');

let solrClient = null;
let isConnected = false;
const SOLR_HOST = process.env.SOLR_HOST || 'localhost';
const SOLR_PORT = process.env.SOLR_PORT || 8983;
const SOLR_CORE = process.env.SOLR_CORE || 'rentease';

/**
 * Initialize Solr connection with connection pooling
 * @returns {Promise<boolean>} True if connected successfully
 */
async function initializeSolr() {
  return new Promise((resolve) => {
    try {
      // Skip if solr-client is not available
      if (!solr) {
        console.warn('⚠ Solr disabled - using MongoDB search fallback');
        isConnected = false;
        resolve(false);
        return;
      }
      
      // Create Solr client
      solrClient = new solr.Client({
        host: SOLR_HOST,
        port: SOLR_PORT,
        core: SOLR_CORE
      });

      let resolved = false;

      // Test connection with direct HTTP request
      const options = {
        hostname: SOLR_HOST,
        port: SOLR_PORT,
        path: `/solr/${SOLR_CORE}/select?q=*:*&rows=0`,
        method: 'GET',
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        if (!resolved) {
          resolved = true;
          if (res.statusCode === 200) {
            console.log(`✓ Solr connected successfully (${SOLR_HOST}:${SOLR_PORT}/${SOLR_CORE})`);
            isConnected = true;
            resolve(true);
          } else {
            console.warn(`⚠ Solr unavailable (HTTP ${res.statusCode}) - full-text search disabled, using MongoDB regex search as fallback`);
            isConnected = false;
            resolve(false);
          }
        }
      });

      req.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          console.warn(`⚠ Solr unavailable (${SOLR_HOST}:${SOLR_PORT}) - full-text search disabled, using MongoDB regex search as fallback`);
          isConnected = false;
          resolve(false);
        }
      });

      req.end();
    } catch (error) {
      console.warn(`⚠ Solr initialization failed: ${error.message}`);
      isConnected = false;
      resolve(false);
    }
  });
}

/**
 * Get Solr client if connected
 * @returns {Object|null} Solr client or null if unavailable
 */
function getSolrClient() {
  return isConnected ? solrClient : null;
}

/**
 * Check if Solr is connected
 * @returns {boolean}
 */
function isSolrConnected() {
  return isConnected;
}

/**
 * Index a single property document in Solr
 * @param {Object} property - Property document with fields
 * @returns {Promise<boolean>}
 */
async function indexProperty(property) {
  return new Promise((resolve) => {
    if (!isConnected || !solrClient) {
      resolve(false);
      return;
    }

    try {
      const doc = {
        id: property._id.toString(),
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        location: property.location || '',
        subtype: property.subtype || '',
        amenities: property.amenities || [],
        price: property.price || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        area: property.area || 0,
        isRented: property.isRented || false,
        isVerified: property.isVerified || false,
        ownerId: property.ownerId ? property.ownerId.toString() : '',
        createdAt: property.createdAt || new Date(),
        updatedAt: property.updatedAt || new Date(),
        // Full-text search field (combination of all text fields)
        text_search: [
          property.name,
          property.description,
          property.address,
          property.location,
          property.subtype,
          (property.amenities || []).join(' ')
        ].filter(Boolean).join(' ')
      };

      solrClient.add(doc, (err, obj) => {
        if (err) {
          console.error(`Error indexing property ${property._id}:`, err);
          resolve(false);
        } else {
          // Commit after add to make it searchable
          solrClient.commit((err, obj) => {
            if (err) {
              console.error(`Error committing property ${property._id}:`, err);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error in indexProperty:', error);
      resolve(false);
    }
  });
}

/**
 * Index multiple properties in batch using direct HTTP
 * @param {Array} properties - Array of property documents
 * @returns {Promise<number>} Number of successfully indexed properties
 */
async function indexPropertiesBatch(properties) {
  if (!properties || properties.length === 0) {
    return 0;
  }

  let indexed = 0;

  // Index each property sequentially via HTTP
  for (const property of properties) {
    try {
      const doc = {
        id: property._id.toString(),
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        location: property.location || '',
        subtype: property.subtype || '',
        amenities: property.amenities || [],
        price: property.price || 0,
        bedrooms: property.beds || property.bedrooms || 0,
        bathrooms: property.baths || property.bathrooms || 0,
        area: property.area || 0,
        isRented: property.isRented || false,
        isVerified: property.isVerified || false,
        ownerId: property.ownerId ? property.ownerId.toString() : '',
        createdAt: property.createdAt ? new Date(property.createdAt).toISOString() : new Date().toISOString()
      };

      const payload = JSON.stringify({ add: { doc } });

      // HTTP POST to Solr
      await new Promise((resolve, reject) => {
        const options = {
          hostname: SOLR_HOST,
          port: SOLR_PORT,
          path: `/solr/${SOLR_CORE}/update?commit=true&wt=json`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 3000
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              indexed++;
              resolve();
            } else {
              console.warn(`Solr HTTP ${res.statusCode} for ${doc.id}`);
              resolve(); // Continue anyway
            }
          });
        });

        req.on('error', (err) => {
          console.warn(`Solr index error: ${err.message}`);
          resolve(); // Continue with next
        });

        req.on('timeout', () => {
          req.destroy();
          console.warn(`Solr indexing timeout for ${doc.id}`);
          resolve(); // Continue
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.warn(`Skip property ${property._id}: ${error.message}`);
    }
  }

  console.log(`✓ Indexed ${indexed}/${properties.length} properties to Solr`);
  return indexed;
}

/**
 * Delete a property from Solr index
 * @param {string} propertyId - Property MongoDB ID
 * @returns {Promise<boolean>}
 */
async function deleteProperty(propertyId) {
  return new Promise((resolve) => {
    if (!isConnected || !solrClient) {
      resolve(false);
      return;
    }

    try {
      solrClient.delete({ id: propertyId.toString() }, (err, obj) => {
        if (err) {
          console.error(`Error deleting property ${propertyId}:`, err);
          resolve(false);
        } else {
          solrClient.commit((err, obj) => {
            if (err) {
              console.error(`Error committing delete for ${propertyId}:`, err);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error in deleteProperty:', error);
      resolve(false);
    }
  });
}

/**
 * Clear all documents from the index (WARNING: Use with caution!)
 * @returns {Promise<boolean>}
 */
async function clearIndex() {
  return new Promise((resolve) => {
    if (!isConnected || !solrClient) {
      resolve(false);
      return;
    }

    try {
      solrClient.delete({ q: '*:*' }, (err, obj) => {
        if (err) {
          console.error('Error clearing Solr index:', err);
          resolve(false);
        } else {
          solrClient.commit((err, obj) => {
            if (err) {
              console.error('Error committing clear:', err);
              resolve(false);
            } else {
              console.log('✓ Solr index cleared');
              resolve(true);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error in clearIndex:', error);
      resolve(false);
    }
  });
}

/**
 * Get index statistics
 * @returns {Promise<Object>}
 */
async function getIndexStats() {
  return new Promise((resolve) => {
    try {
      const options = {
        hostname: SOLR_HOST,
        port: SOLR_PORT,
        path: `/solr/${SOLR_CORE}/select?q=*:*&rows=0&wt=json`,
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              indexed: result.response?.numFound || 0,
              connected: true,
              timestamp: new Date()
            });
          } catch (e) {
            console.error('Error parsing Solr stats:', e);
            resolve({ indexed: 0, connected: true, error: e.message });
          }
        });
      });

      req.on('error', (err) => {
        console.error('Error getting index stats:', err.message);
        resolve({ indexed: 0, connected: false, error: err.message });
      });

      req.end();
    } catch (error) {
      console.error('Error in getIndexStats:', error);
      resolve({ indexed: 0, connected: false, error: error.message });
    }
  });
}

/**
 * Execute Solr search query
 * @param {string} query - Solr query string
 * @param {Object} options - Search options (start, rows, facets, etc.)
 * @returns {Promise<Object>}
 */
async function executeSolrQuery(query, options = {}) {
  return new Promise((resolve) => {
    if (!isConnected || !solrClient) {
      resolve({ success: false, results: [], source: 'error' });
      return;
    }

    try {
      const { start = 0, rows = 20, sort = 'score desc' } = options;
      
      // Build URL with proper encoding using direct HTTP request
      const params = new URLSearchParams({
        q: query,
        start: start.toString(),
        rows: rows.toString(),
        sort: sort,
        wt: 'json'
      });

      // Only use edismax for text search queries (not for filter-only queries)
      if (query !== '*:*' && !query.includes('amenities:') && !query.includes('location:') && !query.includes('subtype:')) {
        params.append('defType', 'edismax');
        params.append('qf', 'name^5 description^3 address^4 location^2');
        params.append('mm', '75%');
      }

      const path = `/solr/${SOLR_CORE}/select?${params.toString()}`;
      console.log(`🔗 Solr Query URL: http://${SOLR_HOST}:${SOLR_PORT}${path}`);
      
      const reqOptions = {
        hostname: SOLR_HOST,
        port: SOLR_PORT,
        path: path,
        method: 'GET',
        timeout: 10000
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`✅ Solr Response: numFound=${result.response?.numFound}, docs count=${result.response?.docs?.length}`);
            resolve({
              success: true,
              results: result.response?.docs || [],
              total: result.response?.numFound || 0,
              source: 'solr',
              timestamp: new Date()
            });
          } catch (e) {
            console.error('Error parsing Solr response:', e);
            resolve({ success: false, results: [], error: e.message, source: 'error' });
          }
        });
      });

      req.on('error', (err) => {
        console.error('Solr HTTP request error:', err);
        resolve({ success: false, results: [], error: err.message, source: 'error' });
      });

      req.end();
    } catch (error) {
      console.error('Error in executeSolrQuery:', error);
      resolve({ success: false, results: [], error: error.message, source: 'error' });
    }
  });
}

/**
 * Close Solr connection gracefully
 */
function closeSolr() {
  if (solrClient) {
    try {
      solrClient = null;
      isConnected = false;
      console.log('Solr connection closed');
    } catch (error) {
      console.error('Error closing Solr:', error);
    }
  }
}

module.exports = {
  initializeSolr,
  getSolrClient,
  isSolrConnected,
  indexProperty,
  indexPropertiesBatch,
  deleteProperty,
  clearIndex,
  getIndexStats,
  executeSolrQuery,
  closeSolr
};
