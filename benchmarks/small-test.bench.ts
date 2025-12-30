/**
 * Small-scale benchmark for quick testing with Groq
 * Uses minimal iterations to test with real LLM
 */

import { describe, bench } from 'vitest';
import { createGroqEngine, createMockEngine } from '../src/index';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Small Scale Benchmark Test', () => {
  // Use Groq if API key is available, otherwise mock
  const createEngine = async () => {
    if (process.env.GROQ_API_KEY && process.env.LLM_PROVIDER !== 'mock') {
      console.log('Using Groq for benchmarks');
      return createGroqEngine(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile');
    }
    console.log('Using mock for benchmarks');
    return createMockEngine();
  };

  bench('Single event with Groq', async () => {
    const engine = await createEngine();
    await engine.remember('user learned python', '2024-01-01');
  }, { iterations: 1, timeout: 30000 });

  bench('3 events insertion', async () => {
    const engine = await createEngine();
    await engine.remember('user learned python', '2024-01-01');
    await engine.remember('user joined chess club', '2024-02-01');
    await engine.remember('user moved to tokyo', '2024-03-01');
  }, { iterations: 1, timeout: 30000 });

  bench('Simple query', async () => {
    const engine = await createEngine();
    await engine.remember('user learned python', '2024-01-01');
    await engine.ask('Does user know python?', '2024-06-01');
  }, { iterations: 1, timeout: 30000 });

  bench('Timeline query (5 events)', async () => {
    const engine = await createEngine();
    
    // Add 5 events
    await engine.remember('user joined company', '2024-01-01');
    await engine.remember('user learned python', '2024-02-01');
    await engine.remember('user became developer', '2024-03-01');
    await engine.remember('user left company', '2024-06-01');
    await engine.remember('user joined new company', '2024-07-01');
    
    // Query at different points
    await engine.ask('Where does user work?', '2024-04-01');
    await engine.ask('Where does user work?', '2024-08-01');
  }, { iterations: 1, timeout: 60000 });
});