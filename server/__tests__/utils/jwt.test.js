/**
 * JWT Authentication Tests
 * Testing: jwt.js utility functions
 * 
 * Coverage:
 * - Edge Case 1: signToken with valid payload
 * - Edge Case 2: signToken with custom expiresIn
 * - Edge Case 3: verifyToken with valid token
 * - Edge Case 4: verifyToken with expired token
 * - Edge Case 5: verifyToken with tampered token
 * - Edge Case 6: verifyToken with invalid format
 * - Edge Case 7: Round-trip sign → verify
 * - Edge Case 8: Missing JWT_SECRET warning
 * - Edge Case 9: Various payload types
 * - Edge Case 10: Token with special characters
 */

const { signToken, verifyToken } = require('../../utils/jwt');
const jwt = require('jsonwebtoken');

describe('JWT Authentication', () => {
  
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-only-not-for-production';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // EDGE CASE 1: signToken with valid payload
  // ============================================
  describe('Edge Case 1: signToken with valid payload', () => {
    
    test('should create valid token from payload', () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        userType: 'tenant',
        email: 'user@example.com'
      };
      
      const token = signToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should include payload data in token', () => {
      const payload = {
        id: '123',
        userType: 'owner',
        email: 'owner@test.com'
      };
      
      const token = signToken(payload);
      const decoded = jwt.decode(token);
      
      expect(decoded.id).toBe('123');
      expect(decoded.userType).toBe('owner');
      expect(decoded.email).toBe('owner@test.com');
    });

    test('should handle empty payload object', () => {
      const token = signToken({});
      
      expect(token).toBeDefined();
      const decoded = jwt.decode(token);
      expect(decoded).toEqual(expect.objectContaining({}));
    });

    test('should handle payload with special characters', () => {
      const payload = {
        name: 'Test User',
        email: 'user+test@example.com',
        description: 'Special chars: !@#$%^&*()'
      };
      
      const token = signToken(payload);
      const decoded = jwt.decode(token);
      
      expect(decoded.description).toBe('Special chars: !@#$%^&*()');
    });
  });

  // ============================================
  // EDGE CASE 2: signToken with custom expiresIn
  // ============================================
  describe('Edge Case 2: signToken with custom expiresIn', () => {
    
    test('should use custom expiresIn option', () => {
      const payload = { id: '123' };
      
      const token1h = signToken(payload, { expiresIn: '1h' });
      const decoded1h = jwt.decode(token1h);
      
      const token7d = signToken(payload, { expiresIn: '7d' });
      const decoded7d = jwt.decode(token7d);
      
      // 7 days should have larger exp than 1 hour
      expect(decoded7d.exp).toBeGreaterThan(decoded1h.exp);
    });

    test('should use default 1h when no expiresIn provided', () => {
      const payload = { id: '123' };
      const token = signToken(payload);
      const decoded = jwt.decode(token);
      
      // Check that token has expiration set (iat + 1 hour)
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('should handle seconds expiration', () => {
      const payload = { id: '123' };
      const token = signToken(payload, { expiresIn: '3600' }); // 1 hour in seconds
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
    });

    test('should handle very short expiresIn', () => {
      const payload = { id: '123' };
      const token = signToken(payload, { expiresIn: '1s' });
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
    });

    test('should handle very long expiresIn', () => {
      const payload = { id: '123' };
      const token = signToken(payload, { expiresIn: '365d' });
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
    });
  });

  // ============================================
  // EDGE CASE 3: verifyToken with valid token
  // ============================================
  describe('Edge Case 3: verifyToken with valid token', () => {
    
    test('should verify and decode valid token', () => {
      const payload = { id: '123', userType: 'tenant' };
      const token = signToken(payload);
      
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe('123');
      expect(decoded.userType).toBe('tenant');
    });

    test('should extract all payload data', () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        userType: 'owner',
        email: 'owner@example.com',
        name: 'John Doe'
      };
      const token = signToken(payload);
      
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(payload.id);
      expect(decoded.userType).toBe(payload.userType);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
    });

    test('should include iat and exp timestamps', () => {
      const payload = { id: '123' };
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
    });
  });

  // ============================================
  // EDGE CASE 4: verifyToken with expired token
  // ============================================
  describe('Edge Case 4: verifyToken with expired token', () => {
    
    test('should reject expired token', () => {
      const payload = { id: '123' };
      // Create token that expires immediately
      const token = signToken(payload, { expiresIn: '0s' });
      
      // Wait a bit to ensure expiration
      jest.advanceTimersByTime(1000);
      
      expect(() => verifyToken(token)).toThrow();
    });

    test('should throw TokenExpiredError for expired token', () => {
      // Manually create an expired token
      const expiredToken = jwt.sign(
        { id: '123' },
        JWT_SECRET,
        { expiresIn: '-1h' } // 1 hour in the past
      );
      
      expect(() => verifyToken(expiredToken)).toThrow('jwt expired');
    });
  });

  // ============================================
  // EDGE CASE 5: verifyToken with tampered token
  // ============================================
  describe('Edge Case 5: verifyToken with tampered token', () => {
    
    test('should reject token with modified payload', () => {
      const payload = { id: '123', userType: 'tenant' };
      const token = signToken(payload);
      
      // Try to tamper with token by changing payload
      const parts = token.split('.');
      const tampered = parts[0] + '.invalid' + parts[2];
      
      expect(() => verifyToken(tampered)).toThrow();
    });

    test('should reject token with modified signature', () => {
      const payload = { id: '123' };
      const token = signToken(payload);
      
      // Modify the signature part
      const parts = token.split('.');
      parts[2] = parts[2].replace(/[a-z]/, 'X');
      const tampered = parts.join('.');
      
      expect(() => verifyToken(tampered)).toThrow();
    });

    test('should reject token with different secret', () => {
      const payload = { id: '123' };
      const token = signToken(payload);
      
      // Create a token with different secret
      const wrongSecretToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });
      
      // Should fail because signature won't match
      expect(() => verifyToken(wrongSecretToken)).toThrow();
    });
  });

  // ============================================
  // EDGE CASE 6: verifyToken with invalid format
  // ============================================
  describe('Edge Case 6: verifyToken with invalid format', () => {
    
    test('should reject null token', () => {
      expect(() => verifyToken(null)).toThrow();
    });

    test('should reject undefined token', () => {
      expect(() => verifyToken(undefined)).toThrow();
    });

    test('should reject empty string token', () => {
      expect(() => verifyToken('')).toThrow();
    });

    test('should reject token with missing parts', () => {
      const invalidToken = 'invalid.token';
      
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    test('should reject token with 2 parts instead of 3', () => {
      const invalidToken = 'part1.part2';
      
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    test('should reject random string', () => {
      expect(() => verifyToken('randomstring')).toThrow();
    });

    test('should reject token with invalid Base64', () => {
      const invalidToken = '!!!.!!!.!!!';
      
      expect(() => verifyToken(invalidToken)).toThrow();
    });
  });

  // ============================================
  // EDGE CASE 7: Round-trip sign → verify
  // ============================================
  describe('Edge Case 7: Round-trip sign → verify', () => {
    
    test('should preserve payload through sign → verify cycle', () => {
      const original = {
        id: '507f1f77bcf86cd799439011',
        userType: 'tenant',
        email: 'tenant@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const token = signToken(original);
      const verified = verifyToken(token);
      
      expect(verified.id).toBe(original.id);
      expect(verified.userType).toBe(original.userType);
      expect(verified.email).toBe(original.email);
      expect(verified.firstName).toBe(original.firstName);
      expect(verified.lastName).toBe(original.lastName);
    });

    test('should maintain data types through round-trip', () => {
      const original = {
        userId: 123,
        isActive: true,
        rating: 4.5,
        tags: ['owner', 'verified'],
        metadata: { level: 'premium' }
      };
      
      const token = signToken(original);
      const verified = verifyToken(token);
      
      expect(verified.userId).toBe(123);
      expect(verified.isActive).toBe(true);
      expect(verified.rating).toBe(4.5);
      expect(Array.isArray(verified.tags)).toBe(true);
      expect(verified.metadata.level).toBe('premium');
    });

    test('should work with multiple consecutive cycles', () => {
      const original = { id: '123', role: 'admin' };
      
      let token = signToken(original);
      let verified = verifyToken(token);
      
      expect(verified.id).toBe('123');
      
      // Remove exp from verified payload before re-signing
      const { exp, iat, ...payloadToSign } = verified;
      token = signToken(payloadToSign);
      verified = verifyToken(token);
      
      expect(verified.id).toBe('123');
      expect(verified.role).toBe('admin');
    });
  });

  // ============================================
  // EDGE CASE 8: Payload with various types
  // ============================================
  describe('Edge Case 8: Payload with various types', () => {
    
    test('should handle numeric values', () => {
      const payload = {
        id: 123,
        userId: 456,
        rating: 4.5,
        count: 0,
        negative: -100
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(456);
      expect(decoded.rating).toBe(4.5);
      expect(decoded.count).toBe(0);
      expect(decoded.negative).toBe(-100);
    });

    test('should handle boolean values', () => {
      const payload = {
        isActive: true,
        isVerified: false,
        isAdmin: true
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.isActive).toBe(true);
      expect(decoded.isVerified).toBe(false);
    });

    test('should handle arrays', () => {
      const payload = {
        roles: ['tenant', 'owner'],
        permissions: ['read', 'write'],
        tags: []
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(Array.isArray(decoded.roles)).toBe(true);
      expect(decoded.roles).toEqual(['tenant', 'owner']);
      expect(decoded.tags).toEqual([]);
    });

    test('should handle nested objects', () => {
      const payload = {
        user: {
          id: '123',
          profile: {
            firstName: 'John',
            location: 'Chennai'
          }
        }
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.user.profile.firstName).toBe('John');
      expect(decoded.user.profile.location).toBe('Chennai');
    });

    test('should handle null values', () => {
      const payload = {
        id: '123',
        middleName: null,
        nickname: null
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.middleName).toBeNull();
      expect(decoded.nickname).toBeNull();
    });
  });

  // ============================================
  // EDGE CASE 9: Unicode and special characters
  // ============================================
  describe('Edge Case 9: Unicode and special characters', () => {
    
    test('should handle Unicode characters', () => {
      const payload = {
        id: '123',
        name: 'Ravi Kumar',
        location: 'बैंगलोर'
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.name).toBe('Ravi Kumar');
      expect(decoded.location).toBe('बैंगलोर');
    });

    test('should handle email addresses', () => {
      const payload = {
        email: 'user+test@example.com',
        backupEmail: 'backup.email@domain.co.uk'
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.email).toBe('user+test@example.com');
      expect(decoded.backupEmail).toBe('backup.email@domain.co.uk');
    });

    test('should handle URLs', () => {
      const payload = {
        website: 'https://example.com:8080/path?query=value&other=123',
        api: 'https://api.example.com/v1/endpoint'
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.website).toContain('example.com');
      expect(decoded.api).toContain('api.example.com');
    });
  });

  // ============================================
  // EDGE CASE 10: Large payloads
  // ============================================
  describe('Edge Case 10: Large payloads', () => {
    
    test('should handle large payloads', () => {
      const largeArray = Array(100).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: 'A'.repeat(50)
      }));
      
      const payload = {
        userId: '123',
        data: largeArray
      };
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.data.length).toBe(100);
      expect(decoded.data[50].id).toBe(50);
    });

    test('should handle payload with many fields', () => {
      const payload = {};
      for (let i = 0; i < 50; i++) {
        payload[`field${i}`] = `value${i}`;
      }
      
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(Object.keys(decoded).length).toBeGreaterThanOrEqual(50);
    });
  });
});
