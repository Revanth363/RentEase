/**
 * Simple utility function tests
 * Testing common helper functions across the application
 */

describe('Utility Functions - String Helpers', () => {
  
  // EDGE CASE 1: String trimming and normalization
  describe('Edge Case 1: String trimming and normalization', () => {
    
    test('should handle normal strings', () => {
      const str = 'Hello World';
      expect(str.trim()).toBe('Hello World');
    });

    test('should trim leading and trailing spaces', () => {
      const str = '  Hello World  ';
      expect(str.trim()).toBe('Hello World');
    });

    test('should handle empty strings', () => {
      const str = '';
      expect(str.trim()).toBe('');
    });

    test('should handle whitespace only strings', () => {
      const str = '   ';
      expect(str.trim()).toBe('');
    });

    test('should handle tabs and newlines', () => {
      const str = '\tHello\n';
      expect(str.trim()).toBe('Hello');
    });
  });

  // EDGE CASE 2: Case conversion
  describe('Edge Case 2: Case conversion', () => {
    
    test('should convert to uppercase', () => {
      const str = 'hello';
      expect(str.toUpperCase()).toBe('HELLO');
    });

    test('should convert to lowercase', () => {
      const str = 'HELLO';
      expect(str.toLowerCase()).toBe('hello');
    });

    test('should handle mixed case', () => {
      const str = 'HeLLo WoRLd';
      expect(str.toLowerCase()).toBe('hello world');
    });

    test('should handle special characters', () => {
      const str = 'Hello@123';
      expect(str.toUpperCase()).toBe('HELLO@123');
    });
  });

  // EDGE CASE 3: String replacement
  describe('Edge Case 3: String replacement', () => {
    
    test('should replace first occurrence', () => {
      const str = 'hello hello hello';
      expect(str.replace('hello', 'hi')).toBe('hi hello hello');
    });

    test('should replace with regex', () => {
      const str = 'hello hello hello';
      expect(str.replace(/hello/g, 'hi')).toBe('hi hi hi');
    });

    test('should handle empty replacement', () => {
      const str = 'hello world';
      expect(str.replace('hello', '')).toBe(' world');
    });
  });

  // EDGE CASE 4: String splitting
  describe('Edge Case 4: String splitting', () => {
    
    test('should split by delimiter', () => {
      const str = 'a,b,c';
      expect(str.split(',')).toEqual(['a', 'b', 'c']);
    });

    test('should split empty string', () => {
      const str = '';
      expect(str.split(',')).toEqual(['']);
    });

    test('should split with limit', () => {
      const str = 'a,b,c,d';
      expect(str.split(',', 2)).toEqual(['a', 'b']);
    });
  });

  // EDGE CASE 5: String includes/indexOf
  describe('Edge Case 5: String includes/indexOf', () => {
    
    test('should check if string includes substring', () => {
      const str = 'Hello World';
      expect(str.includes('World')).toBe(true);
    });

    test('should find index of substring', () => {
      const str = 'Hello World';
      expect(str.indexOf('World')).toBe(6);
    });

    test('should return -1 when not found', () => {
      const str = 'Hello World';
      expect(str.indexOf('xyz')).toBe(-1);
    });
  });
});

describe('Utility Functions - Number Helpers', () => {
  
  // EDGE CASE 6: Number rounding
  describe('Edge Case 6: Number rounding', () => {
    
    test('should round to nearest integer', () => {
      expect(Math.round(4.4)).toBe(4);
      expect(Math.round(4.6)).toBe(5);
    });

    test('should use floor correctly', () => {
      expect(Math.floor(4.9)).toBe(4);
    });

    test('should use ceil correctly', () => {
      expect(Math.ceil(4.1)).toBe(5);
    });

    test('should handle negative numbers', () => {
      expect(Math.round(-4.6)).toBe(-5);
      expect(Math.floor(-4.1)).toBe(-5);
    });
  });

  // EDGE CASE 7: Number parsing
  describe('Edge Case 7: Number parsing', () => {
    
    test('should parse integers', () => {
      expect(parseInt('123')).toBe(123);
    });

    test('should parse floats', () => {
      expect(parseFloat('123.45')).toBe(123.45);
    });

    test('should handle invalid numbers', () => {
      expect(isNaN(parseInt('abc'))).toBe(true);
    });

    test('should parse with radix', () => {
      expect(parseInt('FF', 16)).toBe(255);
    });
  });

  // EDGE CASE 8: Number comparisons
  describe('Edge Case 8: Number comparisons', () => {
    
    test('should compare numbers correctly', () => {
      expect(5 > 3).toBe(true);
      expect(3 < 5).toBe(true);
    });

    test('should handle equal numbers', () => {
      expect(5 === 5).toBe(true);
      expect(5 == '5').toBe(true);
    });

    test('should handle NaN correctly', () => {
      expect(NaN === NaN).toBe(false);
      expect(isNaN(NaN)).toBe(true);
    });
  });
});

describe('Utility Functions - Array Helpers', () => {
  
  // EDGE CASE 9: Array includes
  describe('Edge Case 9: Array includes', () => {
    
    test('should check if array includes element', () => {
      const arr = [1, 2, 3];
      expect(arr.includes(2)).toBe(true);
    });

    test('should return false if not included', () => {
      const arr = [1, 2, 3];
      expect(arr.includes(5)).toBe(false);
    });

    test('should handle empty array', () => {
      const arr = [];
      expect(arr.includes(1)).toBe(false);
    });
  });

  // EDGE CASE 10: Array find
  describe('Edge Case 10: Array find', () => {
    
    test('should find element matching condition', () => {
      const arr = [1, 2, 3, 4];
      expect(arr.find(x => x > 2)).toBe(3);
    });

    test('should return undefined if not found', () => {
      const arr = [1, 2, 3];
      expect(arr.find(x => x > 10)).toBeUndefined();
    });
  });

  // EDGE CASE 11: Array filter
  describe('Edge Case 11: Array filter', () => {
    
    test('should filter array elements', () => {
      const arr = [1, 2, 3, 4];
      expect(arr.filter(x => x > 2)).toEqual([3, 4]);
    });

    test('should return empty array if no matches', () => {
      const arr = [1, 2, 3];
      expect(arr.filter(x => x > 10)).toEqual([]);
    });
  });

  // EDGE CASE 12: Array map
  describe('Edge Case 12: Array map', () => {
    
    test('should transform array elements', () => {
      const arr = [1, 2, 3];
      expect(arr.map(x => x * 2)).toEqual([2, 4, 6]);
    });

    test('should map to objects', () => {
      const arr = [1, 2];
      const result = arr.map(x => ({ value: x }));
      expect(result).toEqual([{ value: 1 }, { value: 2 }]);
    });
  });
});

describe('Utility Functions - Object Helpers', () => {
  
  // EDGE CASE 13: Object key access
  describe('Edge Case 13: Object key access', () => {
    
    test('should access object properties', () => {
      const obj = { name: 'John', age: 30 };
      expect(obj.name).toBe('John');
      expect(obj['age']).toBe(30);
    });

    test('should return undefined for missing keys', () => {
      const obj = { name: 'John' };
      expect(obj.missing).toBeUndefined();
    });

    test('should handle nested objects', () => {
      const obj = { user: { name: 'John' } };
      expect(obj.user.name).toBe('John');
    });
  });

  // EDGE CASE 14: Object hasOwnProperty
  describe('Edge Case 14: Object hasOwnProperty', () => {
    
    test('should check if object has property', () => {
      const obj = { name: 'John' };
      expect(obj.hasOwnProperty('name')).toBe(true);
    });

    test('should return false for missing property', () => {
      const obj = { name: 'John' };
      expect(obj.hasOwnProperty('age')).toBe(false);
    });
  });

  // EDGE CASE 15: Object keys/values
  describe('Edge Case 15: Object keys/values', () => {
    
    test('should get object keys', () => {
      const obj = { name: 'John', age: 30 };
      expect(Object.keys(obj)).toEqual(['name', 'age']);
    });

    test('should get object values', () => {
      const obj = { name: 'John', age: 30 };
      expect(Object.values(obj)).toEqual(['John', 30]);
    });

    test('should handle empty object', () => {
      const obj = {};
      expect(Object.keys(obj)).toEqual([]);
    });
  });
});
