/**
 * Event Calculus Performance Benchmarks
 * Measures core Prolog operations performance
 */

import { describe, bench } from 'vitest';
import { createWhenMEngine } from '../src/index';

describe('Event Calculus Performance', () => {
  bench('Single event insertion', async () => {
    const engine = await createWhenMEngine();
    await engine.assertEvent('learned(user, python)', '2024-01-01');
    await engine.destroy();
  });

  bench('100 events insertion', async () => {
    const engine = await createWhenMEngine();
    for (let i = 0; i < 100; i++) {
      await engine.assertEvent(`learned(user, skill_${i})`, `2024-01-${String(i % 28 + 1).padStart(2, '0')}`);
    }
    await engine.destroy();
  });

  bench('Single fluent query', async () => {
    const engine = await createWhenMEngine();
    await engine.assertEvent('learned(user, python)', '2024-01-01');
    await engine.queryProlog('holds_at(knows(user, python), "2024-06-01")');
    await engine.destroy();
  });

  bench('Query with 100 events', async () => {
    const engine = await createWhenMEngine();
    
    // Setup: Add 100 events
    for (let i = 0; i < 100; i++) {
      await engine.assertEvent(`learned(user, skill_${i})`, `2024-01-${String(i % 28 + 1).padStart(2, '0')}`);
    }
    
    // Benchmark: Query all holding fluents
    await engine.queryProlog('all_holding("2024-06-01", Fluents)');
    
    await engine.destroy();
  });

  bench('Complex timeline query', async () => {
    const engine = await createWhenMEngine();
    
    // Setup: Create complex timeline
    await engine.assertEvent('joined(user, company_a)', '2024-01-01');
    await engine.assertEvent('learned(user, python)', '2024-02-01');
    await engine.assertEvent('became_role(user, developer)', '2024-03-01');
    await engine.assertEvent('left(user, company_a)', '2024-06-01');
    await engine.assertEvent('joined(user, company_b)', '2024-07-01');
    await engine.assertEvent('became_role(user, tech_lead)', '2024-08-01');
    
    // Benchmark: Multiple queries
    await engine.queryProlog('holds_at(member_of(user, company_b), "2024-09-01")');
    await engine.queryProlog('holds_at(role(user, tech_lead), "2024-09-01")');
    await engine.queryProlog('holds_at(knows(user, python), "2024-09-01")');
    
    await engine.destroy();
  });

  bench('Termination checking (clipped)', async () => {
    const engine = await createWhenMEngine();
    
    // Setup: Events with terminations
    for (let i = 0; i < 50; i++) {
      await engine.assertEvent(`joined(user, club_${i})`, `2024-01-${String(i % 28 + 1).padStart(2, '0')}`);
      await engine.assertEvent(`quit(user, club_${i})`, `2024-06-${String(i % 28 + 1).padStart(2, '0')}`);
    }
    
    // Benchmark: Check terminated fluents
    await engine.queryProlog('holds_at(member_of(user, club_25), "2024-08-01")');
    
    await engine.destroy();
  });

  bench('Singular fluent replacement', async () => {
    const engine = await createWhenMEngine();
    
    // Benchmark: Multiple role changes
    for (let i = 0; i < 10; i++) {
      await engine.assertEvent(`became_role(user, role_${i})`, `2024-0${i + 1}-01`);
    }
    
    await engine.queryProlog('holds_at(role(user, role_9), "2024-12-01")');
    
    await engine.destroy();
  });
});