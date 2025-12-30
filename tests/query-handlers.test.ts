import { describe, it, expect, vi } from 'vitest';
import { QueryHandlers } from '../src/query-handlers';
import type { WhenMEngine } from '../src/index';
import type { NaturalQueryIntent } from '../src/query-intent-parser';

describe('QueryHandlers', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockResolvedValue([
      { event: { subject: 'Alice', verb: 'learned', object: 'Python' }, date: '2023-01-10' },
      { event: { subject: 'Bob', verb: 'became', object: 'CEO' }, date: '2023-02-15' }
    ]),
    reset: vi.fn()
  };

  describe('Query intent handling', () => {
    it('should create handlers', () => {
      const handlers = new QueryHandlers(mockEngine);
      expect(handlers).toBeDefined();
      expect(handlers.handleQueryIntent).toBeDefined();
    });

    it('should handle basic query intent', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'query',
        entities: ['Alice'],
        filters: { verbs: ['learned'] }
      };
      
      const result = await handlers.handleQueryIntent(intent);
      expect(result).toBeDefined();
    });

    it('should handle query with timeframe', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'query',
        entities: ['Alice'],
        timeframe: {
          type: 'range',
          from: '2023-01-01',
          to: '2023-12-31'
        }
      };
      
      const result = await handlers.handleQueryIntent(intent);
      expect(result).toBeDefined();
    });

    it('should handle query with relative timeframe', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'query',
        timeframe: {
          type: 'relative',
          duration: { amount: 30, unit: 'days' }
        }
      };
      
      const result = await handlers.handleQueryIntent(intent);
      expect(result).toBeDefined();
    });

    it('should handle query with specific date', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'query',
        timeframe: {
          type: 'specific',
          point: '2023-06-15'
        }
      };
      
      const result = await handlers.handleQueryIntent(intent);
      expect(result).toBeDefined();
    });
  });

  describe('Aggregation handling', () => {
    it('should handle count aggregation', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'aggregate',
        aggregation: 'count'
      };
      
      const result = await handlers.handleAggregateIntent(intent);
      expect(result).toHaveProperty('count');
    });

    it('should handle distinct aggregation', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'aggregate',
        aggregation: 'distinct'
      };
      
      const result = await handlers.handleAggregateIntent(intent);
      expect(result).toHaveProperty('distinct');
    });

    it('should handle first aggregation', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'aggregate',
        aggregation: 'first'
      };
      
      const result = await handlers.handleAggregateIntent(intent);
      expect(result).toHaveProperty('first');
    });

    it('should handle exists aggregation', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'aggregate',
        aggregation: 'exists'
      };
      
      const result = await handlers.handleAggregateIntent(intent);
      expect(result).toHaveProperty('exists');
    });
  });

  describe('Timeline handling', () => {
    it('should handle timeline at specific point', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'timeline',
        entities: ['Alice'],
        timeframe: {
          type: 'specific',
          point: '2023-06-15'
        }
      };
      
      const result = await handlers.handleTimelineIntent(intent);
      expect(result).toBeDefined();
    });

    it('should handle timeline range', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'timeline',
        entities: ['Alice'],
        timeframe: {
          type: 'range',
          from: '2023-01-01',
          to: '2023-12-31'
        }
      };
      
      const result = await handlers.handleTimelineIntent(intent);
      expect(result).toBeDefined();
    });

    it('should handle recent timeline', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'timeline',
        entities: ['Alice'],
        timeframe: {
          type: 'relative',
          duration: { amount: 30, unit: 'days' }
        }
      };
      
      const result = await handlers.handleTimelineIntent(intent);
      expect(result).toBeDefined();
    });

    it('should require entity for timeline', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'timeline'
      };
      
      const result = await handlers.handleTimelineIntent(intent);
      expect(result).toHaveProperty('error');
    });
  });

  describe('When intent handling', () => {
    it('should handle when queries', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'when',
        entities: ['Alice'],
        filters: { verbs: ['learned'] }
      };
      
      const result = await handlers.handleWhenIntent(intent);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Search handling', () => {
    it('should handle search queries', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'search',
        filters: { keywords: ['python'] }
      };
      
      const result = await handlers.handleSearchIntent(intent);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty for search without keywords', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'search'
      };
      
      const result = await handlers.handleSearchIntent(intent);
      expect(result).toEqual([]);
    });
  });

  describe('Comparison handling', () => {
    it('should handle entity comparison', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'compare',
        entities: ['Alice', 'Bob']
      };
      
      const result = await handlers.handleCompareIntent(intent);
      expect(result).toHaveProperty('comparison');
      expect(result).toHaveProperty('entities');
    });

    it('should require entities for comparison', async () => {
      const handlers = new QueryHandlers(mockEngine);
      
      const intent: NaturalQueryIntent = {
        action: 'compare'
      };
      
      const result = await handlers.handleCompareIntent(intent);
      expect(result).toHaveProperty('error');
    });
  });
});