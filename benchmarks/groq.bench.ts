/**
 * Groq LLM Performance Benchmarks
 * Smaller scale for testing with real API calls
 */

import { describe, bench } from 'vitest';
import { createGroqEngine, createMockEngine } from '../src/index';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Groq LLM Performance', () => {
  const createEngine = async () => {
    if (process.env.GROQ_API_KEY && process.env.LLM_PROVIDER !== 'mock') {
      return createGroqEngine(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile');
    }
    return createMockEngine();
  };

  bench('Single event insertion', async () => {
    const engine = await createEngine();
    await engine.remember('user learned python', '2024-01-01');
  }, { iterations: 2, timeout: 30000 });

  bench('5 events batch', async () => {
    const engine = await createEngine();
    for (let i = 0; i < 5; i++) {
      await engine.remember(`user learned skill_${i}`, `2024-01-0${i + 1}`);
    }
  }, { iterations: 1, timeout: 60000 });

  bench('Simple query', async () => {
    const engine = await createEngine();
    await engine.remember('user learned python', '2024-01-01');
    await engine.ask('Does user know python?', '2024-06-01');
  }, { iterations: 2, timeout: 30000 });

  bench('Complex state query', async () => {
    const engine = await createEngine();

    await engine.remember('user learned Python', '2024-01-01');
    await engine.remember('user joined company as developer', '2024-02-01');
    await engine.remember('user moved to Tokyo', '2024-03-01');

    await engine.ask('What is user\'s role and where do they live?', '2024-07-01');
  }, { iterations: 1, timeout: 60000 });

  bench('Historical query', async () => {
    const engine = await createEngine();
    
    await engine.remember('user joined CompanyA', '2024-01-01');
    await engine.remember('user left CompanyA', '2024-06-01');
    await engine.remember('user joined CompanyB', '2024-07-01');
    
    await engine.ask('Where did user work in March?', '2024-03-01');
    await engine.ask('Where does user work now?', '2024-08-01');
  }, { iterations: 1, timeout: 60000 });

  bench('10 events with queries', async () => {
    const engine = await createEngine();
    
    // Add 10 different facts
    const events = [
      'user learned Python',
      'user joined chess club',
      'user moved to Tokyo',
      'user bought a car',
      'user started learning Japanese',
      'user became senior developer',
      'user got married',
      'user adopted a cat',
      'user started a blog',
      'user quit chess club'
    ];
    
    for (let i = 0; i < events.length; i++) {
      await engine.remember(events[i], `2024-0${(i % 9) + 1}-${String(i + 10).padStart(2, '0')}`);
    }
    
    // Query state
    await engine.ask('What does user know?', '2024-12-01');
    await engine.ask('Where does user live?', '2024-12-01');
  }, { iterations: 1, timeout: 120000 });
});

describe('Groq vs Mock Comparison', () => {
  bench('Mock: 20 events', async () => {
    const engine = await createMockEngine();
    for (let i = 0; i < 20; i++) {
      await engine.remember(`event_${i} happened`, `2024-01-${String(i + 1).padStart(2, '0')}`);
    }
  }, { iterations: 5 });

  bench('Groq: 5 events', async () => {
    if (!process.env.GROQ_API_KEY) {
      const engine = await createMockEngine();
      for (let i = 0; i < 5; i++) {
        await engine.remember(`event_${i} happened`, `2024-01-0${i + 1}`);
      }
    } else {
      const engine = await createGroqEngine(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile');
      for (let i = 0; i < 5; i++) {
        await engine.remember(`event_${i} happened`, `2024-01-0${i + 1}`);
      }
    }
  }, { iterations: 1, timeout: 60000 });
});