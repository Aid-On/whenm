#!/usr/bin/env node

import { createEngine } from '../../dist/index.js';

async function test() {
  console.log('=== Direct Prolog Test ===\n');
  
  const engine = await createEngine();
  
  // Load a simple fact
  console.log('1. Loading simple fact...');
  await engine.loadFacts(`
    test_fact(hello, world).
  `);
  
  console.log('2. Query test fact...');
  const result = await engine.query(`test_fact(X, Y).`);
  console.log('Result:', result);
  
  // Test assertEvent
  console.log('\n3. Using assertEvent...');
  await engine.assertEvent('test_event("alice", "action")', '2024-01-01');
  
  console.log('4. Query events...');
  const events = await engine.query(`event_at(_, _).`);
  console.log('Events:', events);
  
  // Test happens
  console.log('\n5. Loading Event Calculus rules...');
  await engine.loadFacts(`
    happens(Event, T) :- event_at(Event, T).
    simple_state(alice, ceo).
  `);
  
  console.log('6. Query simple state...');
  const state = await engine.query(`simple_state(X, Y).`);
  console.log('State:', state);
  
  console.log('\n7. Query happens...');
  const happens = await engine.query(`happens(Event, Date).`);
  console.log('Happens:', happens);
}

test().catch(console.error);