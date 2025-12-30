#!/usr/bin/env node

/**
 * Debug Python query issue
 */

import { whenm } from '../../dist/whenm.js';

async function debugPython() {
  console.log('🔍 Debugging Python query issue\n');
  
  const memory = await whenm.auto();
  
  // Only Python-related events
  const events = [
    { text: "Alice learned Python", date: "2024-01-15" },
    { text: "Bob learned JavaScript", date: "2024-03-15" },  
    { text: "Diana learned Go", date: "2024-04-15" },
    { text: "Eve learned Python", date: "2024-05-15" }
  ];
  
  console.log('Loading events...');
  for (const {text, date} of events) {
    await memory.remember(text, date);
    console.log(`  ✓ ${text}`);
  }
  console.log();
  
  // Test queries
  console.log('Testing queries:');
  
  // 1. Get all events to see what's stored
  console.log('\n1. Testing with simple query first:');
  
  // 2. Who learned Python?
  console.log('\n2. Who learned Python?');
  const whoResult = await memory.nl("Who learned Python?");
  console.log('Result:', whoResult);
  console.log('Expected: ["alice", "eve"]');
  
  // 3. How many people learned Python?  
  console.log('\n3. How many people learned Python?');
  const countResult = await memory.nl("How many people learned Python?");
  console.log('Result:', countResult);
  console.log('Expected: { count: 2 }');
}

debugPython().catch(console.error);