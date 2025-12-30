#!/usr/bin/env node

/**
 * Cloudflareと実際に繋げてテスト
 */

import { whenm } from '../../dist/whenm.js';

async function testLiveCloudflare() {
  console.log('='.repeat(60));
  console.log('🌍 Cloudflare Live Test - 実際にAPIを叩いてみる');
  console.log('='.repeat(60));
  console.log();
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  console.log('📚 いくつかイベントを記憶させる...\n');
  
  const events = [
    { text: "田中が東京に引っ越した", date: "2024-01-15" },
    { text: "田中がPythonを学んだ", date: "2024-02-20" },
    { text: "佐藤がエンジニアになった", date: "2024-03-01" },
    { text: "佐藤がRustを学んだ", date: "2024-03-10" },
    { text: "山田がデータサイエンティストとして入社した", date: "2024-04-01" },
  ];
  
  for (const event of events) {
    console.log(`📝 記憶中: "${event.text}"`);
    await memory.remember(event.text, event.date);
    console.log('  ✅ 保存完了\n');
    
    // レートリミット回避
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(40) + '\n');
  console.log('🧪 自然言語クエリをテスト:\n');
  
  const queries = [
    "誰がPythonを学んだ？",
    "田中はいつ東京に引っ越した？",
    "データサイエンティストとして入社したのは誰？"
  ];
  
  for (const query of queries) {
    console.log(`❓ 質問: "${query}"`);
    
    try {
      const result = await memory.nl(query);
      console.log(`💡 回答: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      console.log(`❌ エラー: ${error.message}\n`);
    }
    
    // レートリミット回避
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('='.repeat(60));
  console.log('✨ テスト完了！');
}

testLiveCloudflare().catch(console.error);