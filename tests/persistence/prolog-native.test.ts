import { describe, it, expect, beforeEach } from 'vitest';
import { PrologNativePersistence } from '../../src/persistence/prolog-native';

describe('PrologNativePersistence', () => {
  let persistence: PrologNativePersistence;

  beforeEach(() => {
    persistence = new PrologNativePersistence();
  });

  describe('Initialization', () => {
    it('should create persistence instance', () => {
      expect(persistence).toBeDefined();
      expect(persistence.type).toBe('prolog-native');
      expect(persistence.save).toBeDefined();
      expect(persistence.load).toBeDefined();
      expect(persistence.clear).toBeDefined();
      expect(persistence.stats).toBeDefined();
    });
  });

  describe('Save operations', () => {
    it('should save a single event', async () => {
      await expect(persistence.save({
        event: 'Alice became CEO',
        time: '2024-01-01'
      })).resolves.not.toThrow();
    });

    it('should save batch events', async () => {
      const events = [
        { event: 'Alice became CEO', time: '2024-01-01' },
        { event: 'Bob joined as CTO', time: '2024-02-01' }
      ];

      await expect(persistence.saveBatch(events)).resolves.not.toThrow();
    });

    it('should save complex event structures', async () => {
      await expect(persistence.save({
        event: 'learned(alice, python)',
        time: '2024-01-01',
        metadata: { confidence: 0.95 }
      })).resolves.not.toThrow();
    });

    it('should deduplicate identical events', async () => {
      await persistence.save({ event: 'Alice became CEO', time: '2024-01-01' });
      await persistence.save({ event: 'Alice became CEO', time: '2024-01-01' });

      const loaded = await persistence.load();
      expect(loaded).toHaveLength(1);
    });
  });

  describe('Load operations', () => {
    it('should load saved events', async () => {
      await persistence.save({ event: 'Alice became CEO', time: '2024-01-01' });

      const loaded = await persistence.load();

      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].event).toBe('Alice became CEO');
    });

    it('should return empty array when no data', async () => {
      const loaded = await persistence.load();
      expect(loaded).toEqual([]);
    });

    it('should load with time range query', async () => {
      await persistence.saveBatch([
        { event: 'Alice became CEO', time: '2024-01-01' },
        { event: 'Bob joined as CTO', time: '2024-02-01' },
        { event: 'Charlie became intern', time: '2024-03-01' }
      ]);

      const loaded = await persistence.load({
        timeRange: { from: '2024-01-01', to: '2024-02-28' }
      });

      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
      expect(loaded).toHaveLength(2);
    });

    it('should load with limit', async () => {
      await persistence.saveBatch([
        { event: 'Event 1', time: '2024-01-01' },
        { event: 'Event 2', time: '2024-02-01' },
        { event: 'Event 3', time: '2024-03-01' }
      ]);

      const loaded = await persistence.load({ limit: 2 });
      expect(loaded).toHaveLength(2);
    });

    it('should load with offset', async () => {
      await persistence.saveBatch([
        { event: 'Event 1', time: '2024-01-01' },
        { event: 'Event 2', time: '2024-02-01' },
        { event: 'Event 3', time: '2024-03-01' }
      ]);

      const loaded = await persistence.load({ offset: 1 });
      expect(loaded).toHaveLength(2);
      expect(loaded[0].event).toBe('Event 2');
    });
  });

  describe('Clear operations', () => {
    it('should clear all data', async () => {
      await persistence.save({ event: 'Alice became CEO', time: '2024-01-01' });
      await persistence.clear();

      const loaded = await persistence.load();
      expect(loaded).toEqual([]);
    });

    it('should handle clear on empty persistence', async () => {
      await expect(persistence.clear()).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide statistics', async () => {
      const stats = await persistence.stats();
      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBe(0);
      expect(stats.storageType).toBe('prolog-native');
    });

    it('should update statistics after save', async () => {
      await persistence.saveBatch([
        { event: 'Alice became CEO', time: '2024-01-01' },
        { event: 'Bob joined as CTO', time: '2024-02-01' }
      ]);

      const stats = await persistence.stats();
      expect(stats.totalEvents).toBe(2);
      expect(stats.oldestEvent).toBe('2024-01-01');
      expect(stats.newestEvent).toBe('2024-02-01');
    });
  });

  describe('Prolog integration', () => {
    it('should handle Prolog-style events', async () => {
      await expect(persistence.save({
        event: 'happens(event(alice, became, ceo), "2024-01-01")',
        time: '2024-01-01'
      })).resolves.not.toThrow();
    });

    it('should export as Prolog format', async () => {
      await persistence.save({
        event: 'became(alice, ceo)',
        time: '2024-01-01'
      });

      const exported = await persistence.exportProlog();
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
    });

    it('should import Prolog facts', async () => {
      const facts = `became(alice, ceo, "2024-01-01").`;

      await expect(persistence.importProlog(facts)).resolves.not.toThrow();
    });

    it('should query by Prolog pattern', async () => {
      await persistence.save({
        event: 'became(alice, ceo)',
        time: '2024-01-01'
      });

      const results = await persistence.queryProlog('became(X)');
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Delete operations', () => {
    it('should delete events matching query', async () => {
      await persistence.saveBatch([
        { event: 'Alice became CEO', time: '2024-01-01' },
        { event: 'Bob joined as CTO', time: '2024-02-01' }
      ]);

      const deleted = await persistence.delete({
        timeRange: { from: '2024-01-01', to: '2024-01-31' }
      });
      expect(deleted).toBe(1);

      const remaining = await persistence.load();
      expect(remaining).toHaveLength(1);
    });
  });

  describe('Error handling', () => {
    it('should handle load with malformed queries', async () => {
      const result = await persistence.load({
        timeRange: { from: 'not-a-date', to: 'also-not-a-date' }
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Memory management', () => {
    it('should handle large datasets', async () => {
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          event: `Event ${i}`,
          time: '2024-01-01'
        });
      }

      await expect(persistence.saveBatch(largeDataset)).resolves.not.toThrow();

      const stats = await persistence.stats();
      expect(stats.totalEvents).toBe(1000);
    });

    it('should efficiently query large datasets', async () => {
      const events = [];
      for (let i = 0; i < 100; i++) {
        events.push({
          event: `Event ${i}`,
          time: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`
        });
      }

      await persistence.saveBatch(events);

      const loaded = await persistence.load({
        timeRange: { from: '2024-01-01', to: '2024-01-15' }
      });

      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
      expect(loaded.length).toBeLessThanOrEqual(100);
    });
  });
});
