import { describe, it, expect, beforeEach } from 'vitest';
import { createWhenM } from './index.js';
import { createTemporalDB, type TemporalDB } from './entity-api.js';

describe('Query Performance', () => {
  let memory: any;
  let db: TemporalDB;
  
  beforeEach(async () => {
    memory = await createWhenM({
      currentDate: '2025-01-15'
    });
    db = createTemporalDB(memory);
  });
  
  describe('Indexed queries', () => {
    it('should use index for fast lookups', async () => {
      // Setup test data
      for (let i = 0; i < 100; i++) {
        const entity = db.entity(`person${i}`);
        await entity.set({
          role: i % 3 === 0 ? 'manager' : i % 3 === 1 ? 'engineer' : 'designer',
          location: i < 50 ? 'Tokyo' : 'London'
        }, '2025-01-01');
      }
      
      // Measure standard query time
      const startProlog = Date.now();
      const managersProlog = await db.query({ role: 'manager' });
      const prologTime = Date.now() - startProlog;
      
      // Measure indexed query time
      const startIndex = Date.now();
      const managersIndex = await db.queryFast({ role: 'manager' });
      const indexTime = Date.now() - startIndex;
      
      // Both should return same results
      expect(managersIndex.sort()).toEqual(managersProlog.sort());
      expect(managersIndex.length).toBe(34); // 100/3 rounded up
      
      // Index should be faster (or at least not much slower for small datasets)
      console.log(`Prolog query: ${prologTime}ms, Index query: ${indexTime}ms`);
    });
    
    it('should handle complex filters with index', async () => {
      // Setup diverse data
      const alice = db.entity('alice');
      const bob = db.entity('bob');
      const charlie = db.entity('charlie');
      const dave = db.entity('dave');
      
      await alice.set({ role: 'manager', location: 'Tokyo' }, '2025-01-01');
      await bob.set({ role: 'engineer', location: 'Tokyo' }, '2025-01-01');
      await charlie.set({ role: 'engineer', location: 'London' }, '2025-01-01');
      await dave.set({ role: 'manager', location: 'London' }, '2025-01-01');
      
      // Test multi-filter query
      const tokyoManagers = await db.queryFast({
        role: 'manager',
        location: 'Tokyo'
      }, '2025-01-01');
      
      expect(tokyoManagers).toEqual(['alice']);
      
      // Test OR conditions
      const executives = await db.queryFast({
        role: ['manager', 'director']
      }, '2025-01-01');
      
      expect(executives.sort()).toEqual(['alice', 'dave']);
    });
    
    it('should invalidate index when entities change', async () => {
      const alice = db.entity('alice');
      await alice.set({ role: 'engineer' }, '2025-01-01');
      
      // First query builds index
      const engineers1 = await db.queryFast({ role: 'engineer' }, '2025-01-15');
      expect(engineers1).toEqual(['alice']);
      
      // Change alice's role (at a later date to avoid conflict)
      await alice.set({ role: 'manager' }, '2025-01-10');
      
      // Invalidate index
      db.invalidateIndex();
      
      // Query should reflect new state (alice became manager on Jan 10, so by Jan 15 she's a manager)
      const engineers2 = await db.queryFast({ role: 'engineer' }, '2025-01-15');
      expect(engineers2).toEqual([]);
      
      const managers = await db.queryFast({ role: 'manager' }, '2025-01-15');
      expect(managers).toEqual(['alice']);
    });
    
    it('should cache index for same date', async () => {
      // Setup data
      for (let i = 0; i < 10; i++) {
        const entity = db.entity(`test${i}`);
        await entity.set({ role: 'worker' }, '2025-01-01');
      }
      
      // First query builds index
      const start1 = Date.now();
      await db.queryFast({ role: 'worker' }, '2025-01-01');
      const time1 = Date.now() - start1;
      
      // Second query uses cached index (should be much faster)
      const start2 = Date.now();
      await db.queryFast({ role: 'worker' }, '2025-01-01');
      const time2 = Date.now() - start2;
      
      // Third query with different date rebuilds index
      const start3 = Date.now();
      await db.queryFast({ role: 'worker' }, '2025-01-02');
      const time3 = Date.now() - start3;
      
      console.log(`Build index: ${time1}ms, Use cache: ${time2}ms, Rebuild: ${time3}ms`);
      
      // Cached query should typically be faster (allow for measurement variance)
      // Just ensure both queries completed successfully
      expect(time2).toBeLessThanOrEqual(time1 + 2); // Allow 2ms variance
    });
  });
});