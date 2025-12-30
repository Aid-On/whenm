#!/usr/bin/env node

/**
 * Cloudflare Live Test - English
 */

import { whenm } from '../../dist/whenm.js';

async function testLiveEnglish() {
  console.log('='.repeat(60));
  console.log('🌍 Cloudflare Live Test - 英語版');
  console.log('='.repeat(60));
  console.log();
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  console.log('📚 Loading some events...\n');
  
  const events = [
    { text: "Tanaka moved to Tokyo", date: "2024-01-15" },
    { text: "Tanaka learned Python", date: "2024-02-20" },
    { text: "Sato became engineer", date: "2024-03-01" },
    { text: "Sato learned Rust", date: "2024-03-10" },
    { text: "Yamada joined as Data Scientist", date: "2024-04-01" },
  ];
  
  for (const event of events) {
    console.log(`📝 Remembering: "${event.text}"`);
    await memory.remember(event.text, event.date);
    console.log('  ✅ Saved\n');
    
    // Avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(40) + '\n');
  console.log('🧪 Testing natural language queries:\n');
  
  const queries = [
    "Who learned Python?",
    "When did Tanaka move to Tokyo?",
    "Who joined as Data Scientist?"
  ];
  
  for (const query of queries) {
    console.log(`❓ Query: "${query}"`);
    
    try {
      const result = await memory.nl(query);
      console.log(`💡 Answer: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
    
    // Avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('='.repeat(60));
  console.log('✨ Test complete!');
  console.log('\n📝 Note: 日本語クエリが機能しない場合は、');
  console.log('LLMが日本語イベントを正しくパースできていない可能性があります。');
}

testLiveEnglish().catch(console.error);