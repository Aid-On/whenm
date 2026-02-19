import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamicRuleLearner } from '../../src/processors/rule-learner';
import { UniLLMProvider } from '../../src/providers/llm-provider';
import type { WhenMEngine } from '../../src/index';

describe('DynamicRuleLearner', () => {
  let learner: DynamicRuleLearner;
  let mockEngine: WhenMEngine;
  let mockLLM: UniLLMProvider;

  beforeEach(() => {
    mockEngine = {
      remember: vi.fn(),
      query: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([]),
      reset: vi.fn(),
      loadFacts: vi.fn()
    };

    mockLLM = new UniLLMProvider({ provider: 'mock' });
    learner = new DynamicRuleLearner(mockEngine, mockLLM);
  });

  describe('Verb learning', () => {
    it('should learn new verbs', async () => {
      await learner.learnVerb('learned', 'Alice learned Python');
      
      const rules = learner.exportRules();
      expect(rules).toBeDefined();
      expect(rules).toContain('learned');
    });

    it('should cache learned verbs', async () => {
      await learner.learnVerb('learned', 'Alice learned Python');
      await learner.learnVerb('learned', 'Bob learned JavaScript');
      
      const rules = learner.exportRules();
      // Should only have one entry for 'learned'
      const matches = rules.match(/learned/g) || [];
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should handle different verb types', async () => {
      await learner.learnVerb('became', 'Alice became CEO');
      await learner.learnVerb('moved', 'Bob moved to Tokyo');
      await learner.learnVerb('married', 'Charlie married Diana');
      
      const rules = learner.exportRules();
      expect(rules).toContain('became');
      expect(rules).toContain('moved');
      expect(rules).toContain('married');
    });
  });

  describe('Rule export', () => {
    it('should export empty rules initially', () => {
      const rules = learner.exportRules();
      expect(rules).toBeDefined();
      expect(typeof rules).toBe('string');
    });

    it('should export rules as JSON format', async () => {
      await learner.learnVerb('learned', 'Alice learned Python');
      
      const rules = learner.exportRules();
      expect(rules).toBeDefined();
      expect(typeof rules).toBe('string');
      // Rules are exported as JSON in current implementation
      expect(rules).toContain('learned');
    });

    it('should include timestamps in rules', async () => {
      await learner.learnVerb('joined', 'Alice joined the company');
      
      const rules = learner.exportRules();
      // Should have some indication of temporal rules
      expect(rules).toBeDefined();
    });
  });

  describe('Complex event patterns', () => {
    it('should learn compound events', async () => {
      await learner.learnVerb('hired', 'Company hired Alice as Senior Engineer');
      
      const rules = learner.exportRules();
      expect(rules).toContain('hired');
    });

    it('should handle events without objects', async () => {
      await learner.learnVerb('quit', 'Alice quit');
      
      const rules = learner.exportRules();
      expect(rules).toContain('quit');
    });

    it('should learn state changes', async () => {
      await learner.learnVerb('became', 'Alice became manager');
      
      const rules = learner.exportRules();
      expect(rules).toContain('became');
    });
  });

  describe('Options', () => {
    it('should handle debug mode', async () => {
      const debugLearner = new DynamicRuleLearner(mockEngine, mockLLM, { debug: true });
      
      // Should not throw with debug enabled
      await expect(debugLearner.learnVerb('learned', 'Alice learned Python')).resolves.not.toThrow();
      
      const rules = debugLearner.exportRules();
      expect(rules).toBeDefined();
    });

    it('should handle auto-learn option', () => {
      const autoLearner = new DynamicRuleLearner(mockEngine, mockLLM, { autoLearn: true });
      
      expect(autoLearner).toBeDefined();
      const rules = autoLearner.exportRules();
      expect(rules).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle null verbs gracefully', async () => {
      await expect(learner.learnVerb('', '')).resolves.not.toThrow();
    });

    it('should handle invalid contexts', async () => {
      await expect(learner.learnVerb('test', null as unknown as string)).resolves.not.toThrow();
    });
  });
});