import { describe, it, expect, vi } from 'vitest';
import { QueryBuilder, Timeline, createQueryBuilder, createTimeline } from '../src/query-builder';
import type { WhenMEngine } from '../src/index';

describe('QueryBuilder', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockResolvedValue([]),
    reset: vi.fn()
  };

  describe('Builder pattern', () => {
    it('should create query builder', () => {
      const builder = new QueryBuilder(mockEngine);
      expect(builder).toBeDefined();
      expect(builder.subject).toBeDefined();
      expect(builder.verb).toBeDefined();
      expect(builder.where).toBeDefined();
    });

    it('should support chaining', () => {
      const builder = new QueryBuilder(mockEngine);
      const result = builder
        .subject('Alice')
        .verb('learned')
        .where({ object: 'Python' });
      
      expect(result).toBe(builder);
    });

    it('should handle array subjects', () => {
      const builder = new QueryBuilder(mockEngine);
      const result = builder.subject(['Alice', 'Bob']);
      expect(result).toBe(builder);
    });

    it('should handle array verbs', () => {
      const builder = new QueryBuilder(mockEngine);
      const result = builder.verb(['learned', 'studied']);
      expect(result).toBe(builder);
    });

    it('should handle array objects', () => {
      const builder = new QueryBuilder(mockEngine);
      const result = builder.where({ object: ['Python', 'JavaScript'] });
      expect(result).toBe(builder);
    });
  });

  describe('Time filters', () => {
    it('should filter by date range', () => {
      const builder = new QueryBuilder(mockEngine);
      const from = new Date('2023-01-01');
      const to = new Date('2023-12-31');
      
      const result = builder.between(from, to);
      expect(result).toBe(builder);
    });

    it('should filter by specific date', () => {
      const builder = new QueryBuilder(mockEngine);
      const date = new Date('2023-06-15');
      
      const result = builder.on(date);
      expect(result).toBe(builder);
    });

    it('should filter by relative time', () => {
      const builder = new QueryBuilder(mockEngine);
      
      const result = builder.last(30, 'days');
      expect(result).toBe(builder);
    });

    it('should support different time units', () => {
      const builder = new QueryBuilder(mockEngine);
      
      builder.last(1, 'hour');
      builder.last(24, 'hours');
      builder.last(7, 'days');
      builder.last(4, 'weeks');
      builder.last(3, 'months');
      builder.last(1, 'year');
      
      expect(builder).toBeDefined();
    });
  });

  describe('Sorting and limiting', () => {
    it('should sort by time', () => {
      const builder = new QueryBuilder(mockEngine);
      
      const result = builder.orderBy('time', 'desc');
      expect(result).toBe(builder);
    });

    it('should limit results', () => {
      const builder = new QueryBuilder(mockEngine);
      
      const result = builder.limit(10);
      expect(result).toBe(builder);
    });
  });

  describe('Aggregations', () => {
    it('should count results', async () => {
      const builder = new QueryBuilder(mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      const count = await builder.count();
      expect(count).toBe(0);
    });

    it('should get distinct values', async () => {
      const builder = new QueryBuilder(mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      const values = await builder.distinct('object');
      expect(Array.isArray(values)).toBe(true);
    });

    it('should get first result', async () => {
      const builder = new QueryBuilder(mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      const first = await builder.first();
      expect(first).toBeNull();
    });

    it('should check if exists', async () => {
      const builder = new QueryBuilder(mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      const exists = await builder.exists();
      expect(exists).toBe(false);
    });
  });

  describe('Query execution', () => {
    it('should execute query', async () => {
      const builder = new QueryBuilder(mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([{ result: 'test' }]);
      
      mockEngine.query = vi.fn().mockResolvedValue([{ 
        subject: 'Alice', 
        verb: 'learned', 
        object: 'Python', 
        time: '2023-01-10' 
      }]);
      
      const results = await builder.execute();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(mockEngine.query).toHaveBeenCalled();
    });

    it('should build complex queries', async () => {
      const builder = new QueryBuilder(mockEngine);
      
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      await builder
        .subject('Alice')
        .verb('learned')
        .between('2023-01-01', '2023-12-31')
        .orderBy('time', 'asc')
        .limit(5)
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalled();
    });
  });

  describe('Factory functions', () => {
    it('should create query builder via factory', () => {
      const builder = createQueryBuilder(mockEngine);
      expect(builder).toBeInstanceOf(QueryBuilder);
    });
  });
});

describe('Timeline', () => {
  const mockEngine: WhenMEngine = {
    remember: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockResolvedValue([]),
    reset: vi.fn()
  };

  describe('Timeline methods', () => {
    it('should create timeline', () => {
      const timeline = new Timeline('Alice', mockEngine);
      expect(timeline).toBeDefined();
      expect(timeline.at).toBeDefined();
      expect(timeline.between).toBeDefined();
      expect(timeline.recent).toBeDefined();
    });

    it('should get snapshot at time', async () => {
      const timeline = new Timeline('Alice', mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([{ States: [] }]);
      
      const snapshot = await timeline.at('2023-06-15');
      expect(snapshot).toHaveProperty('time');
      expect(snapshot).toHaveProperty('states');
    });

    it('should get events between dates', async () => {
      const timeline = new Timeline('Alice', mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      const events = await timeline.between('2023-01-01', '2023-12-31');
      expect(Array.isArray(events)).toBe(true);
    });

    it('should get recent events', async () => {
      const timeline = new Timeline('Alice', mockEngine);
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      const events = await timeline.recent(30);
      expect(mockEngine.query).toHaveBeenCalled();
    });
  });

  describe('Factory functions', () => {
    it('should create timeline via factory', () => {
      const timeline = createTimeline('Alice', mockEngine);
      expect(timeline).toBeInstanceOf(Timeline);
    });
  });
});