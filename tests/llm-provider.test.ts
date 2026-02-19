import { describe, it, expect } from 'vitest';
import { UniLLMProvider, type UniLLMConfig } from '../src/providers/llm-provider';

describe('UniLLMProvider', () => {
  describe('Mock provider', () => {
    it('should create mock provider', () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      expect(provider).toBeDefined();
      expect(provider.parseEvent).toBeDefined();
      expect(provider.generateRules).toBeDefined();
      expect(provider.parseQuestion).toBeDefined();
      expect(provider.formatResponse).toBeDefined();
      expect(provider.complete).toBeDefined();
    });

    it('should parse simple events', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const event = await provider.parseEvent('Alice learned Python');
      
      expect(event).toEqual({
        subject: 'Alice',
        verb: 'learned',
        object: 'Python'
      });
    });

    it('should handle single-word events', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const event = await provider.parseEvent('Alice');
      
      expect(event).toEqual({
        subject: 'Alice',
        verb: 'did',
        object: undefined
      });
    });

    it('should handle empty events', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });

      const event = await provider.parseEvent('');

      expect(event).toEqual({
        subject: 'unknown',
        verb: 'unknown',
        object: undefined
      });
    });

    it('should generate rules', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const rules = await provider.generateRules('learned', 'Alice learned Python');
      
      expect(rules).toBeDefined();
      expect(rules.type).toBe('instantaneous');
      expect(rules.initiates).toBeDefined();
      expect(Array.isArray(rules.initiates)).toBe(true);
    });

    it('should parse questions', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const parsed = await provider.parseQuestion('What did Alice learn?');
      
      expect(parsed).toBeDefined();
      expect(parsed.queryType).toBe('what');
      expect(parsed.subject).toBe('alice');
    });

    it('should handle empty questions', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });

      const parsed = await provider.parseQuestion('');

      expect(parsed).toBeDefined();
      expect(parsed.queryType).toBe('what');
      expect(parsed.subject).toBeUndefined();
    });

    it('should format responses', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const response = await provider.formatResponse(
        [{ subject: 'Alice', value: 'CEO' }],
        'What is Alice?'
      );
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should handle complete method', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const response = await provider.complete('Test prompt');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('Provider detection', () => {
    it('should handle different provider configs', () => {
      const providers = [
        { provider: 'mock' },
        { provider: 'groq', apiKey: 'test' },
        { provider: 'gemini', apiKey: 'test' },
        { provider: 'cloudflare', cloudflareAccountId: 'test', cloudflareApiKey: 'test' }
      ];
      
      providers.forEach(config => {
        const provider = new UniLLMProvider(config as UniLLMConfig);
        expect(provider).toBeDefined();
      });
    });

    it('should get default model for providers', () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      // Should have internal method to get model
      expect(provider).toBeDefined();
    });
  });

  describe('Complex parsing scenarios', () => {
    it('should parse Japanese text', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const event = await provider.parseEvent('太郎が花子と結婚した');
      
      expect(event).toBeDefined();
      expect(event.subject).toBe('太郎が花子と結婚した');
      expect(event.verb).toBe('did');
    });

    it('should handle multi-word objects', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const event = await provider.parseEvent('Alice became Senior Software Engineer');
      
      expect(event).toEqual({
        subject: 'Alice',
        verb: 'became',
        object: 'Senior Software Engineer'
      });
    });

    it('should handle when questions', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const parsed = await provider.parseQuestion('When did Alice learn Python?');
      
      expect(parsed).toBeDefined();
      expect(parsed.queryType).toBe('when');
    });

    it('should handle who questions', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const parsed = await provider.parseQuestion('Who is the CEO?');
      
      expect(parsed).toBeDefined();
      expect(parsed.queryType).toBe('who');
    });
  });
});