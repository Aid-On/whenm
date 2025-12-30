#!/usr/bin/env node

/**
 * Test WHO query logic directly
 */

import { whenm } from '../../dist/whenm.js';

async function testWhoLogic() {
  console.log('='.repeat(60));
  console.log('🧪 Testing WHO Query Logic');
  console.log('='.repeat(60));
  console.log();
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  // Clear test with specific events
  const testCases = [
    {
      events: [
        { text: "Alice learned Python", date: "2023-01-10" },
        { text: "Bob learned JavaScript", date: "2023-01-16" },
        { text: "Nancy became Python Developer", date: "2023-07-15" },
        { text: "Steve became JavaScript Engineer", date: "2023-10-15" },
      ],
      query: "Who learned Python?",
      expected: ["Alice"],
      description: "Should only match 'learned Python', not 'became Python Developer'"
    },
    {
      events: [], // Uses same events from above
      query: "Who learned JavaScript?", 
      expected: ["Bob"],
      description: "Should only match 'learned JavaScript', not 'became JavaScript Engineer'"
    },
    {
      events: [], // Uses same events from above
      query: "Who became Python Developer?",
      expected: ["Nancy"],
      description: "Should match 'became Python Developer'"
    }
  ];
  
  // Load events once
  console.log('📚 Loading test events:\n');
  for (const event of testCases[0].events) {
    await memory.remember(event.text, event.date);
    console.log(`✓ ${event.text}`);
  }
  
  console.log('\n' + '='.repeat(40) + '\n');
  
  // Test each query
  let correct = 0;
  let total = testCases.length;
  
  for (const test of testCases) {
    console.log(`Query: "${test.query}"`);
    console.log(`Description: ${test.description}`);
    
    const result = await memory.nl(test.query);
    const resultArray = Array.isArray(result) ? result : [result];
    const isCorrect = 
      resultArray.length === test.expected.length &&
      test.expected.every(name => resultArray.includes(name));
    
    console.log(`Expected: [${test.expected.join(', ')}]`);
    console.log(`Got: [${resultArray.join(', ')}]`);
    console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
    
    if (isCorrect) correct++;
  }
  
  console.log('='.repeat(60));
  console.log(`📊 Results: ${correct}/${total} tests passed`);
  
  if (correct === total) {
    console.log('🎉 All tests passed! WHO query logic is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. The WHO query needs adjustment.');
  }
}

testWhoLogic().catch(console.error);