/**
 * Basic Usage Example
 * Demonstrates the core functionality of WhenM Event Calculus
 */

import { createUnifiedEngine } from '../dist/index.js';

async function basicExample() {
  // Create a new WhenM engine instance
  const engine = await createUnifiedEngine();

  console.log('=== Basic WhenM Usage Example ===\n');

  // Record events with timestamps
  console.log('Recording events...');
  
  await engine.remember('user learned Python', '2024-01-01');
  await engine.remember('user joined chess club', '2024-02-01');
  await engine.remember('user moved to Tokyo', '2024-03-01');
  await engine.remember('user started learning Japanese', '2024-04-01');
  await engine.remember('user quit chess club', '2024-06-01');
  await engine.remember('user finished learning Japanese', '2024-08-01');
  await engine.remember('user moved to Osaka', '2024-09-01');

  // Query current state
  console.log('\n--- Querying Current State (2024-10-01) ---');
  
  const result1 = await engine.ask('Does user know Python?', '2024-10-01');
  console.log('Knows Python?', result1); // true

  const result2 = await engine.ask('Is user a member of chess club?', '2024-10-01');
  console.log('Member of chess club?', result2); // false (quit in June)

  const result3 = await engine.ask('Where does user live?', '2024-10-01');
  console.log('Current location:', result3); // Osaka

  const result4 = await engine.ask('Does user know Japanese?', '2024-10-01');
  console.log('Knows Japanese?', result4); // true (finished learning)

  // Query historical state
  console.log('\n--- Querying Historical State ---');
  
  const past1 = await engine.ask('Was user a member of chess club?', '2024-04-01');
  console.log('Chess club member in April?', past1); // true

  const past2 = await engine.ask('Where did user live?', '2024-05-01');
  console.log('Location in May:', past2); // Tokyo

  const past3 = await engine.ask('Was user learning Japanese?', '2024-05-01');
  console.log('Learning Japanese in May?', past3); // true

  // Query all facts (simplified)
  console.log('\n--- State Check at 2024-05-01 ---');
  const state = await engine.ask('What does user know and where do they live?', '2024-05-01');
  console.log('State:', state);
}

// Run the example
basicExample().catch(console.error);