import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedSchemalessEngine } from '../src/unified-engine';
import type { WhenMEngine } from '../src/index';
import type { UnifiedLLMProvider } from '../src/llm-provider';

describe('UnifiedSchemalessEngine', () => {
  let mockEngine: WhenMEngine;
  let mockLLM: UnifiedLLMProvider;
  let engine: UnifiedSchemalessEngine;

  beforeEach(() => {
    mockEngine = {
      remember: vi.fn(),
      query: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([]),
      reset: vi.fn(),
      loadFacts: vi.fn(),
      assertEvent: vi.fn()
    };

    mockLLM = {
      parseEvent: vi.fn().mockResolvedValue({
        subject: 'Alice',
        verb: 'learned',
        object: 'Python'
      }),
      generateRules: vi.fn().mockResolvedValue({
        type: 'state_change',
        initiates: [{ fluent: 'knows' }]
      }),
      parseQuestion: vi.fn().mockResolvedValue({
        queryType: 'what',
        subject: 'Alice'
      }),
      formatResponse: vi.fn().mockResolvedValue('Alice learned Python'),
      complete: vi.fn().mockResolvedValue('{}')
    };

    engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
  });

  describe('Initialization', () => {
    it('should create engine', () => {
      expect(engine).toBeDefined();
      expect(engine.remember).toBeDefined();
      expect(engine.ask).toBeDefined();
    });

    it('should initialize with Event Calculus rules', async () => {
      await engine.initialize();
      expect(mockEngine.loadFacts).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockEngine.loadFacts = vi.fn().mockRejectedValue(new Error('Prolog error'));
      
      // Should not throw
      await expect(engine.initialize()).resolves.not.toThrow();
    });

    it('should handle debug mode', async () => {
      const debugEngine = new UnifiedSchemalessEngine(mockEngine, mockLLM, { debug: true });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockEngine.loadFacts = vi.fn().mockRejectedValue(new Error('Test error'));
      await debugEngine.initialize();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Remember events', () => {
    it('should remember simple events', async () => {
      await engine.remember('Alice learned Python', '2023-01-10');
      
      expect(mockLLM.parseEvent).toHaveBeenCalledWith('Alice learned Python');
      expect(mockEngine.assertEvent).toHaveBeenCalled();
    });

    it('should handle compound events', async () => {
      mockLLM.parseEvent = vi.fn().mockResolvedValue([
        { subject: 'Nancy', verb: 'joined', object: 'company' },
        { subject: 'Nancy', verb: 'became', object: 'Data Scientist' }
      ]);
      
      await engine.remember('Nancy joined as Data Scientist', '2023-07-15');
      
      expect(mockLLM.parseEvent).toHaveBeenCalled();
      expect(mockEngine.assertEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle events without object', async () => {
      mockLLM.parseEvent = vi.fn().mockResolvedValue({
        subject: 'Alice',
        verb: 'arrived'
      });
      
      await engine.remember('Alice arrived', '2023-01-10');
      expect(mockEngine.assertEvent).toHaveBeenCalled();
    });

    it('should update entity states for role changes', async () => {
      mockLLM.parseEvent = vi.fn().mockResolvedValue({
        subject: 'Alice',
        verb: 'became',
        object: 'CEO'
      });
      
      await engine.remember('Alice became CEO', '2023-01-10');
      expect(mockEngine.assertEvent).toHaveBeenCalled();
    });

    it('should track skills for learning events', async () => {
      mockLLM.parseEvent = vi.fn().mockResolvedValue({
        subject: 'Alice',
        verb: 'learned',
        object: 'Python'
      });
      
      await engine.remember('Alice learned Python', '2023-01-10');
      await engine.remember('Alice learned JavaScript', '2023-02-15');
      
      expect(mockEngine.assertEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle dates correctly', async () => {
      // Test with Date object
      await engine.remember('Alice learned Python', new Date('2023-01-10'));
      expect(mockEngine.assertEvent).toHaveBeenCalled();
      
      // Test with undefined date (should use current date)
      await engine.remember('Bob joined', undefined);
      expect(mockEngine.assertEvent).toHaveBeenCalledTimes(2);
      
      // Test with invalid date string
      await engine.remember('Charlie started', 'invalid-date');
      expect(mockEngine.assertEvent).toHaveBeenCalledTimes(3);
    });

    it('should use autoLearn when enabled', async () => {
      const autoLearnEngine = new UnifiedSchemalessEngine(mockEngine, mockLLM, { autoLearn: true });
      
      await autoLearnEngine.remember('Alice learned Python', '2023-01-10');
      expect(mockLLM.generateRules).toHaveBeenCalledWith('learned', 'Alice learned Python');
    });
  });

  describe('Ask questions', () => {
    it('should answer questions', async () => {
      const answer = await engine.ask('What did Alice learn?');
      
      expect(mockLLM.parseQuestion).toHaveBeenCalledWith('What did Alice learn?');
      expect(mockLLM.formatResponse).toHaveBeenCalled();
      expect(answer).toBe('Alice learned Python');
    });

    it('should handle temporal queries', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Alice', verb: 'learned', object: 'JavaScript' }
      ]);
      
      const answer = await engine.ask('What did Alice learn?');
      expect(mockLLM.formatResponse).toHaveBeenCalled();
    });

    it('should filter relevant results', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Alice', verb: 'learned', object: 'JavaScript' }
      ]);
      
      mockLLM.parseQuestion = vi.fn().mockResolvedValue({
        queryType: 'what',
        subject: 'Alice',
        predicate: 'learned'
      });
      
      mockLLM.complete = vi.fn().mockResolvedValue('[0]');
      
      await engine.ask('What did Alice learn first?');
      expect(mockLLM.complete).toHaveBeenCalled();
    });

    it('should handle filter errors gracefully', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' }
      ]);
      
      mockLLM.parseQuestion = vi.fn().mockResolvedValue({
        queryType: 'what',
        subject: 'Alice',
        predicate: 'learned'
      });
      
      mockLLM.complete = vi.fn().mockResolvedValue('invalid json');
      
      const answer = await engine.ask('What did Alice learn?');
      expect(answer).toBe('Alice learned Python');
    });

    it('should use debug mode', async () => {
      const debugEngine = new UnifiedSchemalessEngine(mockEngine, mockLLM, { debug: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await debugEngine.ask('What did Alice learn?');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Query execution', () => {
    it('should execute WHAT queries', async () => {
      await engine['executeQuery']({
        queryType: 'what',
        subject: 'Alice',
        predicate: 'learned'
      });
      
      expect(mockEngine.query).toHaveBeenCalledWith('event("Alice", "learned", Object)');
    });

    it('should execute WHEN queries', async () => {
      await engine['executeQuery']({
        queryType: 'when',
        subject: 'Alice',
        predicate: 'became',
        object: 'CEO'
      });
      
      expect(mockEngine.query).toHaveBeenCalledWith('event_at(event("Alice", "became", "CEO"), Time)');
    });

    it('should execute WHO queries', async () => {
      await engine['executeQuery']({
        queryType: 'who',
        predicate: 'learned',
        object: 'Python'
      });
      
      expect(mockEngine.query).toHaveBeenCalledWith('event(Subject, "learned", "Python")');
    });

    it('should execute IS queries', async () => {
      await engine['executeQuery']({
        queryType: 'is',
        subject: 'Alice'
      }, '2023-06-15');
      
      expect(mockEngine.query).toHaveBeenCalled();
    });

    it('should fallback to internal query when engine lacks query method', async () => {
      const basicEngine: WhenMEngine = {
        remember: vi.fn(),
        getEvents: vi.fn().mockResolvedValue([
          { event: { subject: 'Alice', verb: 'learned', object: 'Python' }, timestamp: 1000, date: '2023-01-10' }
        ]),
        reset: vi.fn()
      };
      
      const simpleEngine = new UnifiedSchemalessEngine(basicEngine, mockLLM);
      // Need to populate eventLog for internal query to work
      await simpleEngine.remember('Alice learned Python', '2023-01-10');
      
      const results = await simpleEngine['executeQuery']({
        queryType: 'what',
        subject: 'Alice'
      });
      
      expect(results).toHaveLength(1);
    });

    it('should filter internal query results', async () => {
      const results = await engine['internalQuery']({
        queryType: 'what',
        subject: 'Alice',
        predicate: 'learned',
        object: 'Python'
      });
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Helper methods', () => {
    it('should get underlying engine', () => {
      const innerEngine = engine.getEngine();
      expect(innerEngine).toBe(mockEngine);
    });

    it('should get LLM provider', () => {
      const llm = engine.getLLM();
      expect(llm).toBe(mockLLM);
    });

    it('should get rule learner', () => {
      const learner = engine.getLearner();
      expect(learner).toBeDefined();
    });

    it('should support nl method', async () => {
      const result = await engine.nl('What did Alice learn?');
      expect(result).toBe('Alice learned Python');
    });

    it('should get all events', async () => {
      await engine.remember('Alice learned Python', '2023-01-10');
      const events = await engine.getEvents();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should reset engine', async () => {
      await engine.remember('Alice learned Python', '2023-01-10');
      await engine.reset();
      
      expect(mockEngine.reset).toHaveBeenCalled();
      const events = await engine.getEvents();
      expect(events).toHaveLength(0);
    });

    it('should show deprecation warning for entity method', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = engine.entity('Alice');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('entity() method is deprecated. Use natural language queries instead.');
      consoleSpy.mockRestore();
    });
  });

  describe('Date handling', () => {
    it('should convert various date formats', async () => {
      // Test private methods through remember
      const timestamps: number[] = [];
      
      mockEngine.assertEvent = vi.fn().mockImplementation((event, date) => {
        // Extract timestamp from event string
        const match = event.match(/(\d+)\).$/);
        if (match) timestamps.push(parseInt(match[1]));
      });
      
      await engine.remember('Event 1', '2023-01-10');
      await engine.remember('Event 2', new Date('2023-01-10'));
      await engine.remember('Event 3', undefined);
      
      // Should have processed 3 events
      expect(mockEngine.assertEvent).toHaveBeenCalledTimes(3);
    });
  });
});