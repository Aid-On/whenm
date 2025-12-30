/**
 * Scale Testing Benchmarks
 * Tests performance with large datasets
 */

import { describe, bench } from 'vitest';
import { createUnifiedEngine } from '../src/index';

describe('Scale Testing', () => {
  bench('Insert 1000 events', async () => {
    const engine = await createUnifiedEngine();
    
    for (let i = 0; i < 1000; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      const month = String((i % 12) + 1).padStart(2, '0');
      await engine.remember(
        `user learned skill_${i}`,
        `2024-${month}-${day}`
      );
    }
    
    await // cleanup;
  }, { timeout: 30000 });

  bench('Query with 500 events (no terminations)', async () => {
    const engine = await createUnifiedEngine();
    
    // Setup
    for (let i = 0; i < 500; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      await engine.remember(`user learned skill_${i}`, `2024-01-${day}`);
    }
    
    // Benchmark query
    await engine.ask('What are all the facts?', '2024-12-01');
    
    await // cleanup;
  }, { timeout: 20000 });

  bench('Query with 500 events (with terminations)', async () => {
    const engine = await createUnifiedEngine();
    
    // Setup: Half events are terminated
    for (let i = 0; i < 250; i++) {
      await engine.remember(`user joined club_${i}`, `2024-01-01`);
      await engine.remember(`user quit club_${i}`, `2024-06-01`);
    }
    for (let i = 250; i < 500; i++) {
      await engine.remember(`user learned skill_${i}`, `2024-01-01`);
    }
    
    // Benchmark query
    await engine.ask('What are all the facts?', '2024-12-01');
    
    await // cleanup;
  }, { timeout: 20000 });

  bench('Complex query on 1000 events', async () => {
    const engine = await createUnifiedEngine();
    
    // Setup: Mix of different event types
    for (let i = 0; i < 1000; i++) {
      const eventType = i % 5;
      const day = String((i % 28) + 1).padStart(2, '0');
      
      switch (eventType) {
        case 0:
          await engine.remember(`user_${i % 10} learned skill_${i}`, `2024-01-${day}`);
          break;
        case 1:
          await engine.remember(`user_${i % 10} joined group_${i}`, `2024-02-${day}`);
          break;
        case 2:
          await engine.remember(`user_${i % 10} bought item_${i}`, `2024-03-${day}`);
          break;
        case 3:
          await engine.remember(`user_${i % 10} moved to city_${i}`, `2024-04-${day}`);
          break;
        case 4:
          await engine.remember(`user_${i % 10} became role_${i}`, `2024-05-${day}`);
          break;
      }
    }
    
    // Benchmark: Query specific user's state
    await engine.ask('Does user_5 know skill_5?', '2024-12-01');
    await engine.ask('Is user_5 member of group_51?', '2024-12-01');;
    
    await // cleanup;
  }, { timeout: 30000 });

  bench('Point-in-time query (100 events)', async () => {
    const engine = await createUnifiedEngine();
    
    // Setup timeline with various events
    for (let i = 0; i < 100; i++) {
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String((i % 28) + 1).padStart(2, '0');
      
      if (i % 2 === 0) {
        await engine.remember(`event_${i} happened`, `2024-${month}-${day}`);
      } else {
        await engine.remember(`user learned skill_${i}`, `2024-${month}-${day}`);
      }
    }
    
    // Benchmark: Get all facts at specific time
    await engine.ask('What are all facts?', '2024-06-15');;
    
    await // cleanup;
  });

  bench('Timeline traversal (past to present)', async () => {
    const engine = await createUnifiedEngine();
    
    // Setup: Create events throughout the year
    const events = [
      { type: 'user joined company', date: '2024-01-01' },
      { type: 'user learned python', date: '2024-02-01' },
      { type: 'user became developer', date: '2024-03-01' },
      { type: 'user moved to tokyo', date: '2024-04-01' },
      { type: 'user started project app', date: '2024-05-01' },
      { type: 'user became senior', date: '2024-06-01' },
      { type: 'user finished project app', date: '2024-07-01' },
      { type: 'user learned rust', date: '2024-08-01' },
      { type: 'user moved to osaka', date: '2024-09-01' },
      { type: 'user became lead', date: '2024-10-01' },
    ];
    
    for (const { type, date } of events) {
      await engine.remember(type, date);
    }
    
    // Benchmark: Query at multiple points in time
    const months = ['2024-03-15', '2024-06-15', '2024-09-15', '2024-12-15'];
    for (const date of months) {
      await engine.ask('What is the current state?', date);;
    }
    
    await // cleanup;
  });
});