#!/usr/bin/env node

/**
 * Test All Query Types
 * 
 * 全クエリタイプのテスト
 */

import { whenm } from '../../dist/whenm.js';

async function testAllQueries() {
  console.log('🧪 Testing All Query Types\n');
  
  // Use mock for speed during development
  const memory = await whenm.auto();
  
  // Store various events
  console.log('📝 Storing test events...');
  await memory.remember("Alice learned Python", "2024-01-15");
  await memory.remember("Alice learned JavaScript", "2024-02-01");
  await memory.remember("Alice became senior engineer", "2024-06-01");
  await memory.remember("Bob joined the company", "2024-03-01");
  await memory.remember("Bob learned Rust", "2024-04-15");
  await memory.remember("Charlie became CEO", "2024-07-01");
  await memory.remember("Alice won the hackathon", "2024-09-15");
  console.log('✅ Events stored\n');
  
  const queries = [
    // WHAT queries
    { q: "What did Alice learn?", type: "What", expected: ["Python", "JavaScript"] },
    { q: "What did Bob learn?", type: "What", expected: ["Rust"] },
    
    // WHEN queries  
    { q: "When did Alice become senior engineer?", type: "When", expected: "2024-06-01" },
    { q: "When did Bob join the company?", type: "When", expected: "2024-03-01" },
    
    // WHO queries
    { q: "Who learned Python?", type: "Who", expected: "Alice" },
    { q: "Who became CEO?", type: "Who", expected: "Charlie" },
    { q: "Who won the hackathon?", type: "Who", expected: "Alice" },
    
    // HOW MANY queries (aggregation)
    { q: "How many times did Alice learn something?", type: "Count", expected: 2 },
    { q: "How many people learned something?", type: "Count", expected: 2 },
    
    // TIMELINE queries
    { q: "Show Alice's timeline", type: "Timeline", expected: "timeline" },
    
    // SEARCH queries
    { q: "Search for promotions", type: "Search", expected: ["senior engineer", "CEO"] },
    { q: "Find all learning events", type: "Search", expected: ["learned"] },
    
    // COMPARISON queries
    { q: "Compare Alice between January and July", type: "Compare", expected: "alice" }
  ];
  
  console.log('🔍 Testing all query types:\n');
  
  for (const {q, type, expected} of queries) {
    console.log(`[${type}] ${q}`);
    
    try {
      const result = await memory.nl(q);
      const resultStr = JSON.stringify(result);
      
      let isCorrect = false;
      if (Array.isArray(expected)) {
        isCorrect = expected.some(exp => resultStr.toLowerCase().includes(exp.toLowerCase()));
      } else if (typeof expected === 'number') {
        isCorrect = result?.count === expected || resultStr.includes(expected.toString());
      } else {
        isCorrect = resultStr.toLowerCase().includes(expected.toLowerCase());
      }
      
      console.log(`Result: ${resultStr.slice(0, 100)}${resultStr.length > 100 ? '...' : ''}`);
      console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log(`Status: ❌ FAIL\n`);
    }
  }
}

testAllQueries().catch(console.error);