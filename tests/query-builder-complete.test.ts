import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder } from '../src/query-builder';
import type { WhenMEngine } from '../src/index';

describe('QueryBuilder Complete Coverage', () => {
  let mockEngine: WhenMEngine;
  let queryBuilder: QueryBuilder;

  beforeEach(() => {
    mockEngine = {
      remember: vi.fn(),
      query: vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Bob', verb: 'became', object: 'CEO' },
        { subject: 'Alice', verb: 'joined', object: 'company' },
        { subject: 'Charlie', verb: 'completed', object: 'project' },
        { subject: 'Alice', verb: 'promoted', object: 'Senior Engineer' }
      ]),
      getEvents: vi.fn().mockResolvedValue([]),
      reset: vi.fn()
    };

    queryBuilder = new QueryBuilder(mockEngine);
  });

  describe('Chaining methods complete coverage', () => {
    it('should chain all query methods', () => {
      const result = queryBuilder
        .subject('Alice')
        .verb('learned')
        .object('Python')
        .at('2023-01-10')
        .between('2023-01-01', '2023-12-31')
        .before('2023-06-01')
        .after('2023-01-01')
        .limit(10);

      expect(result).toBe(queryBuilder);
      expect(queryBuilder['criteria'].subject).toBe('Alice');
      expect(queryBuilder['criteria'].verb).toBe('learned');
      expect(queryBuilder['criteria'].object).toBe('Python');
      expect(queryBuilder['criteria'].date).toBe('2023-01-10');
      expect(queryBuilder['criteria'].startDate).toBe('2023-01-01');
      expect(queryBuilder['criteria'].endDate).toBe('2023-12-31');
      expect(queryBuilder['criteria'].beforeDate).toBe('2023-06-01');
      expect(queryBuilder['criteria'].afterDate).toBe('2023-01-01');
      expect(queryBuilder['criteria'].limitCount).toBe(10);
    });

    it('should handle Date objects in date methods', () => {
      const date1 = new Date('2023-01-10');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-12-31');
      
      queryBuilder
        .at(date1)
        .between(date2, date3)
        .before(date3)
        .after(date2);

      expect(queryBuilder['criteria'].date).toBe('2023-01-10');
      expect(queryBuilder['criteria'].startDate).toBe('2023-01-01');
      expect(queryBuilder['criteria'].endDate).toBe('2023-12-31');
      expect(queryBuilder['criteria'].beforeDate).toBe('2023-12-31');
      expect(queryBuilder['criteria'].afterDate).toBe('2023-01-01');
    });

    it('should handle undefined and null values', () => {
      queryBuilder
        .subject(undefined as any)
        .verb(null as any)
        .object(undefined as any)
        .at(null as any);

      expect(queryBuilder['criteria'].subject).toBeUndefined();
      expect(queryBuilder['criteria'].verb).toBeNull();
      expect(queryBuilder['criteria'].object).toBeUndefined();
      expect(queryBuilder['criteria'].date).toBe('');
    });
  });

  describe('Execute method complete coverage', () => {
    it('should execute query with subject filter', async () => {
      const results = await queryBuilder.subject('Alice').execute();
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.subject === 'Alice')).toBe(true);
    });

    it('should execute query with verb filter', async () => {
      const results = await queryBuilder.verb('learned').execute();
      
      expect(results).toHaveLength(1);
      expect(results[0].verb).toBe('learned');
    });

    it('should execute query with object filter', async () => {
      const results = await queryBuilder.object('Python').execute();
      
      expect(results).toHaveLength(1);
      expect(results[0].object).toBe('Python');
    });

    it('should execute query with multiple filters', async () => {
      const results = await queryBuilder
        .subject('Alice')
        .verb('learned')
        .object('Python')
        .execute();
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        subject: 'Alice',
        verb: 'learned',
        object: 'Python'
      });
    });

    it('should execute query with limit', async () => {
      const results = await queryBuilder.limit(2).execute();
      
      expect(results).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([]);
      
      const results = await queryBuilder.subject('NonExistent').execute();
      
      expect(results).toEqual([]);
    });

    it('should handle null results from engine', async () => {
      mockEngine.query = vi.fn().mockResolvedValue(null);
      
      const results = await queryBuilder.execute();
      
      expect(results).toEqual([]);
    });

    it('should handle undefined results from engine', async () => {
      mockEngine.query = vi.fn().mockResolvedValue(undefined);
      
      const results = await queryBuilder.execute();
      
      expect(results).toEqual([]);
    });

    it('should build Prolog query with all criteria', async () => {
      await queryBuilder
        .subject('Alice')
        .verb('learned')
        .object('Python')
        .execute();

      expect(mockEngine.query).toHaveBeenCalledWith(
        'event("Alice", "learned", "Python")'
      );
    });

    it('should build Prolog query with subject only', async () => {
      await queryBuilder.subject('Alice').execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event("Alice", _, _)'
      );
    });

    it('should build Prolog query with verb only', async () => {
      await queryBuilder.verb('learned').execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event(_, "learned", _)'
      );
    });

    it('should build Prolog query with object only', async () => {
      await queryBuilder.object('Python').execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event(_, _, "Python")'
      );
    });

    it('should build Prolog query with subject and verb', async () => {
      await queryBuilder
        .subject('Alice')
        .verb('learned')
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event("Alice", "learned", _)'
      );
    });

    it('should build Prolog query with verb and object', async () => {
      await queryBuilder
        .verb('learned')
        .object('Python')
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event(_, "learned", "Python")'
      );
    });

    it('should build Prolog query with subject and object', async () => {
      await queryBuilder
        .subject('Alice')
        .object('Python')
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event("Alice", _, "Python")'
      );
    });
  });

  describe('Complex query scenarios', () => {
    it('should filter results after query', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Alice', verb: 'learned', object: 'JavaScript' },
        { subject: 'Bob', verb: 'learned', object: 'Python' },
        { subject: 'Alice', verb: 'mastered', object: 'Python' }
      ]);

      const results = await queryBuilder
        .subject('Alice')
        .verb('learned')
        .execute();
      
      expect(results).toHaveLength(2);
      expect(results[0].object).toBe('Python');
      expect(results[1].object).toBe('JavaScript');
    });

    it('should apply limit after filtering', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Alice', verb: 'learned', object: 'JavaScript' },
        { subject: 'Alice', verb: 'learned', object: 'TypeScript' },
        { subject: 'Alice', verb: 'learned', object: 'Rust' }
      ]);

      const results = await queryBuilder
        .subject('Alice')
        .limit(2)
        .execute();
      
      expect(results).toHaveLength(2);
    });

    it('should handle special characters in criteria', async () => {
      const results = await queryBuilder
        .subject('Alice & Bob')
        .verb('learned/mastered')
        .object('C++')
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event("Alice & Bob", "learned/mastered", "C++")'
      );
    });

    it('should handle empty string criteria', async () => {
      const results = await queryBuilder
        .subject('')
        .verb('')
        .object('')
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event("", "", "")'
      );
    });

    it('should reset criteria for new queries', async () => {
      // First query
      await queryBuilder
        .subject('Alice')
        .verb('learned')
        .execute();
      
      // Create new builder for second query
      const newBuilder = new QueryBuilder(mockEngine);
      await newBuilder
        .subject('Bob')
        .verb('became')
        .execute();
      
      // Verify second query is independent
      expect(mockEngine.query).toHaveBeenLastCalledWith(
        'event("Bob", "became", _)'
      );
    });
  });

  describe('Date filtering (not implemented but methods exist)', () => {
    it('should store date criteria', () => {
      queryBuilder
        .at('2023-01-10')
        .between('2023-01-01', '2023-12-31')
        .before('2023-06-01')
        .after('2023-01-01');

      // Date filtering is stored but not used in current implementation
      expect(queryBuilder['criteria'].date).toBe('2023-01-10');
      expect(queryBuilder['criteria'].startDate).toBe('2023-01-01');
      expect(queryBuilder['criteria'].endDate).toBe('2023-12-31');
      expect(queryBuilder['criteria'].beforeDate).toBe('2023-06-01');
      expect(queryBuilder['criteria'].afterDate).toBe('2023-01-01');
    });

    it('should handle invalid dates', () => {
      queryBuilder
        .at('invalid-date')
        .between('invalid-start', 'invalid-end')
        .before('invalid-before')
        .after('invalid-after');

      expect(queryBuilder['criteria'].date).toBe('invalid-date');
      expect(queryBuilder['criteria'].startDate).toBe('invalid-start');
      expect(queryBuilder['criteria'].endDate).toBe('invalid-end');
      expect(queryBuilder['criteria'].beforeDate).toBe('invalid-before');
      expect(queryBuilder['criteria'].afterDate).toBe('invalid-after');
    });

    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-01-10T10:30:00Z');
      
      queryBuilder.at(date);
      
      expect(queryBuilder['criteria'].date).toBe('2023-01-10');
    });

    it('should handle Date with different timezones', () => {
      const date = new Date('2023-01-10T23:59:59Z');
      
      queryBuilder.at(date);
      
      // Should still be the same date in ISO format
      expect(queryBuilder['criteria'].date.startsWith('2023-01-10')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle query execution errors', async () => {
      mockEngine.query = vi.fn().mockRejectedValue(new Error('Query failed'));
      
      await expect(queryBuilder.execute()).rejects.toThrow('Query failed');
    });

    it('should handle very long criteria strings', async () => {
      const longString = 'A'.repeat(1000);
      
      await queryBuilder
        .subject(longString)
        .verb(longString)
        .object(longString)
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalled();
    });

    it('should handle unicode characters in criteria', async () => {
      await queryBuilder
        .subject('Alice 🧑‍💻')
        .verb('learned 📚')
        .object('Python 🐍')
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event("Alice 🧑‍💻", "learned 📚", "Python 🐍")'
      );
    });

    it('should handle numbers as criteria', async () => {
      await queryBuilder
        .subject(123 as any)
        .verb(456 as any)
        .object(789 as any)
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event(123, 456, 789)'
      );
    });

    it('should handle boolean as criteria', async () => {
      await queryBuilder
        .subject(true as any)
        .verb(false as any)
        .object(true as any)
        .execute();
      
      expect(mockEngine.query).toHaveBeenCalledWith(
        'event(true, false, true)'
      );
    });
  });

  describe('Filtering implementation details', () => {
    it('should correctly filter when all criteria match', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Alice', verb: 'learned', object: 'JavaScript' },
        { subject: 'Bob', verb: 'learned', object: 'Python' }
      ]);

      const results = await queryBuilder
        .subject('Alice')
        .verb('learned')
        .object('Python')
        .execute();
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        subject: 'Alice',
        verb: 'learned',
        object: 'Python'
      });
    });

    it('should correctly filter when no criteria match', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Bob', verb: 'became', object: 'CEO' }
      ]);

      const results = await queryBuilder
        .subject('Charlie')
        .execute();
      
      expect(results).toEqual([]);
    });

    it('should correctly apply limit to filtered results', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' },
        { subject: 'Alice', verb: 'learned', object: 'JavaScript' },
        { subject: 'Alice', verb: 'learned', object: 'TypeScript' },
        { subject: 'Alice', verb: 'learned', object: 'Rust' },
        { subject: 'Alice', verb: 'learned', object: 'Go' }
      ]);

      const results = await queryBuilder
        .subject('Alice')
        .verb('learned')
        .limit(3)
        .execute();
      
      expect(results).toHaveLength(3);
      expect(results[0].object).toBe('Python');
      expect(results[1].object).toBe('JavaScript');
      expect(results[2].object).toBe('TypeScript');
    });

    it('should handle limit larger than results', async () => {
      mockEngine.query = vi.fn().mockResolvedValue([
        { subject: 'Alice', verb: 'learned', object: 'Python' }
      ]);

      const results = await queryBuilder
        .limit(100)
        .execute();
      
      expect(results).toHaveLength(1);
    });

    it('should handle limit of 0', async () => {
      const results = await queryBuilder
        .limit(0)
        .execute();
      
      expect(results).toEqual([]);
    });

    it('should handle negative limit', async () => {
      const results = await queryBuilder
        .limit(-1)
        .execute();
      
      // Should return all results (no limit)
      expect(results).toHaveLength(5);
    });
  });
});