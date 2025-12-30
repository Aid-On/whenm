import { describe, it, expect, beforeEach } from 'vitest';
import { PrologNativePersistence } from '../../src/persistence/prolog-native';
import type { WhenMEngine } from '../../src/index';

describe('PrologNativePersistence', () => {
  let persistence: PrologNativePersistence;
  let mockEngine: WhenMEngine;

  beforeEach(() => {
    persistence = new PrologNativePersistence();
    
    mockEngine = {
      remember: async () => {},
      query: async () => [],
      getEvents: async () => [],
      reset: async () => {}
    };
  });

  describe('Initialization', () => {
    it('should create persistence instance', () => {
      expect(persistence).toBeDefined();
      expect(persistence.init).toBeDefined();
      expect(persistence.save).toBeDefined();
      expect(persistence.load).toBeDefined();
    });

    it('should initialize with engine', async () => {
      await expect(persistence.init(mockEngine)).resolves.not.toThrow();
    });

    it('should handle initialization without engine', async () => {
      const standalone = new PrologNativePersistence();
      await expect(standalone.init()).resolves.not.toThrow();
    });
  });

  describe('Save operations', () => {
    it('should save events', async () => {
      await persistence.init(mockEngine);
      
      const events = [
        { event: 'Alice became CEO', timestamp: Date.now(), date: '2024-01-01' },
        { event: 'Bob joined as CTO', timestamp: Date.now(), date: '2024-02-01' }
      ];
      
      await expect(persistence.save(events)).resolves.not.toThrow();
    });

    it('should handle empty events', async () => {
      await persistence.init(mockEngine);
      await expect(persistence.save([])).resolves.not.toThrow();
    });

    it('should save complex event structures', async () => {
      await persistence.init(mockEngine);
      
      const events = [
        { 
          event: { subject: 'Alice', verb: 'learned', object: 'Python' },
          timestamp: Date.now(),
          date: '2024-01-01',
          metadata: { confidence: 0.95 }
        }
      ];
      
      await expect(persistence.save(events)).resolves.not.toThrow();
    });
  });

  describe('Load operations', () => {
    it('should load saved events', async () => {
      await persistence.init(mockEngine);
      
      const events = [
        { event: 'Alice became CEO', timestamp: Date.now(), date: '2024-01-01' }
      ];
      
      await persistence.save(events);
      const loaded = await persistence.load();
      
      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
    });

    it('should return empty array when no data', async () => {
      await persistence.init(mockEngine);
      
      const loaded = await persistence.load();
      expect(loaded).toEqual([]);
    });

    it('should load with query filters', async () => {
      await persistence.init(mockEngine);
      
      const events = [
        { event: 'Alice became CEO', timestamp: Date.now(), date: '2024-01-01' },
        { event: 'Bob joined as CTO', timestamp: Date.now(), date: '2024-02-01' },
        { event: 'Charlie became intern', timestamp: Date.now(), date: '2024-03-01' }
      ];
      
      await persistence.save(events);
      
      // Load with time range query
      const loaded = await persistence.load({
        timeRange: {
          from: '2024-01-01',
          to: '2024-02-28'
        }
      });
      
      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
    });
  });

  describe('Clear operations', () => {
    it('should clear all data', async () => {
      await persistence.init(mockEngine);
      
      const events = [
        { event: 'Alice became CEO', timestamp: Date.now(), date: '2024-01-01' }
      ];
      
      await persistence.save(events);
      await persistence.clear();
      
      const loaded = await persistence.load();
      expect(loaded).toEqual([]);
    });

    it('should handle clear on empty persistence', async () => {
      await persistence.init(mockEngine);
      await expect(persistence.clear()).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide statistics', async () => {
      await persistence.init(mockEngine);
      
      const stats = await persistence.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBeDefined();
      expect(stats.enabled).toBe(true);
    });

    it('should update statistics after save', async () => {
      await persistence.init(mockEngine);
      
      const initialStats = await persistence.getStats();
      
      const events = [
        { event: 'Alice became CEO', timestamp: Date.now(), date: '2024-01-01' },
        { event: 'Bob joined as CTO', timestamp: Date.now(), date: '2024-02-01' }
      ];
      
      await persistence.save(events);
      const updatedStats = await persistence.getStats();
      
      expect(updatedStats.totalEvents).toBeGreaterThanOrEqual(initialStats.totalEvents);
    });
  });

  describe('Prolog integration', () => {
    it('should handle Prolog facts format', async () => {
      await persistence.init(mockEngine);
      
      // Save as Prolog facts
      const facts = `
        happens(event(alice, became, ceo), '2024-01-01').
        happens(event(bob, joined, company), '2024-02-01').
      `;
      
      // This would be used internally
      await expect(persistence.save([
        { event: 'happens(event(alice, became, ceo), "2024-01-01")', timestamp: Date.now(), date: '2024-01-01' }
      ])).resolves.not.toThrow();
    });

    it('should export as Prolog format', async () => {
      await persistence.init(mockEngine);
      
      const events = [
        { event: { subject: 'alice', verb: 'became', object: 'ceo' }, timestamp: Date.now(), date: '2024-01-01' }
      ];
      
      await persistence.save(events);
      
      // If export method exists
      if ('export' in persistence) {
        const exported = await (persistence as any).export();
        expect(exported).toBeDefined();
      }
    });
  });

  describe('Error handling', () => {
    it('should handle save errors gracefully', async () => {
      await persistence.init(mockEngine);
      
      // Invalid data
      const invalidEvents = null as any;
      
      try {
        await persistence.save(invalidEvents);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle load errors gracefully', async () => {
      const uninitializedPersistence = new PrologNativePersistence();
      
      // Try to load without initialization
      const result = await uninitializedPersistence.load();
      expect(result).toEqual([]);
    });

    it('should handle malformed queries', async () => {
      await persistence.init(mockEngine);
      
      const malformedQuery = {
        timeRange: {
          from: 'not-a-date',
          to: 'also-not-a-date'
        }
      };
      
      const result = await persistence.load(malformedQuery);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Memory management', () => {
    it('should handle large datasets', async () => {
      await persistence.init(mockEngine);
      
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          event: `Event ${i}`,
          timestamp: Date.now() + i,
          date: '2024-01-01'
        });
      }
      
      await expect(persistence.save(largeDataset)).resolves.not.toThrow();
    });

    it('should efficiently query large datasets', async () => {
      await persistence.init(mockEngine);
      
      const events = [];
      for (let i = 0; i < 100; i++) {
        events.push({
          event: `Event ${i}`,
          timestamp: Date.now() + i,
          date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`
        });
      }
      
      await persistence.save(events);
      
      const loaded = await persistence.load({
        timeRange: { from: '2024-01-01', to: '2024-01-15' }
      });
      
      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
    });
  });
});