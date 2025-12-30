/**
 * Event Calculus Performance Benchmarks
 * Measures core Prolog operations performance
 */

import { describe, bench } from 'vitest';
import { createMockEngine } from '../src/index';

describe('Event Calculus Performance', () => {
  bench('Single event insertion', async () => {
    const engine = await createMockEngine();
    await engine.remember('user learned python', '2024-01-01');
    // cleanup not needed with mock engine
  });

  bench('100 events insertion', async () => {
    const engine = await createMockEngine();
    for (let i = 0; i < 100; i++) {
      await engine.remember(`user learned skill_${i}`, `2024-01-${String(i % 28 + 1).padStart(2, '0')}`);
    }
    // cleanup not needed with mock engine
  });

  bench('Single fluent query', async () => {
    const engine = await createMockEngine();
    await engine.remember('user learned python', '2024-01-01');
    await engine.ask('Does user know python?', '2024-06-01');
    // cleanup not needed with mock engine
  });

  bench('Query with 100 events', async () => {
    const engine = await createMockEngine();
    
    // Setup: Add 100 events
    for (let i = 0; i < 100; i++) {
      await engine.remember(`user learned skill_${i}`, `2024-01-${String(i % 28 + 1).padStart(2, '0')}`);
    }
    
    // Benchmark: Query all holding fluents
    await engine.ask('all_holding("2024-06-01", Fluents)');
    
    // cleanup not needed with mock engine
  });

  bench('Complex timeline query', async () => {
    const engine = await createMockEngine();
    
    // Setup: Create complex timeline
    await engine.remember('user joined company_a', '2024-01-01');
    await engine.remember('user learned python', '2024-02-01');
    await engine.remember('user became developer', '2024-03-01');
    await engine.remember('user left company_a', '2024-06-01');
    await engine.remember('user joined company_b', '2024-07-01');
    await engine.remember('user became tech_lead', '2024-08-01');
    
    // Benchmark: Multiple queries
    await engine.ask('Is user member of company_b?', '2024-09-01');
    await engine.ask('Is user role tech_lead?', '2024-09-01');
    await engine.ask('Does user know python?', '2024-09-01');
    
    // cleanup not needed with mock engine
  });

  bench('Termination checking (clipped)', async () => {
    const engine = await createMockEngine();
    
    // Setup: Events with terminations
    for (let i = 0; i < 50; i++) {
      await engine.remember(`user joined club_${i}`, `2024-01-${String(i % 28 + 1).padStart(2, '0')}`);
      await engine.remember(`user quit club_${i}`, `2024-06-${String(i % 28 + 1).padStart(2, '0')}`);
    }
    
    // Benchmark: Check terminated fluents
    await engine.ask('Is user member of club_25?', '2024-08-01');
    
    // cleanup not needed with mock engine
  });

  bench('Singular fluent replacement', async () => {
    const engine = await createMockEngine();
    
    // Benchmark: Multiple role changes
    for (let i = 0; i < 10; i++) {
      await engine.remember(`user became role_${i}`, `2024-0${i + 1}-01`);
    }
    
    await engine.ask('Is user role_9?', '2024-12-01');
    
    // cleanup not needed with mock engine
  });
});