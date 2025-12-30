#!/usr/bin/env node

/**
 * Test "When" Query
 * 
 * "When did X happen?"形式のクエリをテスト
 */

import { whenm } from '../../dist/whenm.js';

async function testWhenQuery() {
  console.log('🔍 Testing "When" Query\n');
  
  // Use Cloudflare
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org",
    { debug: true }
  );
  
  // Store test events
  console.log('📝 Storing events...');
  await memory.remember("Alice learned Python", "2024-01-15");
  await memory.remember("Alice became senior engineer", "2024-06-01");
  await memory.remember("Bob joined the company", "2024-03-01");
  console.log('✅ Events stored\n');
  
  // Test 1: Ask method (works)
  console.log('1️⃣ Using ask() method:');
  const askResult = await memory.ask("When did Alice become senior engineer?");
  console.log('Result:', askResult);
  console.log();
  
  // Test 2: NL query (has problem)
  console.log('2️⃣ Using nl() method:');
  const nlResult = await memory.nl("When did Alice become senior engineer?");
  console.log('Result:', nlResult);
  console.log();
  
  // Test 3: Debug - trace intent parsing
  console.log('3️⃣ Tracing intent parsing:');
  const engine = memory.getEngine();
  const llm = memory.engine.getLLM();
  const { NaturalLanguageQuery } = await import('./dist/natural-query.js');
  const nlq = new NaturalLanguageQuery(engine, llm);
  
  const intent = await nlq.parseIntent("When did Alice become senior engineer?");
  console.log('Parsed intent:', JSON.stringify(intent, null, 2));
  
  // Check if it's being routed incorrectly
  if (intent.action === 'timeline') {
    console.log('⚠️ Intent incorrectly parsed as timeline!');
    console.log('Should be parsed as a "when" query instead.');
  }
}

testWhenQuery().catch(console.error);