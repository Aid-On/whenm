import { describe, it, expect, beforeEach } from 'vitest';
import { createWhenM } from './index.js';
import { createTemporalDB, type TemporalDB } from './entity-api.js';

interface WhenMInstance {
  remember: (text: string, date?: string) => Promise<void>;
  ask: (question: string) => Promise<string>;
}

function getRoleForIndex(i: number): string {
  if (i % 3 === 0) return 'manager';
  if (i % 3 === 1) return 'engineer';
  return 'designer';
}

describe('Query Performance', () => {
  let memory: WhenMInstance;
  let db: TemporalDB;

  beforeEach(async () => {
    memory = await createWhenM({ currentDate: '2025-01-15' });
    db = createTemporalDB(memory);
  });

  describe('Indexed queries', () => {
    it('should use index for fast lookups', async () => {
      for (let i = 0; i < 100; i++) {
        const entity = db.entity(`person${i}`);
        await entity.set({
          role: getRoleForIndex(i),
          location: i < 50 ? 'Tokyo' : 'London'
        }, '2025-01-01');
      }

      const startProlog = Date.now();
      const managersProlog = await db.query({ role: 'manager' });
      const prologTime = Date.now() - startProlog;

      const startIndex = Date.now();
      const managersIndex = await db.queryFast({ role: 'manager' });
      const indexTime = Date.now() - startIndex;

      expect(managersIndex.sort()).toEqual(managersProlog.sort());
      expect(managersIndex.length).toBe(34);
      console.log(`Prolog query: ${prologTime}ms, Index query: ${indexTime}ms`);
    });

    it('should handle complex filters with index', async () => {
      const alice = db.entity('alice');
      const bob = db.entity('bob');
      const charlie = db.entity('charlie');
      const dave = db.entity('dave');

      await alice.set({ role: 'manager', location: 'Tokyo' }, '2025-01-01');
      await bob.set({ role: 'engineer', location: 'Tokyo' }, '2025-01-01');
      await charlie.set({ role: 'engineer', location: 'London' }, '2025-01-01');
      await dave.set({ role: 'manager', location: 'London' }, '2025-01-01');

      const tokyoManagers = await db.queryFast({ role: 'manager', location: 'Tokyo' }, '2025-01-01');
      expect(tokyoManagers).toEqual(['alice']);

      const executives = await db.queryFast({ role: ['manager', 'director'] }, '2025-01-01');
      expect(executives.sort()).toEqual(['alice', 'dave']);
    });

    it('should invalidate index when entities change', async () => {
      const alice = db.entity('alice');
      await alice.set({ role: 'engineer' }, '2025-01-01');
      const engineers1 = await db.queryFast({ role: 'engineer' }, '2025-01-15');
      expect(engineers1).toEqual(['alice']);

      await alice.set({ role: 'manager' }, '2025-01-10');
      db.invalidateIndex();

      const engineers2 = await db.queryFast({ role: 'engineer' }, '2025-01-15');
      expect(engineers2).toEqual([]);
      const managers = await db.queryFast({ role: 'manager' }, '2025-01-15');
      expect(managers).toEqual(['alice']);
    });

    it('should cache index for same date', async () => {
      for (let i = 0; i < 10; i++) {
        const entity = db.entity(`test${i}`);
        await entity.set({ role: 'worker' }, '2025-01-01');
      }

      const start1 = Date.now();
      await db.queryFast({ role: 'worker' }, '2025-01-01');
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await db.queryFast({ role: 'worker' }, '2025-01-01');
      const time2 = Date.now() - start2;

      console.log(`Build index: ${time1}ms, Use cache: ${time2}ms`);
      expect(time2).toBeLessThanOrEqual(time1 + 2);
    });
  });
});
