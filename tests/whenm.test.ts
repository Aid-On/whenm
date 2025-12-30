import { describe, it, expect } from 'vitest';
import { WhenM } from '../src/whenm';

describe('WhenM', () => {
  describe('Factory methods', () => {
    it('should create instance with auto()', async () => {
      const whenm = await WhenM.auto();
      expect(whenm).toBeDefined();
      expect(whenm.remember).toBeDefined();
      expect(whenm.ask).toBeDefined();
    });

    it('should create instance with create()', async () => {
      const whenm = await WhenM.create({ llm: 'mock' });
      expect(whenm).toBeDefined();
      expect(whenm.remember).toBeDefined();
      expect(whenm.ask).toBeDefined();
    });

    it('should create instance with string config', async () => {
      const whenm = await WhenM.create('mock');
      expect(whenm).toBeDefined();
    });
  });

  describe('Basic operations', () => {
    it('should remember events', async () => {
      const whenm = await WhenM.create('mock');
      
      // Should not throw
      await expect(whenm.remember('Alice became CEO')).resolves.toBeTruthy();
      await expect(whenm.remember('Bob learned Python', '2024-01-01')).resolves.toBeTruthy();
    });

    it('should answer questions', async () => {
      const whenm = await WhenM.create('mock');
      await whenm.remember('Alice became CEO');
      
      const answer = await whenm.ask('What is Alice?');
      expect(answer).toBeDefined();
      expect(typeof answer).toBe('string');
    });

    it('should support chaining', async () => {
      const whenm = await WhenM.create('mock');
      
      const result = await whenm
        .remember('Alice became CEO')
        .then(w => w.remember('Bob joined as CTO'));
      
      expect(result).toBe(whenm);
    });
  });

  describe('Utility methods', () => {
    it('should search events', async () => {
      const whenm = await WhenM.create('mock');
      await whenm.remember('Alice learned Python');
      
      const results = await whenm.search('Python');
      expect(results).toBeDefined();
      expect(typeof results).toBe('string');
    });

    it('should get recent events', async () => {
      const whenm = await WhenM.create('mock');
      await whenm.remember('Alice became CEO');
      
      const recent = await whenm.recent(7);
      expect(recent).toBeDefined();
      expect(typeof recent).toBe('string');
    });

    it('should handle batch operations', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.batch([
        { text: 'Alice became CEO' },
        { text: 'Bob joined as CTO', date: '2024-01-01' }
      ]);
      
      const answer = await whenm.ask('Who is the CEO?');
      expect(answer).toBeDefined();
    });
  });

  describe('Debug mode', () => {
    it('should toggle debug mode', async () => {
      const whenm = await WhenM.create('mock');
      
      const result = whenm.debug(true);
      expect(result).toBe(whenm); // Should return self for chaining
      
      whenm.debug(false);
    });
  });

  describe('Export/Import', () => {
    it('should export knowledge', async () => {
      const whenm = await WhenM.create('mock');
      await whenm.remember('Alice became CEO');
      
      const knowledge = await whenm.export();
      expect(knowledge).toBeDefined();
      expect(typeof knowledge).toBe('string');
    });

    it('should reset memory', async () => {
      const whenm = await WhenM.create('mock');
      await whenm.remember('Alice became CEO');
      
      await expect(whenm.reset()).resolves.not.toThrow();
    });
  });
});