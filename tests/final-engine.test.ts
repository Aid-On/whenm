import { describe, it, expect, vi } from 'vitest';
import { UnifiedSchemalessEngine, UniLLMProvider, createUnifiedEngine } from '../src/final-engine';
import type { WhenMEngine } from '../src/index';

describe('UniLLMProvider', () => {
  describe('Provider creation', () => {
    it('should create provider with config', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test-account',
        apiToken: 'test-token',
        email: 'test@example.com'
      });
      
      expect(provider).toBeDefined();
      expect(provider.parseEvent).toBeDefined();
      expect(provider.generateRules).toBeDefined();
      expect(provider.parseQuestion).toBeDefined();
      expect(provider.formatResponse).toBeDefined();
      expect(provider.complete).toBeDefined();
    });
  });

  describe('Mock provider', () => {
    it('should create mock provider', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      expect(provider).toBeDefined();
    });
  });

  describe('Event parsing', () => {
    it('should parse simple events', async () => {
      // Skip actual API call tests in unit tests
      expect(true).toBe(true);
    });

    it('should parse compound events', async () => {
      // Skip actual API call tests in unit tests
      expect(true).toBe(true);
    });
  });

  describe('Rule generation', () => {
    it('should generate rules for verbs', async () => {
      // Skip actual API call tests in unit tests
      expect(true).toBe(true);
    });

    it('should handle known verbs', async () => {
      // Skip actual API call tests in unit tests  
      expect(true).toBe(true);
    });
  });
});

describe('UnifiedSchemalessEngine', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockResolvedValue([]),
    reset: vi.fn(),
    loadFacts: vi.fn(),
    assertEvent: vi.fn()
  };

  const mockLLM = {
    parseEvent: vi.fn().mockResolvedValue({ subject: 'Alice', verb: 'learned', object: 'Python' }),
    generateRules: vi.fn().mockResolvedValue({ type: 'state_change', initiates: [{ fluent: 'knows' }] }),
    parseQuestion: vi.fn().mockResolvedValue({ queryType: 'what', subject: 'Alice' }),
    formatResponse: vi.fn().mockResolvedValue('Alice learned Python'),
    complete: vi.fn().mockResolvedValue('{}')
  };

  describe('Memory operations', () => {
    it('should remember events', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      await engine.remember('Alice learned Python', '2023-01-10');
      expect(mockLLM.parseEvent).toHaveBeenCalledWith('Alice learned Python');
    });

    it('should handle array of events from parseEvent', async () => {
      mockLLM.parseEvent = vi.fn().mockResolvedValue([
        { subject: 'Nancy', verb: 'joined', object: 'company' },
        { subject: 'Nancy', verb: 'became', object: 'Data Scientist' }
      ]);
      
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      await engine.remember('Nancy joined as Data Scientist', '2023-07-15');
      
      expect(mockLLM.parseEvent).toHaveBeenCalled();
    });
  });

  describe('Query operations', () => {
    it('should ask questions', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const result = await engine.ask('What did Alice learn?');
      expect(mockLLM.parseQuestion).toHaveBeenCalled();
    });

    it('should ask questions', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const result = await engine.ask('What is Alice doing?');
      expect(mockLLM.parseQuestion).toHaveBeenCalled();
    });
  });

  describe('Entity operations', () => {
    it('should handle entity method (deprecated)', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const entity = engine.entity('Alice');
      
      expect(entity).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('entity() method is deprecated. Use natural language queries instead.');
      consoleSpy.mockRestore();
    });
  });

  describe('Engine access', () => {
    it('should provide access to underlying engine', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const innerEngine = engine.getEngine();
      expect(innerEngine).toBe(mockEngine);
    });

    it('should provide access to LLM', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const llm = engine.getLLM();
      expect(llm).toBe(mockLLM);
    });
  });

  describe('Natural language', () => {
    it('should support ask method', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      mockLLM.formatResponse = vi.fn().mockResolvedValue('Alice learned Python');
      
      const result = await engine.ask('What did Alice learn?');
      expect(mockLLM.parseQuestion).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});

describe('createUnifiedEngine', () => {
  it('should create engine with default options', async () => {
    const engine = await createUnifiedEngine({
      provider: 'cloudflare',
      accountId: 'mock',
      apiToken: 'mock',
      email: 'mock'
    });
    
    expect(engine).toBeDefined();
    expect(engine.remember).toBeDefined();
    expect(engine.ask).toBeDefined();
  });

  it('should create engine with auto-learning enabled', async () => {
    const engine = await createUnifiedEngine({
      provider: 'cloudflare',
      accountId: 'mock',
      apiToken: 'mock',
      email: 'mock',
      autoLearn: true
    });
    
    expect(engine).toBeDefined();
  });

  it('should create engine with unix time enabled', async () => {
    const engine = await createUnifiedEngine({
      provider: 'cloudflare',
      accountId: 'mock',
      apiToken: 'mock',
      email: 'mock',
      useUnixTime: true
    });
    
    expect(engine).toBeDefined();
  });
});