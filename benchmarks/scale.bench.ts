/**
 * Scale Testing Benchmarks
 * Tests performance with large datasets
 */

import { describe, bench } from 'vitest';
import { createWhenMEngine } from '../src/index';

describe('Scale Testing', () => {
  bench('Insert 1000 events', async () => {
    const engine = await createWhenMEngine();
    
    for (let i = 0; i < 1000; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      const month = String((i % 12) + 1).padStart(2, '0');
      await engine.assertEvent(
        `learned(user, skill_${i})`,
        `2024-${month}-${day}`
      );
    }
    
    await engine.destroy();
  }, { timeout: 30000 });

  bench('Query with 500 events (no terminations)', async () => {
    const engine = await createWhenMEngine();
    
    // Setup
    for (let i = 0; i < 500; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      await engine.assertEvent(`learned(user, skill_${i})`, `2024-01-${day}`);
    }
    
    // Benchmark query
    await engine.queryProlog('all_holding("2024-12-01", Fluents)');
    
    await engine.destroy();
  }, { timeout: 20000 });

  bench('Query with 500 events (with terminations)', async () => {
    const engine = await createWhenMEngine();
    
    // Setup: Half events are terminated
    for (let i = 0; i < 250; i++) {
      await engine.assertEvent(`joined(user, club_${i})`, `2024-01-01`);
      await engine.assertEvent(`quit(user, club_${i})`, `2024-06-01`);
    }
    for (let i = 250; i < 500; i++) {
      await engine.assertEvent(`learned(user, skill_${i})`, `2024-01-01`);
    }
    
    // Benchmark query
    await engine.queryProlog('all_holding("2024-12-01", Fluents)');
    
    await engine.destroy();
  }, { timeout: 20000 });

  bench('Complex query on 1000 events', async () => {
    const engine = await createWhenMEngine();
    
    // Setup: Mix of different event types
    for (let i = 0; i < 1000; i++) {
      const eventType = i % 5;
      const day = String((i % 28) + 1).padStart(2, '0');
      
      switch (eventType) {
        case 0:
          await engine.assertEvent(`learned(user_${i % 10}, skill_${i})`, `2024-01-${day}`);
          break;
        case 1:
          await engine.assertEvent(`joined(user_${i % 10}, group_${i})`, `2024-02-${day}`);
          break;
        case 2:
          await engine.assertEvent(`bought(user_${i % 10}, item_${i})`, `2024-03-${day}`);
          break;
        case 3:
          await engine.assertEvent(`moved_to(user_${i % 10}, city_${i})`, `2024-04-${day}`);
          break;
        case 4:
          await engine.assertEvent(`became_role(user_${i % 10}, role_${i})`, `2024-05-${day}`);
          break;
      }
    }
    
    // Benchmark: Query specific user's state
    await engine.queryProlog('holds_at(knows(user_5, skill_5), "2024-12-01")');
    await engine.queryProlog('holds_at(member_of(user_5, group_51), "2024-12-01")');
    
    await engine.destroy();
  }, { timeout: 30000 });

  bench('Point-in-time query (100 events)', async () => {
    const engine = await createWhenMEngine();
    
    // Setup timeline with various events
    for (let i = 0; i < 100; i++) {
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String((i % 28) + 1).padStart(2, '0');
      
      if (i % 2 === 0) {
        await engine.assertEvent(`happened(event_${i})`, `2024-${month}-${day}`);
      } else {
        await engine.assertEvent(`learned(user, skill_${i})`, `2024-${month}-${day}`);
      }
    }
    
    // Benchmark: Get all facts at specific time
    await engine.queryProlog('all_holding("2024-06-15", Fluents)');
    
    await engine.destroy();
  });

  bench('Timeline traversal (past to present)', async () => {
    const engine = await createWhenMEngine();
    
    // Setup: Create events throughout the year
    const events = [
      { type: 'joined(user, company)', date: '2024-01-01' },
      { type: 'learned(user, python)', date: '2024-02-01' },
      { type: 'became_role(user, developer)', date: '2024-03-01' },
      { type: 'moved_to(user, tokyo)', date: '2024-04-01' },
      { type: 'started_project(user, app)', date: '2024-05-01' },
      { type: 'became_role(user, senior)', date: '2024-06-01' },
      { type: 'finished_project(user, app)', date: '2024-07-01' },
      { type: 'learned(user, rust)', date: '2024-08-01' },
      { type: 'moved_to(user, osaka)', date: '2024-09-01' },
      { type: 'became_role(user, lead)', date: '2024-10-01' },
    ];
    
    for (const { type, date } of events) {
      await engine.assertEvent(type, date);
    }
    
    // Benchmark: Query at multiple points in time
    const months = ['2024-03-15', '2024-06-15', '2024-09-15', '2024-12-15'];
    for (const date of months) {
      await engine.queryProlog(`all_holding("${date}", Fluents)`);
    }
    
    await engine.destroy();
  });
});