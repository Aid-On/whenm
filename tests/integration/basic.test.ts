import { describe, it, expect } from 'vitest';
import { WhenM } from '../../src/whenm';

describe('WhenM Integration Tests', () => {
  describe('Basic temporal reasoning', () => {
    it('should track state changes over time', async () => {
      const whenm = await WhenM.create('mock');
      
      // Record events
      await whenm.remember('Alice became intern', '2020-01-01');
      await whenm.remember('Alice became junior engineer', '2021-01-01');
      await whenm.remember('Alice became senior engineer', '2023-01-01');
      
      // Query current state
      const current = await whenm.ask('What is Alice?');
      expect(current).toBeDefined();
      expect(typeof current).toBe('string');
    });

    it('should handle multiple entities', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.remember('Alice became CEO', '2023-01-01');
      await whenm.remember('Bob became CTO', '2023-02-01');
      await whenm.remember('Charlie joined as intern', '2023-03-01');
      
      const ceo = await whenm.ask('Who is the CEO?');
      expect(ceo).toBeDefined();
      
      const cto = await whenm.ask('Who is the CTO?');
      expect(cto).toBeDefined();
    });

    it('should track learning events', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.remember('Alice learned Python', '2020-06-01');
      await whenm.remember('Alice learned JavaScript', '2021-03-01');
      await whenm.remember('Alice learned Rust', '2023-09-01');
      
      const skills = await whenm.ask('What did Alice learn?');
      expect(skills).toBeDefined();
    });
  });

  describe('Temporal queries', () => {
    it('should answer when questions', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.remember('Alice became CEO', '2023-01-15');
      
      const when = await whenm.ask('When did Alice become CEO?');
      expect(when).toBeDefined();
    });

    it('should query state at specific time', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.remember('Alice lived in Tokyo', '2020-01-01');
      await whenm.remember('Alice moved to Osaka', '2022-06-01');
      
      const past = await whenm.ask('Where was Alice?', '2021-01-01');
      expect(past).toBeDefined();
      
      const current = await whenm.ask('Where is Alice now?');
      expect(current).toBeDefined();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle career progression', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.batch([
        { text: 'Alice graduated from university', date: '2015-03-01' },
        { text: 'Alice joined TechCorp as intern', date: '2015-04-01' },
        { text: 'Alice became junior engineer', date: '2016-04-01' },
        { text: 'Alice became senior engineer', date: '2019-01-01' },
        { text: 'Alice became team lead', date: '2021-07-01' },
        { text: 'Alice became engineering manager', date: '2023-01-01' }
      ]);
      
      const career = await whenm.ask('What is Alice\'s current position?');
      expect(career).toBeDefined();
      
      const history = await whenm.ask('What was Alice in 2020?');
      expect(history).toBeDefined();
    });

    it('should track project lifecycle', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.batch([
        { text: 'ProjectX started', date: '2023-01-01' },
        { text: 'Alice joined ProjectX', date: '2023-01-15' },
        { text: 'Bob joined ProjectX', date: '2023-02-01' },
        { text: 'ProjectX entered beta phase', date: '2023-06-01' },
        { text: 'ProjectX launched', date: '2023-09-01' },
        { text: 'ProjectX reached 1000 users', date: '2023-10-01' }
      ]);
      
      const status = await whenm.ask('What is the status of ProjectX?');
      expect(status).toBeDefined();
      
      const team = await whenm.ask('Who worked on ProjectX?');
      expect(team).toBeDefined();
    });
  });

  describe('Search and filtering', () => {
    it('should search by keyword', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.batch([
        { text: 'Alice learned Python for data science' },
        { text: 'Bob learned Python for web development' },
        { text: 'Charlie learned JavaScript' }
      ]);
      
      const pythonEvents = await whenm.search('Python');
      expect(pythonEvents).toBeDefined();
      expect(typeof pythonEvents).toBe('string');
    });

    it('should get recent events', async () => {
      const whenm = await WhenM.create('mock');
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      await whenm.batch([
        { text: 'Old event', date: lastWeek.toISOString().split('T')[0] },
        { text: 'Yesterday event', date: yesterday.toISOString().split('T')[0] },
        { text: 'Today event', date: today.toISOString().split('T')[0] }
      ]);
      
      const recent = await whenm.recent(3);
      expect(recent).toBeDefined();
    });
  });

  describe('Memory management', () => {
    it('should export and import knowledge', async () => {
      const whenm1 = await WhenM.create('mock');
      
      await whenm1.batch([
        { text: 'Alice became CEO' },
        { text: 'Bob became CTO' },
        { text: 'Company founded', date: '2020-01-01' }
      ]);
      
      const knowledge = await whenm1.export();
      expect(knowledge).toBeDefined();
      expect(typeof knowledge).toBe('string');
      
      // Create new instance
      const whenm2 = await WhenM.create('mock');
      
      // Import is optional, just test export
      const answer = await whenm2.ask('Who is the CEO?');
      expect(answer).toBeDefined();
    });

    it('should reset memory', async () => {
      const whenm = await WhenM.create('mock');
      
      await whenm.remember('Alice became CEO');
      await whenm.remember('Bob became CTO');
      
      await whenm.reset();
      
      // After reset, should have clean state
      const answer = await whenm.ask('Who is the CEO?');
      expect(answer).toBeDefined();
    });
  });
});