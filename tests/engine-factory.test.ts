import { describe, it, expect } from 'vitest';
import { 
  createUnifiedEngine,
  createGroqEngine,
  createGeminiEngine,
  createCloudflareEngine,
  createMockEngine,
  UniLLMProvider
} from '../src/core/engine-factory';

describe('Engine Factory', () => {
  describe('createMockEngine', () => {
    it('should create mock engine', async () => {
      const engine = await createMockEngine();
      expect(engine).toBeDefined();
      expect(engine.remember).toBeDefined();
      expect(engine.ask).toBeDefined();
    });
  });

  describe('createUnifiedEngine', () => {
    it('should create engine with mock provider', async () => {
      const engine = await createUnifiedEngine({ llm: 'mock' });
      expect(engine).toBeDefined();
      expect(engine.remember).toBeDefined();
      expect(engine.ask).toBeDefined();
    });

    it('should create engine with string config', async () => {
      const engine = await createUnifiedEngine({ llm: 'mock' });
      expect(engine).toBeDefined();
    });

    it('should handle options', async () => {
      const engine = await createUnifiedEngine({
        llm: 'mock',
        debug: true,
        autoLearn: true
      });
      expect(engine).toBeDefined();
    });
  });

  describe('UniLLMProvider', () => {
    it('should create mock provider', () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      expect(provider).toBeDefined();
      expect(provider.parseEvent).toBeDefined();
      expect(provider.generateRules).toBeDefined();
      expect(provider.parseQuestion).toBeDefined();
      expect(provider.formatResponse).toBeDefined();
    });

    it('should parse events in mock mode', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const result = await provider.parseEvent('Alice learned Python');
      expect(result).toBeDefined();
      expect(result.subject).toBe('Alice');
      expect(result.verb).toBe('learned');
      expect(result.object).toBe('Python');
    });

    it('should generate rules in mock mode', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const rules = await provider.generateRules('learned', 'context');
      expect(rules).toBeDefined();
      expect(rules.type).toBeDefined();
      expect(rules.initiates).toBeDefined();
    });

    it('should parse questions in mock mode', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const parsed = await provider.parseQuestion('What did Alice learn?');
      expect(parsed).toBeDefined();
      expect(parsed.queryType).toBeDefined();
    });

    it('should format responses in mock mode', async () => {
      const provider = new UniLLMProvider({ provider: 'mock' });
      
      const response = await provider.formatResponse(
        [{ subject: 'Alice', value: 'CEO' }],
        'What is Alice?'
      );
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('Provider-specific factories', () => {
    it('should create Groq engine with mock', async () => {
      const engine = await createGroqEngine('mock-key');
      expect(engine).toBeDefined();
    });

    it('should create Gemini engine with mock', async () => {
      const engine = await createGeminiEngine('mock-key');
      expect(engine).toBeDefined();
    });

    it('should create Cloudflare engine with mock', async () => {
      const engine = await createCloudflareEngine('mock', 'mock', 'mock');
      expect(engine).toBeDefined();
    });
  });
});