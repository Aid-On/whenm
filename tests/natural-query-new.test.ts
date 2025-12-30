import { describe, it, expect, vi } from 'vitest';
import { NaturalLanguageQuery, NaturalLanguageQueryChain, createNaturalQuery, createNaturalQueryChain } from '../src/natural-query';
import type { WhenMEngine } from '../src/index';
import type { UnifiedLLMProvider } from '../src/llm-provider';

describe('NaturalLanguageQuery', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockResolvedValue([
      { event: { subject: 'Alice', verb: 'learned', object: 'Python' }, date: '2023-01-10' },
      { event: { subject: 'Bob', verb: 'became', object: 'CEO' }, date: '2023-02-15' },
      { event: { subject: 'Nancy', verb: 'joined', object: 'company' }, date: '2023-07-15' },
      { event: { subject: 'Nancy', verb: 'became', object: 'Data Scientist' }, date: '2023-07-15' }
    ]),
    reset: vi.fn()
  };

  const mockLLM: UnifiedLLMProvider = {
    parseEvent: vi.fn(),
    generateRules: vi.fn(),
    parseQuestion: vi.fn(),
    formatResponse: vi.fn(),
    complete: vi.fn().mockResolvedValue('{"action":"query","entities":["Alice"]}')
  };

  describe('Query processing', () => {
    it('should create natural query processor', () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      expect(nlq).toBeDefined();
      expect(nlq.query).toBeDefined();
    });

    it('should handle direct questions', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.query('What did Alice learn?');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should route to appropriate handlers', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      mockLLM.complete = vi.fn().mockResolvedValue('{"action":"aggregate","aggregation":"count"}');
      
      const result = await nlq.query('How many events?');
      expect(result).toBeDefined();
    });
  });

  describe('Question type handling', () => {
    it('should handle WHAT questions', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleWhatQuestion('What did Alice learn?');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('subject', 'Alice');
      expect(result[0]).toHaveProperty('verb', 'learned');
    });

    it('should handle WHEN questions', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleWhenQuestion('When did Alice learn Python?');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('event');
      expect(result[0]).toHaveProperty('time');
    });

    it('should handle WHO questions', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleWhoQuestion('Who learned Python?');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('Alice');
    });

    it('should handle WHO joined as questions', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleWhoQuestion('Who joined as Data Scientist?');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('Nancy');
    });

    it('should handle HOW MANY questions', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleHowManyQuestion('How many people learned something?');
      expect(result).toHaveProperty('count');
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should handle HOW MANY with specific action', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleHowManyQuestion('How many times did people learn?');
      expect(result).toHaveProperty('count');
    });
  });

  describe('Multiple queries', () => {
    it('should process multiple queries', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const results = await nlq.processMultiple([
        'What did Alice learn?',
        'Who became CEO?'
      ]);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });
  });

  describe('Suggestions', () => {
    it('should generate suggestions with data', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const suggestions = await nlq.getSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should generate default suggestions without data', async () => {
      const emptyEngine = {
        ...mockEngine,
        getEvents: vi.fn().mockResolvedValue([])
      };
      
      const nlq = new NaturalLanguageQuery(emptyEngine, mockLLM);
      const suggestions = await nlq.getSuggestions();
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions).toContain('What events happened today?');
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid WHAT question', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleWhatQuestion('What happened?');
      expect(result).toEqual([]);
    });

    it('should handle invalid WHEN question', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleWhenQuestion('When?');
      expect(result).toEqual([]);
    });

    it('should handle invalid WHO question', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleWhoQuestion('Who?');
      expect(result).toEqual([]);
    });

    it('should handle invalid HOW MANY question', async () => {
      const nlq = new NaturalLanguageQuery(mockEngine, mockLLM);
      
      const result = await nlq.handleHowManyQuestion('How many?');
      expect(result).toEqual({ count: 0 });
    });

    it('should handle null events gracefully', async () => {
      const nullEngine = {
        ...mockEngine,
        getEvents: vi.fn().mockResolvedValue(null)
      };
      
      const nlq = new NaturalLanguageQuery(nullEngine, mockLLM);
      const result = await nlq.handleWhatQuestion('What did Alice learn?');
      expect(result).toEqual([]);
    });
  });
});

describe('NaturalLanguageQueryChain', () => {
  const mockProcessor = {
    query: vi.fn().mockResolvedValue([{ result: 'test' }]),
    processMultiple: vi.fn().mockResolvedValue([[{ result: 'test' }]]),
    getSuggestions: vi.fn()
  } as any;

  describe('Chain creation', () => {
    it('should create chain with initial query', () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor, 'initial query');
      expect(chain).toBeDefined();
      expect(chain.and).toBeDefined();
      expect(chain.execute).toBeDefined();
    });

    it('should create chain without initial query', () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor);
      expect(chain).toBeDefined();
    });
  });

  describe('Chain methods', () => {
    it('should chain and() method', () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor);
      const result = chain.and('another query');
      expect(result).toBe(chain);
    });

    it('should chain where() method', () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor);
      const result = chain.where('subject = Alice');
      expect(result).toBe(chain);
    });

    it('should chain sortBy() method', () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor);
      const result = chain.sortBy('time', 'desc');
      expect(result).toBe(chain);
    });

    it('should chain take() method', () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor);
      const result = chain.take(10);
      expect(result).toBe(chain);
    });
  });

  describe('Chain execution', () => {
    it('should execute chain', async () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor, 'query');
      const results = await chain.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(mockProcessor.processMultiple).toHaveBeenCalled();
    });

    it('should get last result', async () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor);
      await chain.and('query').execute();
      
      const last = chain.getLastResult();
      expect(last).toBeDefined();
    });

    it('should get all results', async () => {
      const chain = new NaturalLanguageQueryChain(mockProcessor);
      await chain.and('query').execute();
      
      const all = chain.getAllResults();
      expect(Array.isArray(all)).toBe(true);
    });
  });
});

describe('Factory functions', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockResolvedValue([]),
    reset: vi.fn()
  };

  const mockLLM: UnifiedLLMProvider = {
    parseEvent: vi.fn(),
    generateRules: vi.fn(),
    parseQuestion: vi.fn(),
    formatResponse: vi.fn(),
    complete: vi.fn()
  };

  it('should create natural query processor', () => {
    const nlq = createNaturalQuery(mockEngine, mockLLM);
    expect(nlq).toBeInstanceOf(NaturalLanguageQuery);
  });

  it('should create natural query chain', () => {
    const nlq = createNaturalQuery(mockEngine, mockLLM);
    const chain = createNaturalQueryChain(nlq, 'initial');
    expect(chain).toBeInstanceOf(NaturalLanguageQueryChain);
  });
});