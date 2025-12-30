#!/usr/bin/env node

/**
 * LoCoMo Query Tester - データ読み込み済みの状態でクエリだけテスト
 */

import { whenm } from '../../dist/whenm.js';
import fs from 'fs/promises';

async function testQueries() {
  console.log('='.repeat(60));
  console.log('🧪 LoCoMo Query Test (Data Pre-loaded)');
  console.log('='.repeat(60));
  console.log();
  
  // Check if data is loaded
  try {
    await fs.access('.locomo-data-loaded');
    const loadTime = await fs.readFile('.locomo-data-loaded', 'utf-8');
    console.log(`✅ Using data loaded at: ${loadTime}\n`);
  } catch {
    console.log('❌ No data loaded yet!');
    console.log('Please run: node test-locomo-load.js');
    process.exit(1);
  }
  
  // Connect to existing data
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  const queries = [
    // WHO queries
    { 
      q: "Who learned Python?", 
      type: "Who",
      expectedCount: 4, // Alice, Diana, Grace, Steve, Nancy
      description: "Python learners"
    },
    { 
      q: "Who became senior engineer?",
      type: "Who",
      expectedCount: 2, // Alice, Bob
      description: "Senior engineer promotions"
    },
    { 
      q: "Who won hackathon?",
      type: "Who",
      expectedCount: 2, // Alice, Diana
      description: "Hackathon winners"
    },
    
    // WHEN queries
    { 
      q: "When did Charlie become CTO?",
      type: "When",
      expected: "2023-08-01",
      description: "Charlie's CTO promotion"
    },
    {
      q: "When did Nancy join the company?",
      type: "When",
      expected: "2023-07-15",
      description: "Nancy's join date (as Data Scientist)"
    },
    
    // WHAT queries
    {
      q: "What did Alice learn?",
      type: "What",
      expectedItems: ["Python", "Git"],
      description: "Alice's learning"
    },
    {
      q: "What did Steve learn?",
      type: "What",
      expectedItems: ["Python"],
      description: "Steve's learning"
    },
    
    // HOW MANY queries
    {
      q: "How many people learned Python?",
      type: "Count",
      expected: 5, // Alice, Diana, Grace, Steve, Nancy
      description: "Total Python learners"
    },
    {
      q: "How many people joined the company?",
      type: "Count", 
      expected: 9, // All people including "joined as"
      description: "Total hires"
    },
    {
      q: "How many people became senior engineer?",
      type: "Count",
      expected: 2,
      description: "Senior promotions"
    },
    
    // Complex queries
    {
      q: "Who joined as CTO?",
      type: "Who",
      expectedCount: 0, // Nobody joined as CTO
      description: "Direct CTO hires"
    }
  ];
  
  console.log('🧪 Running queries on pre-loaded data:\n');
  
  let correct = 0;
  let total = queries.length;
  const queryStartTime = Date.now();
  
  for (const query of queries) {
    const {q, type, expected, expectedCount, expectedItems, description} = query;
    console.log(`[${type}] ${q}`);
    console.log(`Description: ${description}`);
    
    try {
      const result = await memory.nl(q);
      const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
      
      let isCorrect = false;
      let expectedStr = '';
      
      if (expectedCount !== undefined) {
        const actualCount = Array.isArray(result) ? result.length : (result?.count || 0);
        isCorrect = actualCount === expectedCount;
        expectedStr = `${expectedCount} items`;
        console.log(`Result: Found ${actualCount} items`);
      } else if (expectedItems) {
        isCorrect = expectedItems.every(item => 
          resultStr.toLowerCase().includes(item.toLowerCase())
        );
        expectedStr = expectedItems.join(', ');
        console.log(`Result: ${resultStr.slice(0, 100)}...`);
      } else if (expected !== undefined) {
        isCorrect = resultStr.includes(String(expected));
        expectedStr = String(expected);
        console.log(`Result: ${resultStr}`);
      }
      
      console.log(`Expected: ${expectedStr}`);
      console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
      
      if (isCorrect) correct++;
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log(`Status: ❌ FAIL\n`);
    }
  }
  
  const queryTime = Date.now() - queryStartTime;
  
  console.log('='.repeat(60));
  console.log(`📊 Results: ${correct}/${total} (${(correct/total*100).toFixed(1)}%)`);
  console.log(`⏱️ Query Time: ${(queryTime/1000).toFixed(2)}s`);
  console.log(`📈 Average: ${(queryTime/total).toFixed(0)}ms per query`);
  console.log('='.repeat(60));
  
  if (correct === total) {
    console.log('\n🏆 PERFECT SCORE!');
  } else if (correct/total >= 0.9) {
    console.log('\n🎉 Excellent! Over 90% accuracy!');
  } else if (correct/total >= 0.8) {
    console.log('\n✅ Good! 80%+ accuracy.');
  } else {
    console.log('\n⚠️ Needs improvement.');
  }
}

testQueries().catch(console.error);