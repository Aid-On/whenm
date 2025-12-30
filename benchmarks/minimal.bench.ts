/**
 * Minimal benchmark to test Groq performance
 */

import { describe, bench } from 'vitest';
import { createGroqEngine, createMockEngine } from '../src/index';

describe('Minimal Groq Test', () => {
  bench('Mock: Single event', async () => {
    const engine = await createMockEngine();
    await engine.remember('user learned python', '2024-01-01');
  }, { iterations: 3 });

  bench('Groq: Single event', async () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log('Skipping Groq benchmark - GROQ_API_KEY not set');
      return;
    }
    const engine = await createGroqEngine(apiKey, 'llama-3.3-70b-versatile');
    await engine.remember('user learned python', '2024-01-01');
  }, { iterations: 1, timeout: 30000 });

  bench('Mock: Query', async () => {
    const engine = await createMockEngine();
    await engine.remember('user learned python', '2024-01-01');
    await engine.ask('Does user know python?', '2024-06-01');
  }, { iterations: 3 });

  bench('Groq: Query', async () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log('Skipping Groq benchmark - GROQ_API_KEY not set');
      return;
    }
    const engine = await createGroqEngine(apiKey, 'llama-3.3-70b-versatile');
    await engine.remember('user learned python', '2024-01-01');
    await engine.ask('Does user know python?', '2024-06-01');
  }, { iterations: 1, timeout: 30000 });
});