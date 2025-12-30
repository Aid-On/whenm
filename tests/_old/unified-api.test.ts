import { describe, it, expect, beforeEach } from 'vitest';
import { createWhenM, type WhenM } from './index.js';

describe('UnifiedWhenM API', () => {
  let memory: WhenM;

  beforeEach(async () => {
    memory = await createWhenM({
      currentDate: '2025-01-15',
      defaultSubject: 'alice'
    });
  });

  describe('remember()', () => {
    it('should record events with explicit subjects', async () => {
      await memory.remember('alice became programmer', '2021-06-01');
      await memory.remember('bob learned Python', '2022-03-01');
      
      const aliceHistory = await memory.history('alice');
      expect(aliceHistory).toHaveLength(1);
      expect(aliceHistory[0]).toEqual({
        date: '2021-06-01',
        event: 'became programmer'
      });

      const bobHistory = await memory.history('bob');
      expect(bobHistory).toHaveLength(1);
      expect(bobHistory[0]).toEqual({
        date: '2022-03-01',
        event: 'learned Python'
      });
    });

    it('should handle dynamic verbs without predefined schemas', async () => {
      // Test completely custom verbs
      await memory.remember('alice invented time_machine', '2024-01-01');
      await memory.remember('bob discovered new_planet', '2024-02-01');
      await memory.remember('charlie teleported to_mars', '2024-03-01');
      
      const history = await memory.history('alice');
      expect(history[0].event).toContain('invented');
      
      const bobHistory = await memory.history('bob');
      expect(bobHistory[0].event).toContain('discovered');
    });

    it('should use default subject when not specified', async () => {
      await memory.remember('learned TypeScript', '2023-01-01');
      
      const history = await memory.history('alice'); // alice is default
      expect(history).toHaveLength(1);
      expect(history[0].event).toContain('TypeScript');
    });

    it('should handle dates properly', async () => {
      const date = new Date('2024-06-15');
      await memory.remember('alice joined team', date);
      
      const history = await memory.history('alice');
      expect(history[0].date).toBe('2024-06-15');
    });
  });

  describe('ask()', () => {
    beforeEach(async () => {
      await memory.remember('alice became programmer', '2021-06-01');
      await memory.remember('alice learned Python', '2021-09-01');
      await memory.remember('alice became tech_lead', '2024-01-01');
      await memory.remember('bob joined chess_club', '2023-01-01');
    });

    it('should answer "what" questions', async () => {
      const job = await memory.ask("What is alice's job?");
      expect(job).toBe('tech_lead');
      
      const skills = await memory.ask("What does alice know?");
      expect(skills).toContain('Python');
    });

    it('should answer "when" questions', async () => {
      const when = await memory.ask("When did alice learn Python?");
      expect(when).toBe('2021-09-01');
    });

    it('should answer boolean questions', async () => {
      const isLead = await memory.ask("Is alice still a tech_lead?");
      expect(isLead).toBe('yes');
    });

    it('should handle unknown queries gracefully', async () => {
      const unknown = await memory.ask("What is charlie's favorite color?");
      expect(unknown).toContain('unknown');
    });
  });

  describe('history()', () => {
    it('should return complete timeline for a subject', async () => {
      await memory.remember('alice became junior_dev', '2020-01-01');
      await memory.remember('alice learned React', '2020-06-01');
      await memory.remember('alice became senior_dev', '2022-01-01');
      
      const history = await memory.history('alice');
      expect(history).toHaveLength(3);
      expect(history[0].date).toBe('2020-01-01');
      expect(history[2].date).toBe('2022-01-01');
    });

    it('should return empty array for unknown subjects', async () => {
      const history = await memory.history('unknown_person');
      expect(history).toEqual([]);
    });
  });

  describe('stateAt()', () => {
    beforeEach(async () => {
      await memory.remember('alice became programmer', '2021-06-01');
      await memory.remember('alice learned Python', '2021-09-01');
      await memory.remember('alice joined chess_club', '2022-01-01');
      await memory.remember('alice became tech_lead', '2024-01-01');
      await memory.remember('alice learned Rust', '2024-06-01');
    });

    it('should return state at specific time', async () => {
      const state2022 = await memory.stateAt('2022-06-01', 'alice');
      expect(state2022.role).toBe('programmer');
      expect(state2022.knows).toContain('Python');
      expect(state2022.member_of).toContain('chess_club');
      
      const state2025 = await memory.stateAt('2025-01-01', 'alice');
      expect(state2025.role).toBe('tech_lead');
      expect(state2025.knows).toEqual(expect.arrayContaining(['Python', 'Rust']));
    });

    it('should handle Date objects', async () => {
      const date = new Date('2022-06-01');
      const state = await memory.stateAt(date, 'alice');
      expect(state.role).toBe('programmer');
    });
  });

  describe('Multi-subject support', () => {
    it('should handle multiple subjects independently', async () => {
      // Create a fresh instance for this test
      const freshMemory = await createWhenM({
        currentDate: '2025-01-15',
        defaultSubject: 'alice'
      });
      
      await freshMemory.remember('alice became programmer', '2021-01-01');
      await freshMemory.remember('bob became designer', '2021-02-01');
      await freshMemory.remember('charlie became manager', '2021-03-01');
      
      const aliceJob = await freshMemory.ask("What is alice's job?");
      expect(aliceJob).toBe('programmer');
      
      const bobJob = await freshMemory.ask("What is bob's job?");
      expect(bobJob).toBe('designer');
      
      const charlieJob = await freshMemory.ask("What is charlie's job?");
      expect(charlieJob).toBe('manager');
    });
  });

  describe('Edge cases', () => {
    it('should handle events without objects', async () => {
      await memory.remember('alice quit', '2024-01-01');
      const history = await memory.history('alice');
      expect(history[0].event).toBe('quit');
    });

    it('should handle complex object names', async () => {
      await memory.remember('alice joined quantum_computing_research_lab', '2024-01-01');
      const history = await memory.history('alice');
      expect(history[0].event).toContain('quantum_computing_research_lab');
    });

    it('should handle special characters in subjects/objects', async () => {
      await memory.remember('alice learned C++', '2024-01-01');
      await memory.remember('bob joined team-alpha', '2024-01-01');
      
      const aliceHistory = await memory.history('alice');
      expect(aliceHistory[0].event).toContain('C++');
      
      const bobHistory = await memory.history('bob');
      expect(bobHistory[0].event).toContain('team-alpha');
    });
  });
});