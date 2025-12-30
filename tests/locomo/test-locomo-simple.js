#!/usr/bin/env node

/**
 * Simplified LoCoMo Test with WhenM
 * 
 * 最小限のLoCoMoテストケース
 */

import { whenm } from '../../dist/whenm.js';

async function runSimpleTest() {
  console.log('='.repeat(60));
  console.log('🚀 Simplified LoCoMo Test with WhenM');
  console.log('='.repeat(60));
  console.log();
  
  // Create memory with Cloudflare provider
  const memory = await whenm.cloudflare(
    process.env.CLOUDFLARE_ACCOUNT_ID || "0fc5c2d478a1383a6b624d19ff4bd340",
    process.env.CLOUDFLARE_API_KEY || "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    process.env.CLOUDFLARE_EMAIL || "Hiromi.motodera@aid-on.org",
    {
      model: '@cf/meta/llama-3-8b-instruct',
      debug: false
    }
  );
  
  // Simple dialogue data (3 events only)
  const events = [
    { text: "Alice learned Python", date: "2024-01-15" },
    { text: "Alice became senior engineer", date: "2024-06-01" },
    { text: "Bob joined the company", date: "2024-03-01" }
  ];
  
  // Load events
  console.log('📚 Loading events...\n');
  for (const {text, date} of events) {
    await memory.remember(text, date);
    console.log(`  ✓ ${text} (${date})`);
  }
  
  // Test queries
  console.log('\n🧪 Testing queries:\n');
  
  const queries = [
    "What did Alice learn?",
    "When did Alice become senior engineer?",
    "Who joined the company?"
  ];
  
  for (const q of queries) {
    try {
      const answer = await memory.nl(q);
      console.log(`Q: ${q}`);
      console.log(`A: ${JSON.stringify(answer).slice(0, 100)}\n`);
    } catch (error) {
      console.log(`Q: ${q}`);
      console.log(`Error: ${error.message}\n`);
    }
  }
  
  console.log('✅ Test complete!');
}

runSimpleTest().catch(console.error);