import { describe, it, expect, vi } from 'vitest';
import { QueryIntentParser } from '../src/query-intent-parser';
import type { UnifiedLLMProvider } from '../src/llm-provider';

describe('QueryIntentParser', () => {
  const mockLLM: UnifiedLLMProvider = {
    parseEvent: vi.fn(),
    generateRules: vi.fn(),
    parseQuestion: vi.fn(),
    formatResponse: vi.fn(),
    complete: vi.fn().mockResolvedValue('{"action":"query","entities":["Alice"]}')
  };

  describe('Intent parsing', () => {
    it('should create parser', () => {
      const parser = new QueryIntentParser(mockLLM);
      expect(parser).toBeDefined();
      expect(parser.parseIntent).toBeDefined();
    });

    it('should parse query intent with LLM', async () => {
      const parser = new QueryIntentParser(mockLLM);
      
      const intent = await parser.parseIntent('What did Alice learn?');
      expect(mockLLM.complete).toHaveBeenCalled();
    });

    it('should fallback to rules when LLM fails', async () => {
      const failingLLM: UnifiedLLMProvider = {
        ...mockLLM,
        complete: vi.fn().mockResolvedValue('invalid json')
      };
      
      const parser = new QueryIntentParser(failingLLM);
      const intent = await parser.parseIntent('What did Alice learn?');
      
      expect(intent).toBeDefined();
      expect(intent.action).toBe('query');
    });

    it('should detect when question', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('When did Alice become CEO?');
      expect(intent.action).toBe('when');
    });

    it('should detect aggregate question', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('How many people learned Python?');
      expect(intent.action).toBe('aggregate');
    });

    it('should detect timeline query', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']("Show Alice's timeline");
      expect(intent.action).toBe('timeline');
    });

    it('should detect search query', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('Search for Python events');
      expect(intent.action).toBe('search');
    });
  });

  describe('Entity extraction', () => {
    it('should extract entity names', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('What did Alice and Bob do?');
      expect(intent.entities).toContain('Alice');
      expect(intent.entities).toContain('Bob');
    });

    it('should ignore question words', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('What When Where Alice learned?');
      expect(intent.entities).toContain('Alice');
      expect(intent.entities).not.toContain('What');
      expect(intent.entities).not.toContain('When');
      expect(intent.entities).not.toContain('Where');
    });
  });

  describe('Timeframe extraction', () => {
    it('should extract relative timeframe', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('Show events from last 7 days');
      expect(intent.timeframe).toBeDefined();
      expect(intent.timeframe?.type).toBe('relative');
      expect(intent.timeframe?.duration?.amount).toBe(7);
      expect(intent.timeframe?.duration?.unit).toBe('days');
    });

    it('should extract date range', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('Events between 2023-01-01 and 2023-12-31');
      expect(intent.timeframe).toBeDefined();
      expect(intent.timeframe?.type).toBe('range');
      expect(intent.timeframe?.from).toBe('2023-01-01');
      expect(intent.timeframe?.to).toBe('2023-12-31');
    });

    it('should extract specific date', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('What happened on 2023-06-15?');
      expect(intent.timeframe).toBeDefined();
      expect(intent.timeframe?.type).toBe('specific');
      expect(intent.timeframe?.point).toBe('2023-06-15');
    });
  });

  describe('Keyword extraction', () => {
    it('should extract keywords', () => {
      const parser = new QueryIntentParser(mockLLM);
      
      const keywords = parser.extractKeywords('Alice learned Python programming language');
      expect(keywords).toContain('alice');
      expect(keywords).toContain('learned');
      expect(keywords).toContain('python');
      expect(keywords).toContain('programming');
      expect(keywords).toContain('language');
    });

    it('should filter out stopwords', () => {
      const parser = new QueryIntentParser(mockLLM);
      
      const keywords = parser.extractKeywords('The quick brown fox jumps over the lazy dog');
      expect(keywords).not.toContain('the');
      // 'over' is actually 4 characters, so it's included
      expect(keywords).toContain('over');
      expect(keywords).toContain('quick');
      expect(keywords).toContain('brown');
      expect(keywords).toContain('fox');
    });

    it('should handle punctuation', () => {
      const parser = new QueryIntentParser(mockLLM);
      
      const keywords = parser.extractKeywords('Hello, world! How are you?');
      expect(keywords).toContain('hello');
      expect(keywords).toContain('world');
      expect(keywords).not.toContain('hello,');
      expect(keywords).not.toContain('world!');
    });
  });

  describe('Verb extraction', () => {
    it('should extract common verbs', () => {
      const parser = new QueryIntentParser(null as any);
      
      const intent = parser['parseWithRules']('Who learned and became senior?');
      expect(intent.filters?.verbs).toContain('learned');
      expect(intent.filters?.verbs).toContain('became');
    });
  });
});