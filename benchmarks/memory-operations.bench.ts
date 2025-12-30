/**
 * Memory Operations Performance Benchmarks
 * Tests high-level memory API performance
 */

import { describe, bench } from 'vitest';
import { createMockEngine } from '../src/index';

describe('Memory Operations Performance', () => {
  bench('Simple record operation', async () => {
    const engine = await createMockEngine();
    await engine.remember('user learned Python', '2024-01-01');
    // cleanup
  });

  bench('Batch record (10 events)', async () => {
    const engine = await createMockEngine();
    const events = [
      'user learned Python',
      'user joined chess club', 
      'user moved to Tokyo',
      'user started learning Japanese',
      'user bought a car',
      'user became senior developer',
      'user got married to Alice',
      'user adopted a cat',
      'user started a blog',
      'user published an article'
    ];
    
    for (const event of events) {
      await engine.remember(event, '2024-01-01');
    }
    
    // cleanup
  });

  bench('Simple ask query', async () => {
    const engine = await createMockEngine();
    await engine.remember('user learned Python', '2024-01-01');
    await engine.ask('Does user know Python?', '2024-06-01');
    // cleanup
  });

  bench('Complex state query', async () => {
    const engine = await createMockEngine();
    
    // Setup
    await engine.remember('user learned Python', '2024-01-01');
    await engine.remember('user joined company as developer', '2024-02-01');
    await engine.remember('user moved to Tokyo', '2024-03-01');
    await engine.remember('user got promoted to senior', '2024-06-01');
    
    // Benchmark
    await engine.ask('What is user\'s current role and location?', '2024-07-01');
    
    // cleanup
  });

  bench('Historical query', async () => {
    const engine = await createMockEngine();
    
    // Setup timeline
    await engine.remember('user joined CompanyA', '2024-01-01');
    await engine.remember('user left CompanyA', '2024-06-01');
    await engine.remember('user joined CompanyB', '2024-07-01');
    
    // Benchmark historical queries
    await engine.ask('Where did user work?', '2024-03-01');
    await engine.ask('Where did user work?', '2024-08-01');
    
    // cleanup
  });

  bench('getAllFacts with 50 active fluents', async () => {
    const engine = await createMockEngine();
    
    // Setup: Create 50 different facts
    for (let i = 0; i < 50; i++) {
      if (i % 3 === 0) {
        await engine.remember(`user learned skill_${i}`, '2024-01-01');
      } else if (i % 3 === 1) {
        await engine.remember(`user bought item_${i}`, '2024-01-01');
      } else {
        await engine.remember(`user joined group_${i}`, '2024-01-01');
      }
    }
    
    // Benchmark
    await engine.ask('What skills and groups does user have?', '2024-06-01');
    
    // cleanup
  });

  bench('Mixed operations sequence', async () => {
    const engine = await createMockEngine();
    
    // Typical usage pattern
    await engine.remember('user started at Google', '2024-01-01');
    await engine.ask('Where does user work?', '2024-02-01');
    await engine.remember('user learned Go', '2024-03-01');
    await engine.ask('What skills does user have?', '2024-04-01');
    await engine.remember('user got promoted', '2024-05-01');
    await engine.ask('2024-06-01');
    
    // cleanup
  });
});