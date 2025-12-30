import { describe, it, expect, vi } from 'vitest';
import { DynamicRuleLearner } from '../src/rule-learner';
import type { WhenMEngine } from '../src/index';
import type { UnifiedLLMProvider } from '../src/llm-provider';

describe('DynamicRuleLearner', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockResolvedValue([]),
    reset: vi.fn(),
    loadFacts: vi.fn()
  };

  const mockLLM: UnifiedLLMProvider = {
    parseEvent: vi.fn(),
    generateRules: vi.fn().mockResolvedValue({
      type: 'state_change',
      initiates: [{ fluent: 'knows' }]
    }),
    parseQuestion: vi.fn(),
    formatResponse: vi.fn(),
    complete: vi.fn()
  };

  describe('Rule learning', () => {
    it('should create learner', () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      expect(learner).toBeDefined();
      expect(learner.learnVerb).toBeDefined();
      expect(learner.getLearnedRules).toBeDefined();
    });

    it('should learn new verb', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      
      await learner.learnVerb('learned', 'Alice learned Python');
      
      expect(mockLLM.generateRules).toHaveBeenCalledWith('learned', 'Alice learned Python');
      expect(mockEngine.loadFacts).toHaveBeenCalled();
    });

    it('should cache learned rules', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      
      await learner.learnVerb('learned', 'Alice learned Python');
      const rules = learner.getLearnedRules();
      
      expect(rules.has('learned')).toBe(true);
      expect(rules.get('learned')).toHaveProperty('type', 'state_change');
    });

    it('should not re-learn cached verbs', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      mockLLM.generateRules = vi.fn().mockResolvedValue({
        type: 'state_change',
        initiates: [{ fluent: 'knows' }]
      });
      
      await learner.learnVerb('learned', 'Alice learned Python');
      await learner.learnVerb('learned', 'Bob learned JavaScript');
      
      // Should only be called once
      expect(mockLLM.generateRules).toHaveBeenCalledTimes(1);
    });

    it('should get rule for specific verb', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      
      await learner.learnVerb('learned', 'Alice learned Python');
      const rule = learner.getRuleForVerb('learned');
      
      expect(rule).toBeDefined();
      expect(rule.type).toBe('state_change');
    });

    it('should return undefined for unknown verb', () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      
      const rule = learner.getRuleForVerb('unknown');
      expect(rule).toBeUndefined();
    });
  });

  describe('Rule export/import', () => {
    it('should export rules as JSON', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      
      await learner.learnVerb('learned', 'Alice learned Python');
      const exported = learner.exportRules();
      
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0][0]).toBe('learned');
    });

    it('should import rules from JSON', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      
      const rulesJson = JSON.stringify([
        ['learned', { type: 'state_change', initiates: [{ fluent: 'knows' }] }],
        ['became', { type: 'state_change', initiates: [{ fluent: 'role' }] }]
      ]);
      
      await learner.importRules(rulesJson);
      
      const rules = learner.getLearnedRules();
      expect(rules.size).toBe(2);
      expect(rules.has('learned')).toBe(true);
      expect(rules.has('became')).toBe(true);
    });

    it('should handle invalid JSON gracefully', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await learner.importRules('invalid json');
      
      expect(consoleSpy).toHaveBeenCalled();
      const rules = learner.getLearnedRules();
      expect(rules.size).toBe(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Prolog rule generation', () => {
    it('should generate initiates rules', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      mockLLM.generateRules = vi.fn().mockResolvedValue({
        type: 'state_change',
        initiates: [
          { fluent: 'knows', pattern: 'knows(Subject, Object)' }
        ]
      });
      
      await learner.learnVerb('learned', 'Alice learned Python');
      
      const prologRule = learner.getCachedPrologRule('learned');
      expect(prologRule).toBeDefined();
      expect(prologRule).toContain('initiates(event(Subject, "learned", Object)');
      expect(prologRule).toContain('knows(Subject, Object)');
    });

    it('should generate terminates rules', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      mockLLM.generateRules = vi.fn().mockResolvedValue({
        type: 'state_change',
        terminates: [
          { fluent: 'previous_role' }
        ]
      });
      
      await learner.learnVerb('became', 'Alice became CEO');
      
      const prologRule = learner.getCachedPrologRule('became');
      expect(prologRule).toBeDefined();
      expect(prologRule).toContain('terminates(event(Subject, "became", Object)');
    });

    it('should handle instantaneous actions', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      mockLLM.generateRules = vi.fn().mockResolvedValue({
        type: 'instantaneous'
      });
      
      await learner.learnVerb('greeted', 'Alice greeted Bob');
      
      const prologRule = learner.getCachedPrologRule('greeted');
      expect(prologRule).toBeDefined();
      expect(prologRule).toContain('instantaneous("greeted")');
    });
  });

  describe('Clear operations', () => {
    it('should clear all rules', async () => {
      const learner = new DynamicRuleLearner(mockEngine, mockLLM);
      
      await learner.learnVerb('learned', 'Alice learned Python');
      await learner.learnVerb('became', 'Alice became CEO');
      
      expect(learner.getLearnedRules().size).toBe(2);
      
      learner.clearRules();
      
      expect(learner.getLearnedRules().size).toBe(0);
      expect(learner.getCachedPrologRule('learned')).toBeUndefined();
    });
  });
});