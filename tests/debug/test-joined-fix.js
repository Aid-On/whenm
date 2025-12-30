#!/usr/bin/env node

/**
 * Test joined pattern fix
 */

import { whenm } from '../../dist/whenm.js';

async function testJoinedFix() {
  console.log('🔍 Testing joined pattern improvements\n');
  
  const memory = await whenm.auto();
  
  // Test events
  const events = [
    { text: "Nancy joined as Data Scientist", date: "2023-07-15" },
    { text: "Charlie joined as VP Engineering", date: "2023-01-15" },
    { text: "Alice joined the company", date: "2023-01-02" },
    { text: "Bob joined the company", date: "2023-01-09" },
  ];
  
  console.log('Loading events...');
  for (const {text, date} of events) {
    await memory.remember(text, date);
    console.log(`  ✓ ${text}`);
  }
  console.log();
  
  // Test queries
  const queries = [
    {
      q: "When did Nancy join the company?",
      expected: "2023-07-15",
      description: "Should match 'joined as'"
    },
    {
      q: "Who joined as CTO?",
      expectedCount: 0,
      description: "Nobody joined as CTO"
    },
    {
      q: "How many people joined the company?",
      expected: 4,
      description: "All 4 people joined"
    },
    {
      q: "Who joined as VP Engineering?",
      expectedCount: 1,
      expectedPerson: "charlie",
      description: "Charlie joined as VP"
    }
  ];
  
  console.log('Testing queries:\n');
  
  for (const query of queries) {
    console.log(`Q: ${query.q}`);
    console.log(`Description: ${query.description}`);
    
    const result = await memory.nl(query.q);
    console.log(`Result:`, result);
    
    let isCorrect = false;
    if (query.expected !== undefined) {
      isCorrect = JSON.stringify(result).includes(query.expected);
    } else if (query.expectedCount !== undefined) {
      const count = Array.isArray(result) ? result.length : result?.count || 0;
      isCorrect = count === query.expectedCount;
    }
    
    console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
  }
}

testJoinedFix().catch(console.error);