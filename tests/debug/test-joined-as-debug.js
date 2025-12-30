#!/usr/bin/env node

/**
 * Debug "joined as" pattern issue
 */

import { whenm } from '../../dist/whenm.js';

async function debugJoinedAs() {
  console.log('='.repeat(60));
  console.log('🔍 Debug "joined as" pattern');
  console.log('='.repeat(60));
  console.log();
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  console.log('📚 Testing compound event decomposition:\n');
  
  // Test single "joined as" event
  const event = { text: "Nancy joined as Data Scientist", date: "2024-01-15" };
  
  console.log(`📝 Storing: "${event.text}"`);
  await memory.remember(event.text, event.date);
  console.log('✅ Saved\n');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('🧪 Testing various queries:\n');
  
  const queries = [
    { q: "Who joined as Data Scientist?", expected: "Nancy" },
    { q: "Who became Data Scientist?", expected: "Nancy" },
    { q: "Who joined the company?", expected: "Nancy" },
    { q: "When did Nancy join?", expected: "2024-01-15" },
    { q: "When did Nancy become Data Scientist?", expected: "2024-01-15" },
  ];
  
  for (const {q, expected} of queries) {
    console.log(`Query: "${q}"`);
    console.log(`Expected: ${expected}`);
    
    try {
      const result = await memory.nl(q);
      const resultStr = Array.isArray(result) ? result.join(', ') : result;
      console.log(`Got: ${resultStr || '(empty)'}`);
      
      const isCorrect = 
        (Array.isArray(result) && result.includes(expected)) ||
        (result === expected) ||
        (typeof result === 'string' && result.includes(expected));
      
      console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('='.repeat(60));
}

debugJoinedAs().catch(console.error);