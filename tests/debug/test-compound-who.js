#!/usr/bin/env node

/**
 * Test compound events affecting WHO queries
 */

import { whenm } from '../../dist/whenm.js';

async function testCompoundWho() {
  console.log('='.repeat(60));
  console.log('🧪 Compound Event WHO Query Test');
  console.log('='.repeat(60));
  console.log();
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  console.log('📚 Loading compound events that might affect counting...\n');
  
  // These compound events might be creating extra "learned" events
  const events = [
    { text: "Alice learned Python", date: "2023-01-10" },
    { text: "Bob learned JavaScript", date: "2023-01-16" },
    { text: "Nancy joined as Python Developer", date: "2023-07-15" }, // Contains "Python" but not "learned"
    { text: "Steve joined as JavaScript Engineer", date: "2023-10-15" }, // Contains "JavaScript" 
    { text: "Diana became Python Expert", date: "2023-08-01" }, // Contains "Python" but not "learned"
  ];
  
  console.log('Loading events and showing parsed results:\n');
  
  for (const event of events) {
    console.log(`Input: "${event.text}"`);
    
    // Parse to see what gets stored
    const parsed = await memory.engine.parseEvent(event.text);
    
    if (Array.isArray(parsed)) {
      console.log('Parsed into multiple events:');
      parsed.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.subject} ${p.verb} ${p.object || ''}`);
      });
    } else {
      console.log(`Parsed: ${parsed.subject} ${parsed.verb} ${parsed.object || ''}`);
    }
    
    await memory.remember(event.text, event.date);
    console.log('✓ Stored\n');
  }
  
  console.log('='.repeat(40) + '\n');
  
  // Test WHO queries
  console.log('🧪 Testing WHO queries:\n');
  
  const pythonResult = await memory.nl("Who learned Python?");
  console.log('"Who learned Python?"');
  console.log('Result:', pythonResult);
  console.log('Expected: ["Alice"]');
  console.log(`Status: ${pythonResult.length === 1 && pythonResult[0] === 'Alice' ? '✅ PASS' : '❌ FAIL'}\n`);
  
  const jsResult = await memory.nl("Who learned JavaScript?");
  console.log('"Who learned JavaScript?"');
  console.log('Result:', jsResult);
  console.log('Expected: ["Bob"]'); 
  console.log(`Status: ${jsResult.length === 1 && jsResult[0] === 'Bob' ? '✅ PASS' : '❌ FAIL'}\n`);
  
  // Test if compound events are incorrectly matched
  console.log('='.repeat(40) + '\n');
  console.log('🔍 Analyzing potential issues:\n');
  
  // Check what "joined as Python Developer" creates
  const pythonDevResult = await memory.nl("Who became Python Developer?");
  console.log('"Who became Python Developer?"');
  console.log('Result:', pythonDevResult);
  console.log('(Nancy should appear here from compound event)\n');
  
  const jsEngResult = await memory.nl("Who became JavaScript Engineer?");
  console.log('"Who became JavaScript Engineer?"');
  console.log('Result:', jsEngResult);
  console.log('(Steve should appear here from compound event)\n');
  
  console.log('='.repeat(60));
}

testCompoundWho().catch(console.error);