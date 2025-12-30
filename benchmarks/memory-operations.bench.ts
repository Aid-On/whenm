/**
 * Memory Operations Performance Benchmarks
 * Tests high-level memory API performance
 */

import { describe, bench } from 'vitest';
import { createWhenMEngine } from '../src/index';

describe('Memory Operations Performance', () => {
  bench('Simple record operation', async () => {
    const engine = await createWhenMEngine();
    await engine.record('user learned Python', '2024-01-01');
    await engine.destroy();
  });

  bench('Batch record (10 events)', async () => {
    const engine = await createWhenMEngine();
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
      await engine.record(event, '2024-01-01');
    }
    
    await engine.destroy();
  });

  bench('Simple ask query', async () => {
    const engine = await createWhenMEngine();
    await engine.record('user learned Python', '2024-01-01');
    await engine.ask('Does user know Python?', '2024-06-01');
    await engine.destroy();
  });

  bench('Complex state query', async () => {
    const engine = await createWhenMEngine();
    
    // Setup
    await engine.record('user learned Python', '2024-01-01');
    await engine.record('user joined company as developer', '2024-02-01');
    await engine.record('user moved to Tokyo', '2024-03-01');
    await engine.record('user got promoted to senior', '2024-06-01');
    
    // Benchmark
    await engine.ask('What is user\'s current role and location?', '2024-07-01');
    
    await engine.destroy();
  });

  bench('Historical query', async () => {
    const engine = await createWhenMEngine();
    
    // Setup timeline
    await engine.record('user joined CompanyA', '2024-01-01');
    await engine.record('user left CompanyA', '2024-06-01');
    await engine.record('user joined CompanyB', '2024-07-01');
    
    // Benchmark historical queries
    await engine.ask('Where did user work?', '2024-03-01');
    await engine.ask('Where did user work?', '2024-08-01');
    
    await engine.destroy();
  });

  bench('getAllFacts with 50 active fluents', async () => {
    const engine = await createWhenMEngine();
    
    // Setup: Create 50 different facts
    for (let i = 0; i < 50; i++) {
      if (i % 3 === 0) {
        await engine.record(`user learned skill_${i}`, '2024-01-01');
      } else if (i % 3 === 1) {
        await engine.record(`user bought item_${i}`, '2024-01-01');
      } else {
        await engine.record(`user joined group_${i}`, '2024-01-01');
      }
    }
    
    // Benchmark
    await engine.getAllFacts('2024-06-01');
    
    await engine.destroy();
  });

  bench('Mixed operations sequence', async () => {
    const engine = await createWhenMEngine();
    
    // Typical usage pattern
    await engine.record('user started at Google', '2024-01-01');
    await engine.ask('Where does user work?', '2024-02-01');
    await engine.record('user learned Go', '2024-03-01');
    await engine.ask('What skills does user have?', '2024-04-01');
    await engine.record('user got promoted', '2024-05-01');
    await engine.getAllFacts('2024-06-01');
    
    await engine.destroy();
  });
});