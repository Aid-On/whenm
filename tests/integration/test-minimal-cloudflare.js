#!/usr/bin/env node

/**
 * Minimal Cloudflare Test
 * 
 * 最小限のCloudflare動作テスト
 */

import { whenm } from '../../dist/whenm.js';

async function test() {
  console.log('🧪 Minimal Cloudflare Test\n');
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org",
    { debug: true }
  );
  
  // Test 1: Store event
  console.log('📝 Test 1: Remember event');
  await memory.remember("Alice learned Python", "2024-01-15");
  console.log('✅ Event remembered\n');
  
  // Test 2: Direct engine query
  console.log('🔍 Test 2: Direct engine query');
  const engine = memory.getEngine();
  const allEvents = await engine.allEvents();
  console.log('All events:', allEvents);
  console.log();
  
  // Test 3: Simple ask
  console.log('❓ Test 3: Simple ask');
  try {
    const answer = await memory.ask("What did Alice learn?");
    console.log('Answer:', answer);
  } catch (error) {
    console.error('Ask error:', error.message);
  }
  console.log();
  
  // Test 4: NL query
  console.log('🗣️ Test 4: NL query');
  try {
    const result = await memory.nl("What did Alice learn?");
    console.log('NL result:', result);
  } catch (error) {
    console.error('NL error:', error.message);
  }
}

test().catch(console.error);