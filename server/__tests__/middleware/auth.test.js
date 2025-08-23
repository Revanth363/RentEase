/**
 * Auth Middleware Tests
 * Testing: middleware/auth.js protect() function
 * 
 * Coverage:
 * - Edge Case 1: Valid JWT in cookie
 * - Edge Case 2: No authorization header/cookie
 * - Edge Case 3: Invalid Bearer format
 * - Edge Case 4: Expired token
 * - Edge Case 5: Missing userType in token
 * - Edge Case 6: User not found in database
 * - Edge Case 7: Valid JWT bypass with special routes
 */

const { protect } = require('../../middleware/auth');
const { verifyToken } = require('../../utils/jwt');

// Mock JWT
jest.mock('../../utils/jwt');

describe('Auth Middleware - protect()', () => {
  
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      cookies: {},
      headers: {},
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  // ============================================
  // EDGE CASE 1: Valid JWT in cookie
  // ============================================
  describe('Edge Case 1: Valid JWT in cookie', () => {
    
    test('should authenticate with valid accessToken cookie', () => {
      const decodedToken = {
        id: '507f1f77bcf86cd799439011',
        userType: 'tenant',
        email: 'tenant@example.com'
      };
      
      req.cookies.accessToken = 'valid-jwt-token';
      verifyToken.mockReturnValue(decodedToken);
      
      protect(req, res, next);
      
      expect(req.user).toEqual(decodedToken);
      expect(next).toHaveBeenCalled();
    });

    test('should set req.user from verified token', () => {
      const decodedToken = {
        id: '123',
        userType: 'owner'
      };
      
      req.cookies.accessToken = 'valid-token';
      verifyToken.mockReturnValue(decodedToken);
      
      protect(req, res, next);
      
      expect(req.user).toEqual(decodedToken);
      expect(next).toHaveBeenCalled();
    });
  });

  // ============================================
  // EDGE CASE 2: No authorization header/cookie
  // ============================================
  describe('Edge Case 2: No authorization header/cookie', () => {
    
    test('should reject request with no auth cookie', () => {
      req.cookies = {}; // No accessToken
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with empty authorization header', () => {
      req.headers.authorization = '';
      req.cookies = {};
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject with descriptive error message', () => {
      req.cookies = {};
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.error).toBeDefined();
    });
  });

  // ============================================
  // EDGE CASE 3: Invalid Bearer format
  // ============================================
  describe('Edge Case 3: Invalid Bearer format', () => {
    
    test('should reject Authorization header without Bearer prefix', () => {
      req.headers.authorization = 'token-without-bearer-prefix';
      req.cookies = {};
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject Authorization header with only Bearer keyword', () => {
      req.headers.authorization = 'Bearer ';
      req.cookies = {};
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should reject Authorization header with invalid token format', () => {
      req.headers.authorization = 'Bearer invalid-token-format';
      req.cookies = {};
      verifyToken.mockImplementation(() => {
        throw new Error('invalid token');
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ============================================
  // EDGE CASE 4: Expired token
  // ============================================
  describe('Edge Case 4: Expired token', () => {
    
    test('should reject expired token in cookie', () => {
      req.cookies.accessToken = 'expired-token';
      verifyToken.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired token in Authorization header', () => {
      req.headers.authorization = 'Bearer expired-token';
      req.cookies = {};
      verifyToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ============================================
  // EDGE CASE 5: Missing userType in token
  // ============================================
  describe('Edge Case 5: Missing userType in token', () => {
    
    test('should accept token without userType (not validated by middleware)', () => {
      const decodedToken = {
        id: '123',
        email: 'user@example.com'
        // Missing userType
      };
      
      req.cookies.accessToken = 'token-without-type';
      verifyToken.mockReturnValue(decodedToken);
      
      protect(req, res, next);
      
      // Middleware doesn't validate userType, just passes decoded token
      expect(req.user).toEqual(decodedToken);
      expect(next).toHaveBeenCalled();
    });
  });

  // ============================================
  // EDGE CASE 6: Token verification errors
  // ============================================
  describe('Edge Case 6: Token verification errors', () => {
    
    test('should reject when verifyToken fails', () => {
      req.cookies.accessToken = 'invalid-token';
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject when token is expired', () => {
      req.cookies.accessToken = 'expired-token';
      verifyToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle database errors gracefully by rejecting', () => {
      req.cookies.accessToken = 'token';
      verifyToken.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ============================================
  // EDGE CASE 7: Token tampering detection
  // ============================================
  describe('Edge Case 7: Token tampering detection', () => {
    
    test('should reject tampered token signature', () => {
      req.cookies.accessToken = 'tampered-signature';
      verifyToken.mockImplementation(() => {
        throw new Error('invalid signature');
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token with wrong secret', () => {
      req.cookies.accessToken = 'wrong-secret-token';
      verifyToken.mockImplementation(() => {
        throw new Error('invalid token');
      });
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ============================================
  // EDGE CASE 8: Priority (Cookie vs Header)
  // ============================================
  describe('Edge Case 8: Priority (Cookie vs Header)', () => {
    
    test('should prefer cookie token over Authorization header', () => {
      const decodedToken = {
        id: '123',
        userType: 'tenant'
      };
      
      req.cookies.accessToken = 'cookie-token';
      req.headers.authorization = 'Bearer header-token';
      verifyToken.mockReturnValue(decodedToken);
      
      protect(req, res, next);
      
      // Should verify with cookie token (first call should be with cookie-token)
      expect(verifyToken).toHaveBeenCalledWith('cookie-token');
      expect(next).toHaveBeenCalled();
    });
  });

  // ============================================
  // EDGE CASE 9: Multiple user types
  // ============================================
  describe('Edge Case 9: Multiple user types', () => {
    
    test('should authenticate tenant user', () => {
      const decodedToken = {
        id: '123',
        userType: 'tenant'
      };
      
      req.cookies.accessToken = 'tenant-token';
      verifyToken.mockReturnValue(decodedToken);
      
      protect(req, res, next);
      
      expect(req.user.userType).toBe('tenant');
      expect(next).toHaveBeenCalled();
    });

    test('should authenticate admin user', () => {
      const decodedToken = {
        id: '123',
        userType: 'admin'
      };
      
      req.cookies.accessToken = 'admin-token';
      verifyToken.mockReturnValue(decodedToken);
      
      protect(req, res, next);
      
      expect(req.user.userType).toBe('admin');
      expect(next).toHaveBeenCalled();
    });

    test('should authenticate superadmin user', () => {
      const decodedToken = {
        id: '123',
        userType: 'superadmin'
      };
      
      req.cookies.accessToken = 'superadmin-token';
      verifyToken.mockReturnValue(decodedToken);
      
      protect(req, res, next);
      
      expect(req.user.userType).toBe('superadmin');
      expect(next).toHaveBeenCalled();
    });
  });

  // ============================================
  // EDGE CASE 10: Empty token string
  // ============================================
  describe('Edge Case 10: Edge cases with empty/malformed tokens', () => {
    
    test('should reject empty accessToken cookie', () => {
      req.cookies.accessToken = '';
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should reject null token', () => {
      req.cookies.accessToken = null;
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should reject when no cookie and no Authorization header', () => {
      req.cookies = {};
      req.headers.authorization = undefined;
      
      protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
