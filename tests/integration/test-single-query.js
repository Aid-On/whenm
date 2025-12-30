#!/usr/bin/env node

/**
 * Single Query Test
 * 
 * 単一クエリの動作確認
 */

import { whenm } from '../../dist/whenm.js';

async function testSingleQuery() {
  console.log('🧪 Single Query Test\n');
  
  // Use Cloudflare provider
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org",
    {
      model: '@cf/meta/llama-3-8b-instruct',
      debug: true  // Enable debug to see what's happening
    }
  );
  
  // Single event
  console.log('📝 Storing event...');
  await memory.remember("Alice learned Python", "2024-01-15");
  console.log('✅ Event stored\n');
  
  // Single query
  console.log('🔍 Querying...');
  try {
    const result = await memory.nl("What did Alice learn?");
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSingleQuery().catch(console.error);