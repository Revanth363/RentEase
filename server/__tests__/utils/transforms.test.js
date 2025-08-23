/**
 * Data transformation utility tests
 * Testing common data formatting and conversion functions
 */

describe('Data Transformation Utilities', () => {
  
  // EDGE CASE 1: Currency formatting
  describe('Edge Case 1: Currency formatting', () => {
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    };

    test('should format currency correctly', () => {
      const formatted = formatCurrency(1000);
      expect(formatted).toContain('1,000');
    });

    test('should handle decimal amounts', () => {
      const formatted = formatCurrency(1000.50);
      expect(formatted).toContain('1,000');
    });

    test('should handle zero', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toBeDefined();
    });

    test('should handle negative amounts', () => {
      const formatted = formatCurrency(-1000);
      expect(formatted).toBeDefined();
    });
  });

  // EDGE CASE 2: Date formatting
  describe('Edge Case 2: Date formatting', () => {
    
    const formatDate = (date) => {
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(date));
    };

    test('should format date correctly', () => {
      const formatted = formatDate('2026-04-17');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    test('should handle Date object', () => {
      const date = new Date(2026, 3, 17); // April 17, 2026
      const formatted = formatDate(date);
      expect(formatted).toBeDefined();
    });

    test('should handle current date', () => {
      const formatted = formatDate(new Date());
      expect(formatted).toBeDefined();
    });
  });

  // EDGE CASE 3: Percentage calculation
  describe('Edge Case 3: Percentage calculation', () => {
    
    const calculatePercentage = (value, total) => {
      return ((value / total) * 100).toFixed(2);
    };

    test('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 200)).toBe('25.00');
    });

    test('should calculate decimal percentages', () => {
      expect(calculatePercentage(33, 100)).toBe('33.00');
    });

    test('should handle zero value', () => {
      expect(calculatePercentage(0, 100)).toBe('0.00');
    });

    test('should handle 100%', () => {
      expect(calculatePercentage(100, 100)).toBe('100.00');
    });
  });

  // EDGE CASE 4: Byte size conversion
  describe('Edge Case 4: Byte size conversion', () => {
    
    const formatBytes = (bytes) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Bytes';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    test('should format bytes', () => {
      expect(formatBytes(1024)).toContain('KB');
    });

    test('should format kilobytes', () => {
      expect(formatBytes(1024 * 1024)).toContain('MB');
    });

    test('should handle zero', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    test('should format small numbers', () => {
      expect(formatBytes(512)).toContain('Bytes');
    });
  });

  // EDGE CASE 5: Template string formatting
  describe('Edge Case 5: Template string formatting', () => {
    
    const formatTemplate = (template, values) => {
      return template.replace(/\{(\w+)\}/g, (match, key) => values[key] || '');
    };

    test('should replace template variables', () => {
      const template = 'Hello {name}, you are {age} years old';
      const values = { name: 'John', age: '30' };
      expect(formatTemplate(template, values)).toBe('Hello John, you are 30 years old');
    });

    test('should handle missing values', () => {
      const template = 'Hello {name}';
      const values = {};
      expect(formatTemplate(template, values)).toBe('Hello ');
    });

    test('should handle multiple same variables', () => {
      const template = '{name} and {name}';
      const values = { name: 'John' };
      expect(formatTemplate(template, values)).toBe('John and John');
    });
  });

  // EDGE CASE 6: JSON serialization
  describe('Edge Case 6: JSON serialization', () => {
    
    test('should serialize object to JSON', () => {
      const obj = { name: 'John', age: 30 };
      const json = JSON.stringify(obj);
      expect(json).toBe('{"name":"John","age":30}');
    });

    test('should deserialize JSON to object', () => {
      const json = '{"name":"John","age":30}';
      const obj = JSON.parse(json);
      expect(obj.name).toBe('John');
    });

    test('should handle arrays', () => {
      const arr = [1, 2, 3];
      const json = JSON.stringify(arr);
      expect(JSON.parse(json)).toEqual([1, 2, 3]);
    });

    test('should handle nested objects', () => {
      const obj = { user: { name: 'John' } };
      const json = JSON.stringify(obj);
      expect(JSON.parse(json).user.name).toBe('John');
    });
  });

  // EDGE CASE 7: Slug generation
  describe('Edge Case 7: Slug generation', () => {
    
    const generateSlug = (str) => {
      return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    test('should generate slug from string', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    test('should remove special characters', () => {
      expect(generateSlug('Hello@World!')).toBe('helloworld');
    });

    test('should handle multiple spaces', () => {
      expect(generateSlug('Hello  World')).toBe('hello-world');
    });

    test('should handle uppercase', () => {
      expect(generateSlug('HELLO WORLD')).toBe('hello-world');
    });
  });

  // EDGE CASE 8: MD5/Hash simulation
  describe('Edge Case 8: String hashing', () => {
    
    const simpleHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    };

    test('should generate consistent hash', () => {
      const hash1 = simpleHash('test');
      const hash2 = simpleHash('test');
      expect(hash1).toBe(hash2);
    });

    test('should generate different hash for different input', () => {
      const hash1 = simpleHash('test1');
      const hash2 = simpleHash('test2');
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', () => {
      expect(simpleHash('')).toBeDefined();
    });
  });

  // EDGE CASE 9: Base64 encoding
  describe('Edge Case 9: Base64 encoding', () => {
    
    test('should encode string to base64', () => {
      const encoded = Buffer.from('hello').toString('base64');
      expect(encoded).toBe('aGVsbG8=');
    });

    test('should decode base64 to string', () => {
      const decoded = Buffer.from('aGVsbG8=', 'base64').toString();
      expect(decoded).toBe('hello');
    });

    test('should handle empty string', () => {
      const encoded = Buffer.from('').toString('base64');
      expect(encoded).toBe('');
    });

    test('should handle special characters', () => {
      const encoded = Buffer.from('hello@123').toString('base64');
      expect(encoded).toBeDefined();
    });
  });

  // EDGE CASE 10: Color conversion
  describe('Edge Case 10: Color hex conversion', () => {
    
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    test('should convert hex to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('should handle lowercase hex', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('should handle hex without #', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBe(null);
    });
  });
});
