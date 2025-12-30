import { describe, it, expect, beforeEach } from 'vitest';
import { createWhenM } from './index.js';
import { createTemporalDB, type Entity, type TemporalDB } from './entity-api.js';

describe('Entity API', () => {
  let memory: any;
  let db: TemporalDB;
  let alice: Entity;
  
  beforeEach(async () => {
    memory = await createWhenM({
      currentDate: '2025-01-15'
    });
    db = createTemporalDB(memory);
    alice = db.entity('alice');
  });
  
  describe('Basic operations', () => {
    it('should set and get entity state', async () => {
      await alice.set({
        role: 'manager',
        location: 'Tokyo'
      });
      
      const state = await alice.current;
      expect(state.role).toBe('manager');
      expect(state.location).toBe('Tokyo');
    });
    
    it('should update with natural language', async () => {
      await alice.update('became software engineer');
      await alice.update('learned Python');
      
      const state = await alice.current;
      expect(state.role).toBe('software engineer');
      expect(state.knows).toContain('Python');
    });
    
    it('should add and remove from collections', async () => {
      await alice.add('skills', 'TypeScript', '2025-01-10');
      await alice.add('skills', 'Python', '2025-01-10');
      await alice.add('skills', 'Rust', '2025-01-10');
      
      let state = await alice.get('2025-01-14');
      expect(state.knows).toEqual(expect.arrayContaining(['TypeScript', 'Python', 'Rust']));
      
      // Remove a skill on a later date
      await alice.remove('skills', 'Python', '2025-01-15');
      
      state = await alice.current;
      expect(state.knows).toEqual(expect.arrayContaining(['TypeScript', 'Rust']));
      expect(state.knows).not.toContain('Python');
    });
    
    it('should check if entity has specific values', async () => {
      await alice.set({
        role: 'CEO',
        skills: ['leadership', 'strategy']
      });
      
      expect(await alice.has('role', 'CEO')).toBe(true);
      expect(await alice.has('role', 'CTO')).toBe(false);
      expect(await alice.has('skills', 'leadership')).toBe(true);
      expect(await alice.has('skills', 'coding')).toBe(false);
    });
  });
  
  describe('Time travel', () => {
    beforeEach(async () => {
      await alice.set({ role: 'junior' }, '2020-01-01');
      await alice.set({ role: 'senior' }, '2022-01-01');
      await alice.set({ role: 'manager' }, '2024-01-01');
    });
    
    it('should get state at specific time', async () => {
      const state2020 = await alice.get('2020-06-01');
      expect(state2020.role).toBe('junior');
      
      const state2022 = await alice.get('2022-06-01');
      expect(state2022.role).toBe('senior');
      
      const state2024 = await alice.get('2024-06-01');
      expect(state2024.role).toBe('manager');
    });
    
    it('should use asOf for time travel', async () => {
      const alice2020 = alice.asOf('2020-06-01');
      const role = await alice2020.get('role');
      expect(role).toBe('junior');
      
      const alice2024 = alice.asOf('2024-06-01');
      const fullState = await alice2024.get();
      expect(fullState.role).toBe('manager');
    });
    
    it('should compute diff between time periods', async () => {
      await alice.set({ location: 'Tokyo' }, '2021-01-01');
      await alice.set({ location: 'San Francisco' }, '2023-01-01');
      
      const diff = await alice.diff('2020-06-01', '2024-06-01');
      
      expect(diff.changed.role).toEqual(['junior', 'manager']);
      expect(diff.added.location).toBe('San Francisco');
    });
  });
  
  describe('Timeline', () => {
    it('should get entity timeline', async () => {
      await alice.update('joined company', '2020-01-01');
      await alice.update('became team lead', '2022-01-01');
      await alice.update('became director', '2024-01-01');
      
      const timeline = await alice.timeline();
      
      expect(timeline).toHaveLength(3);
      expect(timeline[0]).toEqual({
        date: '2020-01-01',
        event: 'joined company'
      });
      expect(timeline[2]).toEqual({
        date: '2024-01-01',
        event: 'became director'
      });
    });
  });
  
  describe('TemporalDB', () => {
    it('should manage multiple entities', async () => {
      const bob = db.entity('bob');
      const charlie = db.entity('charlie');
      
      await alice.set({ role: 'CEO' });
      await bob.set({ role: 'CTO' });
      await charlie.set({ role: 'CFO' });
      
      const aliceState = await alice.current;
      const bobState = await bob.current;
      const charlieState = await charlie.current;
      
      expect(aliceState.role).toBe('CEO');
      expect(bobState.role).toBe('CTO');
      expect(charlieState.role).toBe('CFO');
    });
    
    it('should take snapshots', async () => {
      const bob = db.entity('bob');
      
      await alice.set({ role: 'manager' }, '2022-01-01');
      await bob.set({ role: 'developer' }, '2022-01-01');
      
      await alice.set({ role: 'director' }, '2024-01-01');
      await bob.set({ role: 'team lead' }, '2024-01-01');
      
      const snapshot2022 = await db.snapshot('2022-06-01', ['alice', 'bob']);
      expect(snapshot2022.alice.role).toBe('manager');
      expect(snapshot2022.bob.role).toBe('developer');
      
      const snapshot2024 = await db.snapshot('2024-06-01', ['alice', 'bob']);
      expect(snapshot2024.alice.role).toBe('director');
      expect(snapshot2024.bob.role).toBe('team lead');
    });
    
    it('should query entities by state', async () => {
      const bob = db.entity('bob');
      const charlie = db.entity('charlie');
      const dave = db.entity('dave');
      
      // Set up test data
      await alice.set({ role: 'manager', location: 'Tokyo' }, '2022-01-01');
      await bob.set({ role: 'engineer', location: 'Tokyo' }, '2022-01-01');
      await charlie.set({ role: 'engineer', location: 'London' }, '2022-01-01');
      await dave.set({ role: 'manager', location: 'London' }, '2022-01-01');
      
      // Query all managers
      const managers = await db.query({ role: 'manager' }, '2022-06-01');
      expect(managers).toHaveLength(2);
      expect(managers).toContain('alice');
      expect(managers).toContain('dave');
      
      // Query engineers in Tokyo
      const tokyoEngineers = await db.query(
        { role: 'engineer', location: 'Tokyo' },
        '2022-06-01'
      );
      expect(tokyoEngineers).toHaveLength(1);
      expect(tokyoEngineers).toContain('bob');
      
      // Query everyone in London
      const londonTeam = await db.query({ location: 'London' }, '2022-06-01');
      expect(londonTeam).toHaveLength(2);
      expect(londonTeam).toContain('charlie');
      expect(londonTeam).toContain('dave');
      
      // Update roles and query again
      await bob.set({ role: 'manager' }, '2023-01-01');
      await charlie.set({ location: 'Tokyo' }, '2023-01-01');
      
      // Query managers in 2023
      const managers2023 = await db.query({ role: 'manager' }, '2023-06-01');
      expect(managers2023).toHaveLength(3);
      expect(managers2023).toContain('alice');
      expect(managers2023).toContain('bob');
      expect(managers2023).toContain('dave');
      
      // Query Tokyo team in 2023
      const tokyoTeam2023 = await db.query({ location: 'Tokyo' }, '2023-06-01');
      expect(tokyoTeam2023).toHaveLength(3);
      expect(tokyoTeam2023).toContain('alice');
      expect(tokyoTeam2023).toContain('bob');
      expect(tokyoTeam2023).toContain('charlie');
    });
    
    it('should handle OR conditions in query', async () => {
      const bob = db.entity('bob');
      const charlie = db.entity('charlie');
      
      await alice.set({ role: 'CEO' }, '2022-01-01');
      await bob.set({ role: 'CTO' }, '2022-01-01');
      await charlie.set({ role: 'engineer' }, '2022-01-01');
      
      // Query for CEO OR CTO
      const cLevelExecs = await db.query(
        { role: ['CEO', 'CTO'] },
        '2022-06-01'
      );
      expect(cLevelExecs).toHaveLength(2);
      expect(cLevelExecs).toContain('alice');
      expect(cLevelExecs).toContain('bob');
    });
  });
  
  describe('Custom mappings', () => {
    it('should use custom verb mappings', async () => {
      // Create medical domain database with custom mappings
      const medicalDB = createTemporalDB(memory, {
        verbMappings: {
          symptom: 'became',  // Will create became_feels event
          medication: 'became',  // Will create became_takes event
          diagnosis: 'became'  // Will create became_has_diagnosis event
        },
        fluentMappings: {
          symptom: 'feels',
          medication: 'takes',
          diagnosis: 'has_diagnosis'
        }
      });
      
      const patient = medicalDB.entity('john');
      
      // Set symptoms and medication using custom mappings
      await patient.set({
        symptom: 'headache',
        medication: 'aspirin',
        diagnosis: 'migraine'
      }, '2025-01-10');
      
      // Verify the state
      const state = await patient.get('2025-01-15');
      
      // The reverse mappings should map fluents back to properties
      expect(state.symptom).toBe('headache');
      expect(state.medication).toBe('aspirin');
      expect(state.diagnosis).toBe('migraine');
    });
    
    it('should handle custom domain queries', async () => {
      const educationDB = createTemporalDB(memory, {
        verbMappings: {
          course: 'enrolled_in',
          grade: 'received'
        },
        fluentMappings: {
          course: 'studying',
          grade: 'has_grade'
        }
      });
      
      const alice = educationDB.entity('alice');
      const bob = educationDB.entity('bob');
      
      await alice.set({ course: 'Physics', grade: 'A' }, '2025-01-01');
      await bob.set({ course: 'Chemistry', grade: 'B' }, '2025-01-01');
      
      // Query students in Physics course
      const physicsStudents = await educationDB.query(
        { studying: 'Physics' },
        '2025-01-15'
      );
      
      expect(physicsStudents).toContain('alice');
      expect(physicsStudents).not.toContain('bob');
    });
  });
  
  describe('Complex scenarios', () => {
    it('should handle career progression', async () => {
      // Career path
      await alice.update('joined as intern', '2019-06-01');
      await alice.update('became junior developer', '2020-01-01');
      await alice.update('learned React', '2020-03-01');
      await alice.update('learned TypeScript', '2020-06-01');
      await alice.update('became senior developer', '2022-01-01');
      await alice.update('learned system design', '2022-06-01');
      await alice.update('became tech lead', '2024-01-01');
      
      // Check progression
      const junior = await alice.asOf('2020-06-01').get();
      expect(junior.role).toBe('junior developer');
      expect(junior.knows).toEqual(expect.arrayContaining(['React', 'TypeScript']));
      
      const senior = await alice.asOf('2022-06-01').get();
      expect(senior.role).toBe('senior developer');
      expect(senior.knows).toEqual(expect.arrayContaining(['React', 'TypeScript', 'system design']));
      
      const current = await alice.current;
      expect(current.role).toBe('tech lead');
      
      // Timeline should show career progression
      const timeline = await alice.timeline();
      expect(timeline.length).toBeGreaterThan(5);
    });
    
    it('should handle location changes', async () => {
      await alice.set({ location: 'Tokyo' }, '2020-01-01');
      await alice.set({ location: 'London' }, '2022-01-01');
      await alice.set({ location: 'San Francisco' }, '2024-01-01');
      
      // Check location at different times
      expect(await alice.asOf('2020-06-01').get('location')).toBe('Tokyo');
      expect(await alice.asOf('2022-06-01').get('location')).toBe('London');
      expect(await alice.asOf('2024-06-01').get('location')).toBe('San Francisco');
    });
  });
});