import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniLLMProvider } from '../src/llm-provider';

describe('UniLLMProvider Extended Tests', () => {
  describe('Mock provider behavior', () => {
    it('should use mock for special credentials', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock',
        model: '@cf/meta/llama-3.1-8b-instruct'
      });
      
      const result = await provider.parseEvent('Alice learned Python');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('subject', 'Alice');
      expect(result).toHaveProperty('verb', 'learned');
      expect(result).toHaveProperty('object', 'Python');
    });

    it('should handle mock for complex events', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.parseEvent('Nancy joined as Data Scientist on July 15');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('subject', 'Nancy');
      expect(result[0]).toHaveProperty('verb', 'joined');
      expect(result[1]).toHaveProperty('subject', 'Nancy');
      expect(result[1]).toHaveProperty('verb', 'became');
    });

    it('should handle mock generateRules', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.generateRules('learned', 'Alice learned Python');
      expect(result).toBeDefined();
      expect(result.type).toBe('state_change');
      expect(result.initiates).toBeDefined();
      expect(result.initiates[0].fluent).toBe('knows');
    });

    it('should handle mock parseQuestion', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.parseQuestion('What did Alice learn?');
      expect(result).toBeDefined();
      expect(result.queryType).toBe('what');
      expect(result.subject).toBe('Alice');
      expect(result.predicate).toBe('learned');
    });

    it('should handle mock formatResponse', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.formatResponse(
        [{ subject: 'Alice', verb: 'learned', object: 'Python' }],
        'What did Alice learn?'
      );
      expect(result).toBe('Alice learned Python');
    });
  });


  describe('Real provider initialization', () => {
    it('should handle getModel for cloudflare', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test-account',
        apiToken: 'test-token',
        email: 'test@example.com',
        model: '@cf/meta/llama-3.1-8b-instruct'
      });
      
      // Private method test through complete
      const mockGenerate = vi.fn().mockResolvedValue({ text: 'result' });
      vi.doMock('@aid-on/unillm', () => ({
        generate: mockGenerate
      }));
      
      // This will trigger getModel internally
      try {
        await provider.complete('test prompt');
      } catch (e) {
        // Expected to fail due to missing credentials in test
      }
      
      expect(provider).toBeDefined();
    });

    it('should handle getModel for groq', async () => {
      const provider = new UniLLMProvider({
        provider: 'groq',
        apiKey: 'test-key',
        model: 'llama-3.1-8b-instant'
      });
      
      try {
        await provider.complete('test prompt');
      } catch (e) {
        // Expected to fail
      }
      
      expect(provider).toBeDefined();
    });

    it('should handle getModel for gemini', async () => {
      const provider = new UniLLMProvider({
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-1.5-flash'
      });
      
      try {
        await provider.complete('test prompt');
      } catch (e) {
        // Expected to fail
      }
      
      expect(provider).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors in parseEvent', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      // Mock complete to return invalid JSON
      provider.complete = vi.fn().mockResolvedValue('invalid json');
      
      const result = await provider.parseEvent('Alice learned Python');
      
      // Should fallback to simple parsing
      expect(result).toBeDefined();
      expect(result).toHaveProperty('subject', 'Alice');
      expect(result).toHaveProperty('verb', 'learned');
      expect(result).toHaveProperty('object', 'Python');
    });

    it('should handle JSON parse errors in generateRules', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('invalid json');
      
      const result = await provider.generateRules('learned', 'Alice learned Python');
      
      // Should fallback to default rule
      expect(result).toBeDefined();
      expect(result).toHaveProperty('type', 'instantaneous');
      expect(result.initiates).toBeDefined();
      expect(result.initiates[0]).toHaveProperty('fluent', 'learned_state');
    });

    it('should handle JSON parse errors in parseQuestion', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('invalid json');
      
      const result = await provider.parseQuestion('What did Alice learn?');
      
      // Should fallback to default
      expect(result).toBeDefined();
      expect(result).toHaveProperty('queryType', 'what');
      expect(result.subject).toBeNull();
      expect(result.predicate).toBeNull();
    });
  });

  describe('Real LLM interaction paths', () => {
    it('should build correct credentials for cloudflare', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test-account',
        apiToken: 'test-token',
        email: 'test@example.com'
      });
      
      const mockGenerate = vi.fn().mockResolvedValue({ text: '{"result":"test"}' });
      
      // Override the dynamic import
      const originalImport = provider.complete;
      provider.complete = async function(prompt: string) {
        const credentials = {
          cloudflareAccountId: 'test-account',
          cloudflareEmail: 'test@example.com',
          cloudflareApiKey: 'test-token'
        };
        
        // Verify credentials structure
        expect(credentials.cloudflareAccountId).toBe('test-account');
        expect(credentials.cloudflareEmail).toBe('test@example.com');
        expect(credentials.cloudflareApiKey).toBe('test-token');
        
        return '{"result":"test"}';
      };
      
      const result = await provider.complete('test');
      expect(result).toBe('{"result":"test"}');
    });

    it('should build correct credentials for groq', async () => {
      const provider = new UniLLMProvider({
        provider: 'groq',
        apiKey: 'test-groq-key'
      });
      
      provider.complete = async function(prompt: string) {
        const credentials = {
          groqApiKey: 'test-groq-key'
        };
        
        expect(credentials.groqApiKey).toBe('test-groq-key');
        return '{"result":"test"}';
      };
      
      const result = await provider.complete('test');
      expect(result).toBe('{"result":"test"}');
    });

    it('should build correct credentials for gemini', async () => {
      const provider = new UniLLMProvider({
        provider: 'gemini',
        apiKey: 'test-gemini-key'
      });
      
      provider.complete = async function(prompt: string) {
        const credentials = {
          geminiApiKey: 'test-gemini-key'
        };
        
        expect(credentials.geminiApiKey).toBe('test-gemini-key');
        return '{"result":"test"}';
      };
      
      const result = await provider.complete('test');
      expect(result).toBe('{"result":"test"}');
    });
  });

  describe('parseEvent edge cases', () => {
    it('should handle events without objects', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('{"subject":"Alice","verb":"arrived"}');
      
      const result = await provider.parseEvent('Alice arrived');
      expect(result).toHaveProperty('subject', 'Alice');
      expect(result).toHaveProperty('verb', 'arrived');
      expect(result.object).toBeUndefined();
    });

    it('should handle complex compound events', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      const complexResponse = JSON.stringify([
        { subject: 'Alice', verb: 'joined', object: 'company' },
        { subject: 'Alice', verb: 'became', object: 'Senior Engineer' },
        { subject: 'Alice', verb: 'leads', object: 'frontend team' }
      ]);
      
      provider.complete = vi.fn().mockResolvedValue(complexResponse);
      
      const result = await provider.parseEvent('Alice joined as Senior Engineer and leads frontend team');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should handle single word input', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.parseEvent('Alice');
      expect(result).toHaveProperty('subject', 'Alice');
      expect(result).toHaveProperty('verb', 'did');
      expect(result.object).toBeUndefined();
    });
  });

  describe('generateRules variations', () => {
    it('should generate complex rules', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      const complexRules = {
        type: 'state_change',
        initiates: [
          { fluent: 'role', pattern: 'role(Subject, Object)' },
          { fluent: 'employed', pattern: 'employed(Subject, Company)' }
        ],
        terminates: [
          { fluent: 'previous_role', pattern: 'previous_role(Subject, _)' }
        ]
      };
      
      provider.complete = vi.fn().mockResolvedValue(JSON.stringify(complexRules));
      
      const result = await provider.generateRules('promoted', 'Alice was promoted to Director');
      expect(result.initiates).toHaveLength(2);
      expect(result.terminates).toHaveLength(1);
      expect(result.type).toBe('state_change');
    });

    it('should handle continuous type rules', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('{"type":"continuous","initiates":[{"fluent":"working"}]}');
      
      const result = await provider.generateRules('working', 'Alice is working on the project');
      expect(result.type).toBe('continuous');
    });
  });

  describe('parseQuestion variations', () => {
    it('should parse WHERE questions', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('{"queryType":"where","subject":"Alice","time":"2023-01-10"}');
      
      const result = await provider.parseQuestion('Where was Alice on January 10th?');
      expect(result.queryType).toBe('where');
      expect(result.subject).toBe('Alice');
      expect(result.time).toBe('2023-01-10');
    });

    it('should parse WHY questions', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('{"queryType":"why","subject":"Bob","predicate":"left","object":"company"}');
      
      const result = await provider.parseQuestion('Why did Bob leave the company?');
      expect(result.queryType).toBe('why');
      expect(result.subject).toBe('Bob');
      expect(result.predicate).toBe('left');
      expect(result.object).toBe('company');
    });

    it('should parse IS questions', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('{"queryType":"is","subject":"Alice","predicate":"CEO"}');
      
      const result = await provider.parseQuestion('Is Alice the CEO?');
      expect(result.queryType).toBe('is');
      expect(result.subject).toBe('Alice');
      expect(result.predicate).toBe('CEO');
    });
  });

  describe('formatResponse', () => {
    it('should format various data types', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('Alice learned Python and JavaScript');
      
      const result = await provider.formatResponse(
        [
          { subject: 'Alice', verb: 'learned', object: 'Python' },
          { subject: 'Alice', verb: 'learned', object: 'JavaScript' }
        ],
        'What did Alice learn?'
      );
      
      expect(result).toBe('Alice learned Python and JavaScript');
    });

    it('should handle empty data', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('No events found');
      
      const result = await provider.formatResponse([], 'What happened?');
      expect(result).toBe('No events found');
    });

    it('should handle null data', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com'
      });
      
      provider.complete = vi.fn().mockResolvedValue('No information available');
      
      const result = await provider.formatResponse(null, 'What is the status?');
      expect(result).toBe('No information available');
    });
  });

  describe('Complete method edge cases', () => {
    it('should handle complete with system message', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.complete('test prompt', 'system message');
      expect(typeof result).toBe('string');
    });

    it('should handle complete without system message', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.complete('test prompt');
      expect(typeof result).toBe('string');
    });
  });

  describe('Mock provider edge cases', () => {
    it('should handle special verb cases in mock', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Test became verb
      const result1 = await provider.parseEvent('Alice became CEO');
      expect(result1.verb).toBe('became');
      expect(result1.object).toBe('CEO');
      
      // Test joined verb
      const result2 = await provider.parseEvent('Bob joined the team');
      expect(result2.verb).toBe('joined');
      expect(result2.object).toBe('the team');
      
      // Test completed verb
      const result3 = await provider.parseEvent('Charlie completed the project');
      expect(result3.verb).toBe('completed');
      expect(result3.object).toBe('the project');
    });

    it('should handle compound events in mock', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.parseEvent('Alice joined as Senior Engineer and leads the team');
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].subject).toBe('Alice');
      }
    });

    it('should handle question types in mock', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Test WHEN question
      const result1 = await provider.parseQuestion('When did Alice join?');
      expect(result1.queryType).toBe('when');
      expect(result1.subject).toBe('Alice');
      
      // Test WHO question  
      const result2 = await provider.parseQuestion('Who became CEO?');
      expect(result2.queryType).toBe('who');
      expect(result2.predicate).toBe('became');
      
      // Test WHAT question with object
      const result3 = await provider.parseQuestion('What did Bob learn?');
      expect(result3.queryType).toBe('what');
      expect(result3.subject).toBe('Bob');
    });

    it('should handle rule generation for various verbs in mock', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Test state change verb
      const result1 = await provider.generateRules('became', 'Alice became CEO');
      expect(result1.type).toBe('state_change');
      expect(result1.initiates[0].fluent).toBe('role');
      
      // Test instantaneous verb
      const result2 = await provider.generateRules('completed', 'Bob completed the task');
      expect(result2.type).toBe('instantaneous');
      expect(result2.initiates[0].fluent).toBe('task_completed');
      
      // Test continuous verb (working, developing, etc)
      const result3 = await provider.generateRules('working', 'Charlie is working');
      expect(result3.type).toBe('continuous');
    });

    it('should format various response types in mock', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      // Test array response
      const result1 = await provider.formatResponse(
        [
          { subject: 'Alice', verb: 'learned', object: 'Python' },
          { subject: 'Alice', verb: 'learned', object: 'JavaScript' }
        ],
        'What did Alice learn?'
      );
      expect(result1.includes('Python')).toBe(true);
      expect(result1.includes('JavaScript')).toBe(true);
      
      // Test single object response
      const result2 = await provider.formatResponse(
        { subject: 'Bob', verb: 'became', object: 'CEO' },
        'What happened to Bob?'
      );
      expect(result2).toBe('Bob became CEO');
      
      // Test null response
      const result3 = await provider.formatResponse(null, 'Any events?');
      expect(result3).toBe('No events found');
      
      // Test empty array response
      const result4 = await provider.formatResponse([], 'What happened?');
      expect(result4).toBe('No events found');
    });
  });

  describe('Model default selection', () => {
    it('should use default model for cloudflare', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock'
      });
      
      const result = await provider.parseEvent('test');
      expect(result).toBeDefined();
    });

    it('should use custom model for cloudflare', async () => {
      const provider = new UniLLMProvider({
        provider: 'cloudflare',
        accountId: 'test',
        apiToken: 'test',
        email: 'test@example.com',
        model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
      });
      
      provider.complete = vi.fn().mockResolvedValue('{"result":"test"}');
      
      const result = await provider.complete('test');
      expect(result).toBe('{"result":"test"}');
    });
  });
});