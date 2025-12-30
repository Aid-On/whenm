/**
 * Basic Usage Example
 * Demonstrates the core functionality of WhenM Event Calculus
 */

import { createWhenMEngine } from '@aid-on/whenm';

async function basicExample() {
  // Create a new WhenM engine instance
  const engine = await createWhenMEngine();

  console.log('=== Basic WhenM Usage Example ===\n');

  // Record events with timestamps
  console.log('Recording events...');
  
  await engine.record('user learned Python', '2024-01-01');
  await engine.record('user joined chess club', '2024-02-01');
  await engine.record('user moved to Tokyo', '2024-03-01');
  await engine.record('user started learning Japanese', '2024-04-01');
  await engine.record('user quit chess club', '2024-06-01');
  await engine.record('user finished learning Japanese', '2024-08-01');
  await engine.record('user moved to Osaka', '2024-09-01');

  // Query current state
  console.log('\n--- Querying Current State (2024-10-01) ---');
  
  const result1 = await engine.ask('Does user know Python?', '2024-10-01');
  console.log('Knows Python?', result1.answer); // true

  const result2 = await engine.ask('Is user a member of chess club?', '2024-10-01');
  console.log('Member of chess club?', result2.answer); // false (quit in June)

  const result3 = await engine.ask('Where does user live?', '2024-10-01');
  console.log('Current location:', result3.answer); // Osaka

  const result4 = await engine.ask('Does user know Japanese?', '2024-10-01');
  console.log('Knows Japanese?', result4.answer); // true (finished learning)

  // Query historical state
  console.log('\n--- Querying Historical State ---');
  
  const past1 = await engine.ask('Was user a member of chess club?', '2024-04-01');
  console.log('Chess club member in April?', past1.answer); // true

  const past2 = await engine.ask('Where did user live?', '2024-05-01');
  console.log('Location in May:', past2.answer); // Tokyo

  const past3 = await engine.ask('Was user learning Japanese?', '2024-05-01');
  console.log('Learning Japanese in May?', past3.answer); // true

  // Get all facts at a specific time
  console.log('\n--- All Facts at 2024-05-01 ---');
  const facts = await engine.getAllFacts('2024-05-01');
  console.log('Active facts:', facts);

  // Cleanup
  await engine.destroy();
}

// Run the example
basicExample().catch(console.error);