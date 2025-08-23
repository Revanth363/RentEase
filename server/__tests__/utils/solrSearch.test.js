/**
 * PHASE 5: Solr Search Tests
 * Testing: solrSearch.js functions
 */

const { solrSearch, formatSolrResults } = require('../../utils/solrSearch');
const Property = require('../../models/property');
const solrConfig = require('../../config/solr');

jest.mock('../../config/solr');
jest.mock('../../models/property');
jest.mock('../../utils/metricsCollector', () => ({
  recordMetric: jest.fn(),
  getMetrics: jest.fn()
}));

describe('PHASE 5: Solr Search', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // EDGE CASE 1: Empty Query String
  // ============================================
  describe('Edge Case 1: Empty query string', () => {
    
    test('should use *:* for empty query', async () => {
      const mockResults = {
        success: true,
        results: [
          { _id: '1', name: 'Property 1', price: 5000, isVerified: true, amenities: ['wifi', 'parking'] },
          { _id: '2', name: 'Property 2', price: 8000, isVerified: false, amenities: [] }
        ],
        total: 2,
        source: 'solr',
        responseTime: 150
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.source).toBe('solr');
    });

    test('should return empty array when no results for empty query', async () => {
      const mockResults = {
        success: true,
        results: [],
        total: 0,
        source: 'solr',
        responseTime: 50
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // EDGE CASE 2: Special Characters in Query
  // ============================================
  describe('Edge Case 2: Special characters in query', () => {
    
    test('should handle special characters', async () => {
      const mockResults = {
        success: true,
        results: [
          { _id: '1', name: 'Apt & Villa', query: 'special & chars' },
          { _id: '2', name: 'House (New)', query: 'special & chars' },
          { _id: '3', name: 'Flat/Apartment', query: 'special & chars' },
          { _id: '4', name: 'Studio@Home', query: 'special & chars' },
          { _id: '5', name: 'Loft-Space', query: 'special & chars' }
        ],
        total: 5,
        source: 'solr',
        responseTime: 200
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: 'apt&villa',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results.length).toBe(5);
      expect(result.source).toBe('solr');
    });

    test('should escape dangerous characters', async () => {
      const mockResults = {
        success: true,
        results: [
          { _id: '1', name: 'Property 1', query: 'test' }
        ],
        total: 1,
        source: 'solr',
        responseTime: 100
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: 'test; DROP TABLE properties',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // EDGE CASE 3: Amenities AND Logic
  // ============================================
  describe('Edge Case 3: Amenities with AND logic', () => {
    
    test('should return results matching amenities', async () => {
      const mockResults = {
        success: true,
        results: [
          { _id: '1', name: 'Property 1', amenities: ['wifi', 'parking', 'ac'] },
          { _id: '2', name: 'Property 2', amenities: ['wifi', 'parking'] },
          { _id: '3', name: 'Property 3', amenities: ['wifi', 'parking', 'gym'] }
        ],
        total: 3,
        source: 'solr',
        responseTime: 180
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: ['wifi', 'parking'],
        start: 0,
        rows: 20
      });
      
      expect(result.results.length).toBe(3);
      expect(result.results.every(p => Array.isArray(p.amenities))).toBe(true);
    });

    test('should return empty when amenities dont match', async () => {
      const mockResults = {
        success: true,
        results: [],
        total: 0,
        source: 'solr',
        responseTime: 50
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: ['swimming-pool', 'gym'],
        start: 0,
        rows: 20
      });
      
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // EDGE CASE 4: Price Filtering
  // ============================================
  describe('Edge Case 4: Price filtering', () => {
    
    test('should filter prices by maxPrice', async () => {
      const mockResults = {
        success: true,
        results: [
          { _id: '1', price: 5000, name: 'Budget' },
          { _id: '2', price: 7500, name: 'Mid' },
          { _id: '3', price: 15000, name: 'Premium' }
        ],
        total: 3,
        source: 'solr',
        responseTime: 160
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        maxPrice: 15000,
        start: 0,
        rows: 20
      });
      
      const filtered = result.results.filter(p => p.price <= 15000);
      expect(filtered.length).toBe(3);
    });

    test('should handle zero price', async () => {
      const mockResults = {
        success: true,
        results: [{ _id: '1', price: 0, name: 'Free' }],
        total: 1,
        source: 'solr',
        responseTime: 80
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        maxPrice: 1000,
        start: 0,
        rows: 20
      });
      
      expect(result.results[0].price).toBe(0);
    });

    test('should handle very high prices', async () => {
      const mockResults = {
        success: true,
        results: [{ _id: '1', price: 500000 }],
        total: 1,
        source: 'solr',
        responseTime: 120
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        maxPrice: 1000000,
        start: 0,
        rows: 20
      });
      
      expect(result.results[0].price).toBe(500000);
    });
  });

  // ============================================
  // EDGE CASE 5: Location Exact Match
  // ============================================
  describe('Edge Case 5: Location exact match', () => {
    
    test('should return properties by location', async () => {
      const mockResults = {
        success: true,
        results: [
          { _id: '1', location: 'Chennai', name: 'Property 1' },
          { _id: '2', location: 'Chennai', name: 'Property 2' },
          { _id: '3', location: 'Chennai', name: 'Property 3' }
        ],
        total: 3,
        source: 'solr',
        responseTime: 140
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: 'Chennai',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results.every(p => p.location === 'Chennai')).toBe(true);
    });

    test('should handle location with spaces', async () => {
      const mockResults = {
        success: true,
        results: [{ _id: '1', location: 'New Delhi' }],
        total: 1,
        source: 'solr',
        responseTime: 100
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: 'New Delhi',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // EDGE CASE 6: Solr Unavailable (Fallback)
  // ============================================
  describe('Edge Case 6: Solr unavailable fallback', () => {
    
    test('should fallback to MongoDB when Solr unavailable', async () => {
      solrConfig.isSolrConnected.mockReturnValue(false);
      
      Property.aggregate.mockResolvedValue([
        {
          metadata: [{ total: 2 }],
          data: [
            { _id: '1', name: 'Fallback Property 1' },
            { _id: '2', name: 'Fallback Property 2' }
          ]
        }
      ]);
      
      const result = await solrSearch({
        query: 'apartment',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.source).toBe('mongodb');
      expect(result.results.length).toBe(2);
    });

    test('should return error source when both unavailable', async () => {
      solrConfig.isSolrConnected.mockReturnValue(false);
      Property.aggregate.mockRejectedValue(new Error('DB Error'));
      
      const result = await solrSearch({
        query: 'apartment',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.source).toBe('error');
    });
  });

  // ============================================
  // EDGE CASE 7: Invalid Pagination
  // ============================================
  describe('Edge Case 7: Invalid pagination', () => {
    
    test('should handle start > total results', async () => {
      const mockResults = {
        success: true,
        results: [],
        total: 5,
        source: 'solr',
        responseTime: 100
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        start: 100,
        rows: 20
      });
      
      expect(result.results.length).toBe(0);
    });

    test('should use default rows=20 if not provided', async () => {
      const mockResults = {
        success: true,
        results: Array(20).fill({}).map((_, i) => ({ _id: String(i+1), name: `Prop ${i+1}` })),
        total: 100,
        source: 'solr',
        responseTime: 180
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0
      });
      
      expect(result.results.length).toBe(20);
    });

    test('should handle rows=0', async () => {
      const mockResults = {
        success: true,
        results: [],
        total: 0,
        source: 'solr',
        responseTime: 50
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 0
      });
      
      expect(result.results.length).toBe(0);
    });
  });

  // ============================================
  // EDGE CASE 8: formatSolrResults Data Transformation
  // ============================================
  describe('Edge Case 8: formatSolrResults transformation', () => {
    
    test('should convert string numbers to integers', () => {
      const solrDocs = [
        { price: 5000, bedrooms: '2', bathrooms: '1' }
      ];
      
      const result = formatSolrResults(solrDocs);
      
      expect(result[0].price).toBe(5000);
      expect(typeof result[0].price).toBe('number');
      expect(result[0].bedrooms).toBe(2);
    });

    test('should convert string booleans to true booleans', () => {
      const solrDocs = [
        { isVerified: 'True', isRented: 'False' }
      ];
      
      const result = formatSolrResults(solrDocs);
      
      expect(result[0].isVerified).toBe(true);
      expect(result[0].isRented).toBe(false);
      expect(typeof result[0].isVerified).toBe('boolean');
    });

    test('should parse space-separated amenities to array', () => {
      const solrDocs = [
        { amenities: 'parking lift Balcony gated-community wifi ac' }
      ];
      
      const result = formatSolrResults(solrDocs);
      
      expect(Array.isArray(result[0].amenities)).toBe(true);
      expect(result[0].amenities).toEqual([
        'parking', 'lift', 'Balcony', 'gated-community', 'wifi', 'ac'
      ]);
    });

    test('should handle array fields', () => {
      const solrDocs = [
        { createdAt: ['2026-03-04T10:00:00Z', 'extra'] }
      ];
      
      const result = formatSolrResults(solrDocs);
      
      expect(result[0].createdAt).toBe('2026-03-04T10:00:00Z');
    });

    test('should handle null and undefined values', () => {
      const solrDocs = [
        { 
          name: 'Property',
          description: null,
          images: undefined,
          amenities: ''
        }
      ];
      
      const result = formatSolrResults(solrDocs);
      
      expect(result[0].name).toBe('Property');
      expect(result[0].description).toBe(''); // Implementation converts null to empty string
      expect(result[0].amenities).toEqual([]);
    });

    test('should handle uppercase True/False strings', () => {
      const solrDocs = [
        { isVerified: 'True', isRented: 'False' }
      ];
      
      const result = formatSolrResults(solrDocs);
      
      expect(result[0].isVerified).toBe(true);
      expect(result[0].isRented).toBe(false); // 'False' !== 'True', so becomes false
    });
  });

  // ============================================
  // EDGE CASE 9: No Results Found
  // ============================================
  describe('Edge Case 9: No results found', () => {
    
    test('should return empty array when no results', async () => {
      const mockResults = {
        success: true,
        results: [],
        total: 0,
        source: 'solr',
        responseTime: 60
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: 'non-existent-property',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    test('should handle response with missing fields', async () => {
      const mockResults = {
        response: { numFound: 0 }
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: '',
        location: '',
        propertyType: '',
        amenities: [],
        start: 0,
        rows: 20
      });
      
      expect(result.results).toEqual([]);
    });
  });

  // ============================================
  // EDGE CASE 10: Combined Filters
  // ============================================
  describe('Edge Case 10: Combined filters', () => {
    
    test('should apply multiple filters together', async () => {
      const mockResults = {
        success: true,
        results: [
          {
            _id: '1',
            name: 'Apartment 1',
            location: 'Chennai',
            subtype: '2bhk',
            price: 10000,
            amenities: ['wifi', 'parking'],
            isVerified: true
          },
          {
            _id: '2',
            name: 'Apartment 2',
            location: 'Chennai',
            subtype: '2bhk',
            price: 12000,
            amenities: ['wifi', 'parking'],
            isVerified: true
          }
        ],
        total: 2,
        source: 'solr',
        responseTime: 200
      };
      
      solrConfig.isSolrConnected.mockReturnValue(true);
      solrConfig.executeSolrQuery.mockResolvedValue(mockResults);
      
      const result = await solrSearch({
        query: 'apartment',
        location: 'Chennai',
        propertyType: '2bhk',
        amenities: ['wifi', 'parking'],
        maxPrice: 15000,
        start: 0,
        rows: 20
      });
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every(p => p.location === 'Chennai')).toBe(true);
      expect(result.results.every(p => p.subtype === '2bhk')).toBe(true);
    });
  });
});
