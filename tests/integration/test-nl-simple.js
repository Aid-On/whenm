#!/usr/bin/env node

/**
 * Simple NL Query Debug
 * 
 * NLクエリの最小デバッグ
 */

import { NaturalLanguageQuery } from '../../dist/natural-query.js';
import { createEngine } from '../../dist/index.js';
import { MockUnifiedProvider } from '../../dist/final-engine.js';

async function testNLDirect() {
  console.log('🧪 Testing NL Query directly\n');
  
  // Create engine
  const engine = await createEngine();
  
  // Add test event directly
  await engine.assertEvent('event("alice", "learned", "Python")', '2024-01-15');
  
  // Verify event exists
  const events = await engine.allEvents();
  console.log('Events in engine:', events);
  console.log();
  
  // Create NL query processor
  const llm = new MockUnifiedProvider();
  const nlQuery = new NaturalLanguageQuery(engine, llm);
  
  // Test query
  console.log('Testing query: "What did Alice learn?"\n');
  
  try {
    // Test intent parsing
    console.log('1. Parsing intent...');
    const intent = await nlQuery.parseIntent("What did Alice learn?");
    console.log('Intent:', intent);
    console.log();
    
    // Test direct query
    console.log('2. Executing query...');
    const result = await nlQuery.query("What did Alice learn?");
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testNLDirect().catch(console.error);