#!/usr/bin/env node

import { createUnifiedEngine } from '../../dist/final-engine.js';

async function test() {
  console.log('=== Deep Debug Test ===\n');
  
  // Create with debug
  const engine = await createUnifiedEngine({ debug: true });
  
  // Test manual prolog
  const whenm = engine.engine;
  
  // Load a simple event directly
  console.log('1. Loading event directly to Prolog...');
  await whenm.loadFacts(`
    event_at(event("alice", "became", "ceo"), "2024-01-01").
  `);
  
  // Query directly
  console.log('2. Query for event...');
  const events = await whenm.query(`event_at(Event, Date).`);
  console.log('Events found:', events);
  
  console.log('\n3. Query for happens...');
  const happens = await whenm.query(`happens(Event, "2024-01-01").`);
  console.log('Happens:', happens);
  
  console.log('\n4. Query for initiates...');
  const initiates = await whenm.query(`initiates(event("alice", "became", "ceo"), Fluent, _).`);
  console.log('Initiates:', initiates);
  
  console.log('\n5. Query for holds_at...');
  const holds = await whenm.query(`holds_at(state("alice", "became", "ceo"), "2024-06-01").`);
  console.log('Holds at:', holds);
  
  // Now through the API
  console.log('\n6. Through unified API...');
  await engine.remember("Bob became CTO", "2024-01-01");
  
  console.log('\n7. Query Bob...');
  const bobEvents = await whenm.query(`event_at(event("bob", _, _), _).`);
  console.log('Bob events:', bobEvents);
  
  const role = await engine.ask("What is Bob's role?");
  console.log('Bob role:', role);
}

test().catch(console.error);