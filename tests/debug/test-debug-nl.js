#!/usr/bin/env node

/**
 * Debug Natural Language Query
 * 
 * 自然言語クエリのデバッグ
 */

import { whenm } from '../../dist/whenm.js';

async function testNLQuery() {
  console.log('🧪 Testing Natural Language Query with Debug\n');
  
  // Use mock provider first to isolate the issue
  const memory = await whenm.auto();
  
  // Store simple event
  console.log('📝 Storing event...');
  await memory.remember("Alice learned Python", "2024-01-15");
  console.log('✅ Event stored\n');
  
  // Direct engine query test
  console.log('🔍 Testing direct engine query...');
  const engine = memory.getEngine();
  const results = await engine.allEvents();
  console.log('Direct query results:', results);
  console.log();
  
  // Natural language query test
  console.log('🔍 Testing natural language query...');
  try {
    // Test different query methods
    console.log('1. Testing with simple NL query...');
    const result1 = await memory.nl("What did Alice learn?");
    console.log('Result 1:', result1);
    
    console.log('\n2. Testing with timeline...');
    const result2 = await memory.timeline("alice");
    console.log('Result 2:', result2);
    
    console.log('\n3. Testing with search...');
    const result3 = await memory.search("learned");
    console.log('Result 3:', result3);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testNLQuery().catch(console.error);