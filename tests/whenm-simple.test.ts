import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhenM } from '../src/whenm';

// Mock the dependencies
vi.mock('../src/final-engine', () => ({
  createUnifiedEngine: vi.fn().mockResolvedValue({
    remember: vi.fn(),
    ask: vi.fn().mockResolvedValue('Answer'),
    entity: vi.fn().mockReturnValue(null),
    getEngine: vi.fn().mockReturnValue({
      query: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([])
    }),
    getLLM: vi.fn().mockReturnValue({
      parseEvent: vi.fn(),
      generateRules: vi.fn(),
      parseQuestion: vi.fn(),
      formatResponse: vi.fn(),
      complete: vi.fn()
    }),
    getLearner: vi.fn().mockReturnValue({
      exportRules: vi.fn().mockReturnValue('{}'),
      importRules: vi.fn()
    }),
    getEvents: vi.fn().mockResolvedValue([]),
    reset: vi.fn(),
    nl: vi.fn().mockResolvedValue('Result')
  })
}));

describe('WhenM', () => {
  describe('Static factory methods', () => {
    it('should create with cloudflare', async () => {
      const whenm = await WhenM.cloudflare({
        accountId: 'test',
        apiKey: 'test',
        email: 'test@example.com'
      });
      
      expect(whenm).toBeDefined();
      expect(whenm.remember).toBeDefined();
      expect(whenm.ask).toBeDefined();
    });

    it('should create with groq', async () => {
      const whenm = await WhenM.groq('test-api-key');
      expect(whenm).toBeDefined();
    });

    it('should create with groq and options', async () => {
      const whenm = await WhenM.groq('test-api-key', {
        model: 'mixtral-8x7b-32768',
        debug: true
      });
      expect(whenm).toBeDefined();
    });

    it('should create with gemini', async () => {
      const whenm = await WhenM.gemini('test-api-key');
      expect(whenm).toBeDefined();
    });

    it('should create with gemini and options', async () => {
      const whenm = await WhenM.gemini('test-api-key', {
        model: 'gemini-pro',
        debug: true
      });
      expect(whenm).toBeDefined();
    });

    it('should create with custom LLM', async () => {
      const mockLLM = {
        parseEvent: vi.fn(),
        generateRules: vi.fn(),
        parseQuestion: vi.fn(),
        formatResponse: vi.fn(),
        complete: vi.fn()
      };
      
      const whenm = await WhenM.custom(mockLLM as any);
      expect(whenm).toBeDefined();
    });

    it('should create with custom LLM and options', async () => {
      const mockLLM = {
        parseEvent: vi.fn(),
        generateRules: vi.fn(),
        parseQuestion: vi.fn(),
        formatResponse: vi.fn(),
        complete: vi.fn()
      };
      
      const whenm = await WhenM.custom(mockLLM as any, {
        debug: true,
        useUnixTime: true
      });
      expect(whenm).toBeDefined();
    });

    it('should create with generic create method', async () => {
      const whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      expect(whenm).toBeDefined();
    });
  });

  describe('Instance methods', () => {
    let whenm: WhenM;

    beforeEach(async () => {
      whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
    });

    it('should remember events', async () => {
      const result = await whenm.remember('Alice learned Python');
      expect(result).toBe(whenm); // Should be chainable
    });

    it('should remember events with date', async () => {
      const result = await whenm.remember('Alice learned Python', '2023-01-10');
      expect(result).toBe(whenm);
    });

    it('should ask questions', async () => {
      const answer = await whenm.ask('What did Alice learn?');
      expect(answer).toBe('Answer');
    });

    it('should ask questions with date', async () => {
      const answer = await whenm.ask('What happened?', '2023-01-10');
      expect(answer).toBe('Answer');
    });

    it('should call entity method on engine', () => {
      const entity = whenm.entity('Alice');
      // entity returns null from mock
      expect(entity).toBeNull();
    });

    it('should create query builder', () => {
      const query = whenm.query();
      expect(query).toBeDefined();
      expect(query.subject).toBeDefined();
      expect(query.verb).toBeDefined();
    });

    it('should create timeline', () => {
      const timeline = whenm.timeline('Alice');
      expect(timeline).toBeDefined();
      expect(timeline.at).toBeDefined();
      expect(timeline.between).toBeDefined();
    });

    it('should search events', async () => {
      const results = await whenm.search('Python');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with options', async () => {
      const results = await whenm.search('Python', {
        from: '2023-01-01',
        to: '2023-12-31',
        limit: 5
      });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should create natural language query chain', () => {
      const chain = whenm.nl('What did Alice learn?');
      expect(chain).toBeDefined();
      expect(chain.and).toBeDefined();
      expect(chain.execute).toBeDefined();
    });

    it('should get underlying engine', () => {
      const engine = whenm.getEngine();
      expect(engine).toBeDefined();
    });

    it('should export knowledge', () => {
      const knowledge = whenm.exportKnowledge();
      expect(typeof knowledge).toBe('string');
    });
  });

});