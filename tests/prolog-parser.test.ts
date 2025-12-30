import { describe, it, expect } from 'vitest';
import { PrologParser, formatPrologValue, extractArgs } from '../src/prolog-parser.js';

describe('PrologParser', () => {
  const parser = new PrologParser();
  
  describe('Simple atoms', () => {
    it('should parse simple atoms', () => {
      expect(parser.parse('alice')).toEqual({ success: true, value: 'alice' });
      expect(parser.parse('manager')).toEqual({ success: true, value: 'manager' });
      expect(parser.parse('tech_lead')).toEqual({ success: true, value: 'tech_lead' });
    });
  });
  
  describe('Quoted strings', () => {
    it('should parse quoted strings with spaces', () => {
      expect(parser.parse('"Alice Smith"')).toEqual({ 
        success: true, 
        value: 'Alice Smith' 
      });
    });
    
    it('should parse strings with commas', () => {
      expect(parser.parse('"New York, NY"')).toEqual({ 
        success: true, 
        value: 'New York, NY' 
      });
    });
    
    it('should handle escape sequences', () => {
      expect(parser.parse('"Line 1\\nLine 2"')).toEqual({ 
        success: true, 
        value: 'Line 1\nLine 2' 
      });
      
      expect(parser.parse('"Quote: \\"Hello\\""')).toEqual({ 
        success: true, 
        value: 'Quote: "Hello"' 
      });
    });
  });
  
  describe('Numbers', () => {
    it('should parse integers', () => {
      expect(parser.parse('42')).toEqual({ success: true, value: 42 });
      expect(parser.parse('-100')).toEqual({ success: true, value: -100 });
    });
    
    it('should parse floats', () => {
      expect(parser.parse('3.14')).toEqual({ success: true, value: 3.14 });
      expect(parser.parse('-0.5')).toEqual({ success: true, value: -0.5 });
    });
    
    it('should parse scientific notation', () => {
      expect(parser.parse('1.23e10')).toEqual({ success: true, value: 1.23e10 });
      expect(parser.parse('5E-3')).toEqual({ success: true, value: 0.005 });
    });
  });
  
  describe('Lists', () => {
    it('should parse empty list', () => {
      expect(parser.parse('[]')).toEqual({ success: true, value: [] });
    });
    
    it('should parse list of atoms', () => {
      expect(parser.parse('[a, b, c]')).toEqual({ 
        success: true, 
        value: ['a', 'b', 'c'] 
      });
    });
    
    it('should parse list of mixed types', () => {
      expect(parser.parse('[alice, 42, "New York, NY"]')).toEqual({ 
        success: true, 
        value: ['alice', 42, 'New York, NY'] 
      });
    });
    
    it('should parse nested lists', () => {
      expect(parser.parse('[[1, 2], [3, 4]]')).toEqual({ 
        success: true, 
        value: [[1, 2], [3, 4]] 
      });
    });
  });
  
  describe('Compound terms', () => {
    it('should parse simple compound terms', () => {
      const result = parser.parse('role(alice, manager)');
      expect(result).toEqual({
        success: true,
        value: {
          functor: 'role',
          args: ['alice', 'manager']
        }
      });
    });
    
    it('should parse compound with quoted strings', () => {
      const result = parser.parse('address("123 Main St", "New York, NY", "10001")');
      expect(result).toEqual({
        success: true,
        value: {
          functor: 'address',
          args: ['123 Main St', 'New York, NY', '10001']
        }
      });
    });
    
    it('should parse nested compound terms', () => {
      const result = parser.parse('company(name("TechCorp"), employees([alice, bob]))');
      expect(result).toEqual({
        success: true,
        value: {
          functor: 'company',
          args: [
            { functor: 'name', args: ['TechCorp'] },
            { functor: 'employees', args: [['alice', 'bob']] }
          ]
        }
      });
    });
  });
  
  describe('Edge cases', () => {
    it('should handle whitespace', () => {
      expect(parser.parse('  alice  ')).toEqual({ 
        success: true, 
        value: 'alice' 
      });
      
      expect(parser.parse('role( alice , manager )')).toEqual({
        success: true,
        value: {
          functor: 'role',
          args: ['alice', 'manager']
        }
      });
    });
    
    it('should report errors for invalid input', () => {
      expect(parser.parse('role(alice')).toMatchObject({
        success: false,
        error: expect.stringContaining('Unexpected end')
      });
      
      expect(parser.parse('"unterminated string')).toMatchObject({
        success: false,
        error: expect.stringContaining('Unterminated string')
      });
    });
  });
});

describe('formatPrologValue', () => {
  it('should format simple atoms', () => {
    expect(formatPrologValue('alice')).toBe('alice');
    expect(formatPrologValue('tech_lead')).toBe('tech_lead');
  });
  
  it('should quote strings with special characters', () => {
    expect(formatPrologValue('Alice Smith')).toBe('"Alice Smith"');
    expect(formatPrologValue('New York, NY')).toBe('"New York, NY"');
  });
  
  it('should format numbers', () => {
    expect(formatPrologValue(42)).toBe('42');
    expect(formatPrologValue(3.14)).toBe('3.14');
  });
  
  it('should format lists', () => {
    expect(formatPrologValue(['a', 'b', 'c'])).toBe('[a, b, c]');
    expect(formatPrologValue([1, 'alice', 'New York'])).toBe('[1, alice, "New York"]');
  });
  
  it('should format compound terms', () => {
    expect(formatPrologValue({
      functor: 'role',
      args: ['alice', 'manager']
    })).toBe('role(alice, manager)');
    
    expect(formatPrologValue({
      functor: 'address',
      args: ['123 Main St', 'New York, NY']
    })).toBe('address("123 Main St", "New York, NY")');
  });
});

describe('extractArgs', () => {
  const parser = new PrologParser();
  
  it('should extract arguments from compound terms', () => {
    const term = parser.parse('role(alice, manager)').value;
    expect(extractArgs(term, 'role')).toEqual(['alice', 'manager']);
  });
  
  it('should return null for non-matching functor', () => {
    const term = parser.parse('role(alice, manager)').value;
    expect(extractArgs(term, 'position')).toBeNull();
  });
  
  it('should return null for non-compound terms', () => {
    expect(extractArgs('alice', 'role')).toBeNull();
    expect(extractArgs(42, 'role')).toBeNull();
    expect(extractArgs(['alice', 'bob'], 'role')).toBeNull();
  });
});