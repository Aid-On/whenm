import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedSchemalessEngine } from '../src/core/unified-engine';
import type { WhenMEngine } from '../src/index';
import { UniLLMProvider } from '../src/providers/llm-provider';

describe('UnifiedSchemalessEngine', () => {
  let mockEngine: WhenMEngine;
  let mockLLM: UniLLMProvider;

  beforeEach(() => {
    // Create a real mock LLM provider
    mockLLM = new UniLLMProvider({ provider: 'mock' });
    
    // Mock the underlying Prolog engine
    mockEngine = {
      remember: vi.fn(),
      query: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([]),
      reset: vi.fn(),
      loadFacts: vi.fn(),
      assertEvent: vi.fn()
    };
  });

  describe('Basic functionality', () => {
    it('should create engine instance', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      expect(engine).toBeDefined();
      expect(engine.remember).toBeDefined();
      expect(engine.ask).toBeDefined();
    });

    it('should remember events', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      await engine.remember('Alice learned Python', '2024-01-01');
      
      // Check that the engine stored the event
      expect(mockEngine.assertEvent).toHaveBeenCalled();
    });

    it('should handle events without date', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      await engine.remember('Bob became CTO');
      
      expect(mockEngine.assertEvent).toHaveBeenCalled();
    });

    it('should ask questions', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const answer = await engine.ask('What did Alice learn?');
      
      expect(answer).toBeDefined();
      expect(typeof answer).toBe('string');
    });

    it('should ask questions with date context', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const answer = await engine.ask('What was Alice doing?', '2024-01-01');
      
      expect(answer).toBeDefined();
      expect(typeof answer).toBe('string');
    });
  });

  describe('Engine methods', () => {
    it('should get underlying engine', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const underlying = engine.getEngine();
      expect(underlying).toBe(mockEngine);
    });

    it('should get LLM provider', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const llm = engine.getLLM();
      expect(llm).toBe(mockLLM);
    });

    it('should get learner', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const learner = engine.getLearner();
      expect(learner).toBeDefined();
      expect(learner.exportRules).toBeDefined();
    });

    it('should export event log', () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      // Access public event log
      expect(engine._eventLog).toBeDefined();
      expect(Array.isArray(engine._eventLog)).toBe(true);
    });
  });

  describe('Options', () => {
    it('should handle debug mode without errors', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM, { debug: true });
      await engine.remember('Alice learned Python');

      // Debug mode should not throw
      expect(mockEngine.assertEvent).toHaveBeenCalled();
    });

    it('should handle autoLearn option', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM, { autoLearn: true });
      
      await engine.remember('Alice learned Python');
      
      // Should not throw with autoLearn enabled
      expect(mockEngine.assertEvent).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      mockEngine.loadFacts = vi.fn().mockRejectedValue(new Error('Prolog error'));
      
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      // Should not throw
      await expect(engine.initialize()).resolves.not.toThrow();
    });

    it('should handle empty queries', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      const answer = await engine.ask('');
      
      expect(answer).toBeDefined();
      expect(typeof answer).toBe('string');
    });

    it('should handle null events', async () => {
      const engine = new UnifiedSchemalessEngine(mockEngine, mockLLM);
      
      // Should handle gracefully
      await expect(engine.remember('')).resolves.not.toThrow();
    });
  });
});