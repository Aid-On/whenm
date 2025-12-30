#!/usr/bin/env node

/**
 * Quick WHO query test - load minimal data and test
 */

import { whenm } from '../../dist/whenm.js';

async function testQuickWho() {
  console.log('='.repeat(60));
  console.log('🧪 Quick WHO Query Test');
  console.log('='.repeat(60));
  console.log();
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  console.log('📚 Loading test events...\n');
  
  // Load a subset of Python learners
  const pythonLearners = [
    { text: "Alice learned Python", date: "2023-01-10" },
    { text: "Diana learned Python", date: "2023-02-10" },
    { text: "Grace learned Python", date: "2023-03-20" },
    { text: "Steve learned Python", date: "2023-10-20" },
    { text: "Nancy learned Python", date: "2023-08-01" },
    // Add some non-Python events
    { text: "Bob learned JavaScript", date: "2023-01-16" },
    { text: "Charlie learned Rust", date: "2023-02-01" },
  ];
  
  for (const event of pythonLearners) {
    await memory.remember(event.text, event.date);
    console.log(`✓ ${event.text}`);
  }
  
  console.log('\n' + '='.repeat(40) + '\n');
  
  // Test WHO query
  console.log('🧪 Testing "Who learned Python?"...\n');
  
  const result = await memory.nl("Who learned Python?");
  console.log('Result:', result);
  console.log(`Found ${result.length} people`);
  console.log('Expected: 5 people (Alice, Diana, Grace, Steve, Nancy)');
  
  const expected = ['Alice', 'Diana', 'Grace', 'Steve', 'Nancy'];
  const isCorrect = result.length === 5 && 
                    expected.every(name => result.includes(name));
  
  console.log(`\nStatus: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
  
  // Debug - show all events
  console.log('\n' + '='.repeat(40) + '\n');
  console.log('📋 All stored events:');
  const allEvents = await memory.engine.allEvents();
  allEvents.forEach(e => {
    console.log(`  ${e.event}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

testQuickWho().catch(console.error);