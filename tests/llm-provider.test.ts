import { describe, it, expect, vi } from 'vitest';
import { UniLLMProvider } from '../src/llm-provider';

describe('UniLLMProvider', () => {
  describe('Mock provider', () => {
    it('should create mock provider', () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      expect(provider).toBeDefined();
      expect(provider.parseEvent).toBeDefined();
      expect(provider.generateRules).toBeDefined();
      expect(provider.parseQuestion).toBeDefined();
      expect(provider.formatResponse).toBeDefined();
      expect(provider.complete).toBeDefined();
    });

    it('should parse simple events in mock mode', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.parseEvent('Alice learned Python');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('subject', 'Alice');
      expect(result).toHaveProperty('verb', 'learned');
      expect(result).toHaveProperty('object', 'Python');
    });

    it('should parse compound events in mock mode', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.parseEvent('Nancy joined as Data Scientist');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('verb', 'joined');
      expect(result[1]).toHaveProperty('verb', 'became');
    });

    it('should generate rules in mock mode', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const rules = await provider.generateRules('learned', 'Alice learned Python');
      expect(rules).toBeDefined();
      expect(rules).toHaveProperty('type');
      expect(rules.type).toBe('state_change');
      expect(rules.initiates).toBeDefined();
    });

    it('should parse questions in mock mode', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const parsed = await provider.parseQuestion('What did Alice learn?');
      expect(parsed).toBeDefined();
      expect(parsed).toHaveProperty('queryType');
      expect(parsed.queryType).toBe('what');
    });

    it('should format response in mock mode', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const response = await provider.formatResponse(
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        'What did Alice learn?'
      );
      expect(response).toBe('Alice learned Python');
    });

    it('should complete prompts in mock mode', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.complete('Test prompt');
      expect(result).toBe('{"result":"mock"}');
    });
  });

  describe('Provider configuration', () => {
    it('should handle Groq provider', () => {
      const provider = new UniLLMProvider({
        provider: 'groq',
        apiKey: 'test-key',
        model: 'mixtral-8x7b-32768'
      });
      
      expect(provider).toBeDefined();
    });

    it('should handle Gemini provider', () => {
      const provider = new UniLLMProvider({
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-pro'
      });
      
      expect(provider).toBeDefined();
    });

    it('should handle Cloudflare provider', () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test-account',
        apiToken: 'test-token',
        email: 'test@example.com',
        model: '@cf/openai/gpt-oss-120b'
      });
      
      expect(provider).toBeDefined();
    });
  });
});