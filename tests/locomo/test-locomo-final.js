#!/usr/bin/env node

/**
 * LoCoMo Final Test
 * 
 * 実際に動作確認
 */

import { whenm } from '../../dist/whenm.js';

async function testLoCoMo() {
  console.log('='.repeat(60));
  console.log('🚀 LoCoMo Benchmark Final Test');
  console.log('='.repeat(60));
  console.log();
  
  // Use Cloudflare
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  // LoCoMo形式のイベント
  const events = [
    { text: "Alice learned Python", date: "2024-01-15" },
    { text: "Alice became senior engineer", date: "2024-06-01" },
    { text: "Bob joined the company", date: "2024-03-01" },
    { text: "Alice won the hackathon", date: "2024-09-15" },
    { text: "Bob became tech lead", date: "2024-10-01" }
  ];
  
  console.log('📚 Loading events...');
  for (const {text, date} of events) {
    await memory.remember(text, date);
    console.log(`  ✓ ${text} (${date})`);
  }
  console.log();
  
  console.log('🧪 Testing LoCoMo-style queries:\n');
  
  const queries = [
    { 
      q: "What did Alice learn?", 
      type: "What",
      expected: "Python"
    },
    { 
      q: "When did Alice become senior engineer?", 
      type: "When",
      expected: "2024-06-01"
    },
    { 
      q: "When did Bob become tech lead?",
      type: "When", 
      expected: "2024-10-01"
    },
    {
      q: "When did Alice win the hackathon?",
      type: "When",
      expected: "2024-09-15"
    }
  ];
  
  let correct = 0;
  let total = queries.length;
  
  for (const {q, type, expected} of queries) {
    console.log(`[${type}] ${q}`);
    
    try {
      const result = await memory.nl(q);
      const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
      const isCorrect = resultStr.includes(expected);
      
      console.log(`Answer: ${resultStr}`);
      console.log(`Expected: ${expected}`);
      console.log(`Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
      
      if (isCorrect) correct++;
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log(`Result: ❌ FAIL\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log(`📊 Results: ${correct}/${total} (${(correct/total*100).toFixed(0)}%)`);
  console.log('='.repeat(60));
  
  if (correct === total) {
    console.log('\n🎉 All tests passed! WhenM is ready for production!');
  } else {
    console.log('\n⚠️ Some tests failed. Needs improvement.');
  }
}

testLoCoMo().catch(console.error);