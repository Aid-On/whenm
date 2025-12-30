import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhenM } from '../src/whenm';
import { QueryBuilder } from '../src/query-builder';
import { Timeline } from '../src/timeline';

// Mock the final-engine module
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
    getEvents: vi.fn().mockResolvedValue([
      { event: { subject: 'Alice', verb: 'learned', object: 'Python' }, date: '2023-01-10', timestamp: 1000 },
      { event: { subject: 'Bob', verb: 'became', object: 'CEO' }, date: '2023-02-15', timestamp: 2000 }
    ]),
    reset: vi.fn(),
    nl: vi.fn().mockResolvedValue('Natural language result')
  })
}));

describe('WhenM Complete Coverage', () => {
  describe('Factory methods complete coverage', () => {
    it('should create with cloudflare using all options', async () => {
      const whenm = await WhenM.cloudflare({
        accountId: 'test-account',
        apiKey: 'test-key',
        email: 'test@example.com'
      }, {
        model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        debug: true,
        useUnixTime: true,
        autoLearn: true
      });
      
      expect(whenm).toBeInstanceOf(WhenM);
      expect(whenm.remember).toBeDefined();
      expect(whenm.ask).toBeDefined();
    });

    it('should create with groq using string apiKey', async () => {
      const whenm = await WhenM.groq('test-api-key');
      expect(whenm).toBeInstanceOf(WhenM);
    });

    it('should create with groq using options object', async () => {
      const whenm = await WhenM.groq('test-api-key', {
        model: 'llama-3.3-70b-versatile',
        debug: true,
        useUnixTime: false,
        autoLearn: true
      });
      expect(whenm).toBeInstanceOf(WhenM);
    });

    it('should create with gemini using string apiKey', async () => {
      const whenm = await WhenM.gemini('test-api-key');
      expect(whenm).toBeInstanceOf(WhenM);
    });

    it('should create with gemini using options object', async () => {
      const whenm = await WhenM.gemini('test-api-key', {
        model: 'gemini-2.0-flash-exp',
        debug: false,
        useUnixTime: true,
        autoLearn: false
      });
      expect(whenm).toBeInstanceOf(WhenM);
    });

    it('should create with custom LLM provider', async () => {
      const customLLM = {
        parseEvent: vi.fn(),
        generateRules: vi.fn(),
        parseQuestion: vi.fn(),
        formatResponse: vi.fn(),
        complete: vi.fn()
      };
      
      const whenm = await WhenM.custom(customLLM as any);
      expect(whenm).toBeInstanceOf(WhenM);
    });

    it('should create with custom LLM and options', async () => {
      const customLLM = {
        parseEvent: vi.fn(),
        generateRules: vi.fn(),
        parseQuestion: vi.fn(),
        formatResponse: vi.fn(),
        complete: vi.fn()
      };
      
      const whenm = await WhenM.custom(customLLM as any, {
        debug: true,
        useUnixTime: true,
        autoLearn: true
      });
      expect(whenm).toBeInstanceOf(WhenM);
    });

    it('should create with generic create method', async () => {
      // Test with cloudflare config
      const whenm1 = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com',
        model: '@cf/meta/llama-3.1-8b-instruct'
      });
      expect(whenm1).toBeInstanceOf(WhenM);
      
      // Test with groq config
      const whenm2 = await WhenM.create({
        provider: 'groq',
        apiKey: 'test-key',
        model: 'mixtral-8x7b-32768'
      });
      expect(whenm2).toBeInstanceOf(WhenM);
      
      // Test with gemini config
      const whenm3 = await WhenM.create({
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-pro'
      });
      expect(whenm3).toBeInstanceOf(WhenM);
      
      // Test with custom LLM
      const whenm4 = await WhenM.create({
        llm: customLLM as any
      });
      expect(whenm4).toBeInstanceOf(WhenM);
    });
  });

  describe('Instance methods complete coverage', () => {
    let whenm: WhenM;

    beforeEach(async () => {
      whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
    });

    it('should remember events with various date formats', async () => {
      // With string date
      const result1 = await whenm.remember('Alice learned Python', '2023-01-10');
      expect(result1).toBe(whenm); // Should be chainable
      
      // With Date object
      const result2 = await whenm.remember('Bob became CEO', new Date('2023-02-15'));
      expect(result2).toBe(whenm);
      
      // Without date (uses current date)
      const result3 = await whenm.remember('Charlie joined');
      expect(result3).toBe(whenm);
      
      // With undefined date
      const result4 = await whenm.remember('Diana left', undefined);
      expect(result4).toBe(whenm);
    });

    it('should support method chaining', async () => {
      const result = await whenm
        .remember('Alice learned Python', '2023-01-10')
        .then(w => w.remember('Bob became CEO', '2023-02-15'))
        .then(w => w.remember('Charlie joined', '2023-03-20'));
      
      expect(result).toBe(whenm);
    });

    it('should ask questions with various date formats', async () => {
      // Without date
      const answer1 = await whenm.ask('What did Alice learn?');
      expect(answer1).toBe('Answer');
      
      // With string date
      const answer2 = await whenm.ask('What happened?', '2023-01-10');
      expect(answer2).toBe('Answer');
      
      // With Date object
      const answer3 = await whenm.ask('Who became CEO?', new Date('2023-02-15'));
      expect(answer3).toBe('Answer');
      
      // With undefined date
      const answer4 = await whenm.ask('What is happening?', undefined);
      expect(answer4).toBe('Answer');
    });

    it('should call entity method on engine', () => {
      const entity = whenm.entity('Alice');
      expect(entity).toBeNull();
    });

    it('should create query builder', () => {
      const query = whenm.query();
      expect(query).toBeInstanceOf(QueryBuilder);
      expect(query.subject).toBeDefined();
      expect(query.verb).toBeDefined();
      expect(query.object).toBeDefined();
      expect(query.at).toBeDefined();
      expect(query.between).toBeDefined();
      expect(query.execute).toBeDefined();
    });

    it('should create timeline for subject', () => {
      const timeline = whenm.timeline('Alice');
      expect(timeline).toBeInstanceOf(Timeline);
      expect(timeline.at).toBeDefined();
      expect(timeline.between).toBeDefined();
      expect(timeline.before).toBeDefined();
      expect(timeline.after).toBeDefined();
    });

    it('should search events with keyword', async () => {
      const results = await whenm.search('Python');
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('subject', 'Alice');
      expect(results[0]).toHaveProperty('verb', 'learned');
      expect(results[0]).toHaveProperty('object', 'Python');
    });

    it('should search with options', async () => {
      const results = await whenm.search('CEO', {
        from: '2023-01-01',
        to: '2023-12-31',
        limit: 5
      });
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('subject', 'Bob');
      expect(results[0]).toHaveProperty('verb', 'became');
    });

    it('should search with various option combinations', async () => {
      // Search with only from date
      const results1 = await whenm.search('test', {
        from: '2023-01-01'
      });
      expect(Array.isArray(results1)).toBe(true);
      
      // Search with only to date
      const results2 = await whenm.search('test', {
        to: '2023-12-31'
      });
      expect(Array.isArray(results2)).toBe(true);
      
      // Search with only limit
      const results3 = await whenm.search('test', {
        limit: 10
      });
      expect(Array.isArray(results3)).toBe(true);
      
      // Search with Date objects
      const results4 = await whenm.search('test', {
        from: new Date('2023-01-01'),
        to: new Date('2023-12-31')
      });
      expect(Array.isArray(results4)).toBe(true);
    });

    it('should create natural language query chain', () => {
      const chain = whenm.nl('What did Alice learn?');
      expect(chain).toBeDefined();
      expect(chain.and).toBeDefined();
      expect(chain.execute).toBeDefined();
    });

    it('should chain natural language queries', async () => {
      const chain = whenm.nl('What did Alice learn?');
      const result = await chain
        .and('When did Bob become CEO?')
        .and('Who joined the company?')
        .execute();
      
      expect(result).toBeDefined();
    });

    it('should get underlying engine', () => {
      const engine = whenm.getEngine();
      expect(engine).toBeDefined();
      expect(engine.query).toBeDefined();
      expect(engine.getEvents).toBeDefined();
    });

    it('should export knowledge', () => {
      const knowledge = whenm.exportKnowledge();
      expect(typeof knowledge).toBe('string');
      expect(knowledge).toBe('{}');
    });

    it('should import knowledge', () => {
      const knowledgeData = JSON.stringify({
        rules: ['rule1', 'rule2'],
        facts: ['fact1', 'fact2']
      });
      
      whenm.importKnowledge(knowledgeData);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should reset the system', async () => {
      await whenm.remember('Alice learned Python', '2023-01-10');
      await whenm.reset();
      
      const events = await whenm.getEngine().getEvents();
      expect(events).toEqual([]);
    });

    it('should get all events', async () => {
      const events = await whenm.getEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(2);
      expect(events[0]).toHaveProperty('event');
      expect(events[0]).toHaveProperty('date');
      expect(events[0]).toHaveProperty('timestamp');
    });
  });

  describe('Search filtering logic', () => {
    let whenm: WhenM;

    beforeEach(async () => {
      whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
    });

    it('should filter events by keyword in all fields', async () => {
      // Search in subject
      const results1 = await whenm.search('Alice');
      expect(results1).toHaveLength(1);
      expect(results1[0].subject).toBe('Alice');
      
      // Search in verb
      const results2 = await whenm.search('learned');
      expect(results2).toHaveLength(1);
      expect(results2[0].verb).toBe('learned');
      
      // Search in object
      const results3 = await whenm.search('Python');
      expect(results3).toHaveLength(1);
      expect(results3[0].object).toBe('Python');
      
      // Search in object (CEO)
      const results4 = await whenm.search('CEO');
      expect(results4).toHaveLength(1);
      expect(results4[0].object).toBe('CEO');
    });

    it('should handle case-insensitive search', async () => {
      const results1 = await whenm.search('alice');
      expect(results1).toHaveLength(1);
      
      const results2 = await whenm.search('PYTHON');
      expect(results2).toHaveLength(1);
      
      const results3 = await whenm.search('ceo');
      expect(results3).toHaveLength(1);
    });

    it('should handle date range filtering', async () => {
      // Events before a date
      const results1 = await whenm.search('', {
        to: '2023-01-31'
      });
      expect(results1).toHaveLength(1);
      expect(results1[0].subject).toBe('Alice');
      
      // Events after a date
      const results2 = await whenm.search('', {
        from: '2023-02-01'
      });
      expect(results2).toHaveLength(1);
      expect(results2[0].subject).toBe('Bob');
      
      // Events in a range
      const results3 = await whenm.search('', {
        from: '2023-01-01',
        to: '2023-03-01'
      });
      expect(results3).toHaveLength(2);
    });

    it('should handle limit option', async () => {
      const results = await whenm.search('', {
        limit: 1
      });
      expect(results).toHaveLength(1);
    });

    it('should handle empty search results', async () => {
      const results = await whenm.search('NonExistent');
      expect(results).toEqual([]);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle empty event text', async () => {
      const whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      await whenm.remember('', '2023-01-10');
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle empty question text', async () => {
      const whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      const answer = await whenm.ask('');
      expect(answer).toBeDefined();
    });

    it('should handle very long text', async () => {
      const whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      const longText = 'Alice ' + 'learned programming '.repeat(100);
      await whenm.remember(longText, '2023-01-10');
      
      const answer = await whenm.ask('What did Alice do?');
      expect(answer).toBeDefined();
    });

    it('should handle special characters in text', async () => {
      const whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      await whenm.remember('Alice learned C++/Java & Python', '2023-01-10');
      await whenm.remember('Bob became CEO @ Tech Corp.', '2023-02-15');
      
      const results = await whenm.search('C++');
      expect(results).toBeDefined();
    });

    it('should handle invalid dates', async () => {
      const whenm = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      // Invalid date string
      await whenm.remember('Event happened', 'invalid-date');
      
      // Invalid Date object
      await whenm.remember('Another event', new Date('invalid'));
      
      // Should not throw
      expect(true).toBe(true);
    });
  });
});