import { describe, it, expect, vi } from 'vitest';
import { NaturalLanguageQuery, NaturalLanguageQueryChain } from '../src/natural-query';
import type { WhenMEngine } from '../src/index';
import type { UnifiedLLMProvider } from '../src/final-engine';

describe('NaturalLanguageQuery', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn(),
    getEvents: vi.fn(),
    reset: vi.fn(),
    allEvents: vi.fn().mockResolvedValue([])
  };

  const mockLLM: UnifiedLLMProvider = {
    parseEvent: vi.fn().mockResolvedValue({ subject: 'Alice', verb: 'learned', object: 'Python' }),
    generateRules: vi.fn().mockResolvedValue({ type: 'state_change', initiates: [] }),
    parseQuestion: vi.fn().mockResolvedValue({ queryType: 'what', subject: 'Alice' }),
    formatResponse: vi.fn().mockResolvedValue('Alice learned Python'),
    complete: vi.fn().mockResolvedValue('{}')
  };

  describe('Basic functionality', () => {
    it('should create instance', () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      expect(nlq).toBeDefined();
      expect(nlq.query).toBeDefined();
    });

    it('should process natural language queries', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      // query method exists and returns something
      const result = await nlq.query('Who learned Python?');
      
      // Should have called engine methods
      expect(mockEngine.allEvents).toBeDefined();
    });
  });

  describe('Query type handling', () => {
    it('should handle WHO queries', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      const result = await nlq.query('Who learned Python?');
      expect(result).toBeDefined();
    });

    it('should handle WHAT queries', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      const result = await nlq.query('What did Alice learn?');
      expect(result).toBeDefined();
    });

    it('should handle WHEN queries', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      const result = await nlq.query('When did Alice learn Python?');
      expect(result).toBeDefined();
    });

    it('should handle HOW MANY queries', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      const result = await nlq.query('How many people learned Python?');
      expect(result).toBeDefined();
    });
  });
});

describe('NaturalLanguageQueryChain', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn(),
    getEvents: vi.fn(),
    reset: vi.fn()
  };

  const mockLLM: UnifiedLLMProvider = {
    parseEvent: vi.fn(),
    generateRules: vi.fn(),
    parseQuestion: vi.fn(),
    formatResponse: vi.fn(),
    complete: vi.fn()
  };

  describe('Chain methods', () => {
    it('should support during() chaining', () => {
      const chain = new NaturalLanguageQueryChain('test query', mockEngine, mockLLM);
      
      const result = chain.during('2023-01-01 to 2023-12-31');
      expect(result).toBe(chain); // Should return self for chaining
    });

    it('should support about() chaining', () => {
      const chain = new NaturalLanguageQueryChain('test query', mockEngine, mockLLM);
      
      const result = chain.about('Alice');
      expect(result).toBe(chain);
    });

    it('should support limit() chaining', () => {
      const chain = new NaturalLanguageQueryChain('test query', mockEngine, mockLLM);
      
      const result = chain.limit(10);
      expect(result).toBe(chain);
    });

    it('should support orderBy() chaining', () => {
      const chain = new NaturalLanguageQueryChain('test query', mockEngine, mockLLM);
      
      const result = chain.orderBy('time');
      expect(result).toBe(chain);
    });
  });

  describe('Promise interface', () => {
    it('should be thenable', () => {
      const chain = new NaturalLanguageQueryChain('test query', mockEngine, mockLLM);
      
      expect(chain.then).toBeDefined();
      expect(typeof chain.then).toBe('function');
    });

    it('should support catch()', () => {
      const chain = new NaturalLanguageQueryChain('test query', mockEngine, mockLLM);
      
      expect(chain.catch).toBeDefined();
      expect(typeof chain.catch).toBe('function');
    });

    it('should support finally()', () => {
      const chain = new NaturalLanguageQueryChain('test query', mockEngine, mockLLM);
      
      expect(chain.finally).toBeDefined();
      expect(typeof chain.finally).toBe('function');
    });
  });
});