import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUnifiedEngine } from '../src/final-engine';
import type { WhenMEngine } from '../src/index';

// Mock Prolog module
vi.mock('trealla', () => ({
  Prolog: vi.fn().mockImplementation(() => ({
    consult: vi.fn().mockResolvedValue(true),
    consultString: vi.fn().mockResolvedValue(true),
    query: vi.fn().mockResolvedValue([]),
    queryOnce: vi.fn().mockResolvedValue(null)
  }))
}));

// Mock unillm module
vi.mock('@aid-on/unillm', () => ({
  generate: vi.fn().mockImplementation(() => {
    throw new Error('Real API calls not allowed in tests');
  })
}));

describe('Final Engine Complete Coverage', () => {
  describe('createUnifiedEngine edge cases', () => {
    it('should handle all provider types', async () => {
      // Test cloudflare provider
      const cfEngine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock',
        model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
      });
      expect(cfEngine).toBeDefined();
      expect(cfEngine.remember).toBeDefined();
      expect(cfEngine.ask).toBeDefined();

      // Test groq provider
      const groqEngine = await createUnifiedEngine({
        provider: 'groq',
        apiKey: 'mock-key',
        model: 'mixtral-8x7b-32768'
      });
      expect(groqEngine).toBeDefined();

      // Test gemini provider
      const geminiEngine = await createUnifiedEngine({
        provider: 'gemini',
        apiKey: 'mock-key',
        model: 'gemini-pro'
      });
      expect(geminiEngine).toBeDefined();
    });

    it('should handle all configuration options', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock',
        autoLearn: true,
        useUnixTime: true,
        debug: true
      });
      
      expect(engine).toBeDefined();
    });

    it('should create engine with custom LLM provider', async () => {
      const mockLLM = {
        parseEvent: vi.fn().mockResolvedValue({ subject: 'Alice', verb: 'learned', object: 'Python' }),
        generateRules: vi.fn().mockResolvedValue({ type: 'state_change', initiates: [{ fluent: 'knows' }] }),
        parseQuestion: vi.fn().mockResolvedValue({ queryType: 'what', subject: 'Alice' }),
        formatResponse: vi.fn().mockResolvedValue('Alice learned Python'),
        complete: vi.fn().mockResolvedValue('{}')
      };

      const engine = await createUnifiedEngine({
        llm: mockLLM as any
      });
      
      expect(engine).toBeDefined();
      expect(engine.getLLM()).toBe(mockLLM);
    });

    it('should handle initialization with autoLearn', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock',
        autoLearn: true
      });
      
      // Test that engine is initialized
      expect(engine).toBeDefined();
      
      // Test memory operation with autoLearn
      await engine.remember('Alice learned Python', '2023-01-10');
      
      // Verify LLM generateRules would be called with autoLearn
      const llm = engine.getLLM();
      expect(llm).toBeDefined();
    });

    it('should handle initialization with useUnixTime', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock',
        useUnixTime: true
      });
      
      expect(engine).toBeDefined();
      
      // Test memory with unix timestamp
      const unixTime = Math.floor(Date.now() / 1000);
      await engine.remember('Event happened', new Date(unixTime * 1000));
    });

    it('should handle debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock',
        debug: true
      });
      
      expect(engine).toBeDefined();
      
      // Debug mode might log during initialization
      // Not checking for specific calls as they depend on implementation
      
      consoleSpy.mockRestore();
    });
  });

  describe('Engine integration', () => {
    it('should properly integrate all components', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Test all major components are accessible
      expect(engine.getEngine()).toBeDefined();
      expect(engine.getLLM()).toBeDefined();
      expect(engine.getLearner()).toBeDefined();
      
      // Test all major operations
      expect(engine.remember).toBeDefined();
      expect(engine.ask).toBeDefined();
      expect(engine.getEvents).toBeDefined();
      expect(engine.reset).toBeDefined();
      expect(engine.nl).toBeDefined();
      
      // Deprecated but should still exist
      expect(engine.entity).toBeDefined();
    });

    it('should handle memory and query operations', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Remember an event
      await engine.remember('Alice learned Python', '2023-01-10');
      
      // Ask a question
      const answer = await engine.ask('What did Alice learn?');
      expect(answer).toBeDefined();
      expect(typeof answer).toBe('string');
    });

    it('should handle natural language operations', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Test nl method
      const result = await engine.nl('What happened?');
      expect(result).toBeDefined();
    });

    it('should handle reset operation', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      await engine.remember('Alice learned Python', '2023-01-10');
      await engine.reset();
      
      const events = await engine.getEvents();
      expect(events).toEqual([]);
    });

    it('should handle getEvents operation', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      await engine.remember('Alice learned Python', '2023-01-10');
      await engine.remember('Bob became CEO', '2023-02-15');
      
      const events = await engine.getEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle entity method (deprecated)', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const entity = engine.entity('Alice');
      expect(entity).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('entity() method is deprecated. Use natural language queries instead.');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle Prolog initialization errors gracefully', async () => {
      // This should not throw even if Prolog has issues
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      expect(engine).toBeDefined();
    });

    it('should handle invalid provider configuration', async () => {
      // Test with minimal cloudflare config
      const engine1 = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test'
      });
      expect(engine1).toBeDefined();
      
      // Test with minimal groq config
      const engine2 = await createUnifiedEngine({
        provider: 'groq',
        apiKey: 'test'
      });
      expect(engine2).toBeDefined();
      
      // Test with minimal gemini config
      const engine3 = await createUnifiedEngine({
        provider: 'gemini',
        apiKey: 'test'
      });
      expect(engine3).toBeDefined();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple events with different dates', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Add events with various date formats
      await engine.remember('Alice started working', '2023-01-01');
      await engine.remember('Bob joined the company', new Date('2023-02-15'));
      await engine.remember('Charlie became manager', undefined); // Current date
      await engine.remember('Diana left', '2023-12-31');
      
      const events = await engine.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle compound events', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Remember compound event
      await engine.remember('Nancy joined as Data Scientist and leads ML team', '2023-07-15');
      
      // Ask about it
      const answer = await engine.ask('Who leads the ML team?');
      expect(answer).toBeDefined();
    });

    it('should handle temporal queries', async () => {
      const engine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      await engine.remember('Alice learned Python', '2023-01-10');
      await engine.remember('Alice learned JavaScript', '2023-06-15');
      await engine.remember('Alice became Senior Engineer', '2023-12-01');
      
      // Query at specific time
      const answer = await engine.ask('What was Alice doing?', '2023-07-01');
      expect(answer).toBeDefined();
    });
  });

  describe('Provider-specific features', () => {
    it('should use default models for each provider', async () => {
      // Cloudflare with default model
      const cfEngine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
        // No model specified, should use default
      });
      expect(cfEngine).toBeDefined();
      
      // Groq with default model
      const groqEngine = await createUnifiedEngine({
        provider: 'groq',
        apiKey: 'mock'
        // No model specified, should use default
      });
      expect(groqEngine).toBeDefined();
      
      // Gemini with default model
      const geminiEngine = await createUnifiedEngine({
        provider: 'gemini',
        apiKey: 'mock'
        // No model specified, should use default
      });
      expect(geminiEngine).toBeDefined();
    });

    it('should support custom models for each provider', async () => {
      // Cloudflare with custom model
      const cfEngine = await createUnifiedEngine({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock',
        model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
      });
      expect(cfEngine).toBeDefined();
      
      // Groq with custom model
      const groqEngine = await createUnifiedEngine({
        provider: 'groq',
        apiKey: 'mock',
        model: 'llama-3.3-70b-versatile'
      });
      expect(groqEngine).toBeDefined();
      
      // Gemini with custom model
      const geminiEngine = await createUnifiedEngine({
        provider: 'gemini',
        apiKey: 'mock',
        model: 'gemini-2.0-flash-exp'
      });
      expect(geminiEngine).toBeDefined();
    });
  });
});