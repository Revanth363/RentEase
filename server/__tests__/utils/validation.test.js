/**
 * Data validation utility tests
 * Testing email, phone, URL, and other format validators
 */

describe('Validation Utilities', () => {
  
  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone number validator
  const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // EDGE CASE 1: Email validation
  describe('Edge Case 1: Email validation', () => {
    
    test('should validate correct email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    test('should reject email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    test('should reject email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    test('should reject email without extension', () => {
      expect(isValidEmail('user@example')).toBe(false);
    });

    test('should validate email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    test('should reject email with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  // EDGE CASE 2: Phone number validation
  describe('Edge Case 2: Phone number validation', () => {
    
    test('should validate correct phone number', () => {
      expect(isValidPhone('9876543210')).toBe(true);
    });

    test('should reject phone with less than 10 digits', () => {
      expect(isValidPhone('987654321')).toBe(false);
    });

    test('should reject phone with more than 10 digits', () => {
      expect(isValidPhone('98765432100')).toBe(false);
    });

    test('should reject phone with non-numeric characters', () => {
      expect(isValidPhone('98765 4321 0')).toBe(false);
    });

    test('should reject empty phone', () => {
      expect(isValidPhone('')).toBe(false);
    });
  });

  // EDGE CASE 3: Numeric validation
  describe('Edge Case 3: Numeric validation', () => {
    
    test('should validate positive numbers', () => {
      expect(!isNaN(100)).toBe(true);
    });

    test('should validate negative numbers', () => {
      expect(!isNaN(-100)).toBe(true);
    });

    test('should validate decimals', () => {
      expect(!isNaN(100.50)).toBe(true);
    });

    test('should reject non-numeric strings', () => {
      expect(isNaN('abc')).toBe(true);
    });
  });

  // EDGE CASE 4: URL validation
  describe('Edge Case 4: URL validation', () => {
    
    const isValidUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    test('should validate HTTP URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('should validate HTTPS URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    test('should reject invalid URL', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });

    test('should reject URL without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
    });
  });

  // EDGE CASE 5: Date validation
  describe('Edge Case 5: Date validation', () => {
    
    const isValidDate = (dateString) => {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date);
    };

    test('should validate ISO date format', () => {
      expect(isValidDate('2026-04-17')).toBe(true);
    });

    test('should validate date object', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    test('should reject invalid date string', () => {
      expect(isValidDate('invalid-date')).toBe(false);
    });

    test('should accept various date formats', () => {
      expect(isValidDate('04/17/2026')).toBe(true);
    });
  });

  // EDGE CASE 6: Range validation
  describe('Edge Case 6: Range validation', () => {
    
    const isInRange = (value, min, max) => {
      return value >= min && value <= max;
    };

    test('should validate value in range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
    });

    test('should validate at boundaries', () => {
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    test('should reject value below range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
    });

    test('should reject value above range', () => {
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  // EDGE CASE 7: String length validation
  describe('Edge Case 7: String length validation', () => {
    
    const isValidLength = (str, min, max) => {
      return str.length >= min && str.length <= max;
    };

    test('should validate string within length range', () => {
      expect(isValidLength('hello', 1, 10)).toBe(true);
    });

    test('should validate exact minimum length', () => {
      expect(isValidLength('hi', 2, 10)).toBe(true);
    });

    test('should reject string too short', () => {
      expect(isValidLength('h', 2, 10)).toBe(false);
    });

    test('should reject string too long', () => {
      expect(isValidLength('hello world', 1, 5)).toBe(false);
    });

    test('should handle empty string', () => {
      expect(isValidLength('', 1, 10)).toBe(false);
    });
  });

  // EDGE CASE 8: Required field validation
  describe('Edge Case 8: Required field validation', () => {
    
    const isRequired = (value) => {
      return value !== null && value !== undefined && value !== '';
    };

    test('should accept non-empty string', () => {
      expect(isRequired('text')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(isRequired('')).toBe(false);
    });

    test('should reject null', () => {
      expect(isRequired(null)).toBe(false);
    });

    test('should reject undefined', () => {
      expect(isRequired(undefined)).toBe(false);
    });

    test('should accept zero', () => {
      expect(isRequired(0)).toBe(true);
    });

    test('should accept false', () => {
      expect(isRequired(false)).toBe(true);
    });
  });

  // EDGE CASE 9: Array validation
  describe('Edge Case 9: Array validation', () => {
    
    const isValidArray = (value) => {
      return Array.isArray(value) && value.length > 0;
    };

    test('should validate non-empty array', () => {
      expect(isValidArray([1, 2, 3])).toBe(true);
    });

    test('should reject empty array', () => {
      expect(isValidArray([])).toBe(false);
    });

    test('should reject non-array', () => {
      expect(isValidArray('not array')).toBe(false);
    });

    test('should reject null', () => {
      expect(isValidArray(null)).toBe(false);
    });
  });

  // EDGE CASE 10: Object validation
  describe('Edge Case 10: Object validation', () => {
    
    const isValidObject = (value) => {
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    };

    test('should validate plain object', () => {
      expect(isValidObject({ key: 'value' })).toBe(true);
    });

    test('should reject array', () => {
      expect(isValidObject([1, 2, 3])).toBe(false);
    });

    test('should reject null', () => {
      expect(isValidObject(null)).toBe(false);
    });

    test('should reject primitives', () => {
      expect(isValidObject('string')).toBe(false);
      expect(isValidObject(123)).toBe(false);
    });
  });
});
