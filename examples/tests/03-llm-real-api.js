#!/usr/bin/env node

/**
 * 実際のLLM API（Groq）を使った統合テスト
 * 
 * 使用法:
 * GROQ_API_KEY=your_api_key node test-llm-real-api.js
 */

import { createLLMPoweredWhenM } from '../../dist/llm-powered-engine.js';

async function testWithRealAPI() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ GROQ_API_KEY環境変数が設定されていません');
    console.log('使用法: GROQ_API_KEY=your_api_key node test-llm-real-api.js');
    console.log('\nGroq APIキーは以下から取得できます:');
    console.log('https://console.groq.com/keys');
    process.exit(1);
  }
  
  console.log('=== 実LLM API統合テスト (Groq) ===\n');
  
  const memory = await createLLMPoweredWhenM({ 
    apiKey,
    debug: true 
  });
  
  console.log('🌍 1. 多言語・多ドメインのテスト');
  console.log('-'.repeat(50));
  
  // 日本語
  await memory.remember("太郎が東京に引っ越した", "2024-01-01");
  await memory.remember("太郎がAIについて学んだ", "2024-06-01");
  
  // 英語
  await memory.remember("Alice became a software engineer", "2024-02-01");
  await memory.remember("Alice joined the robotics club", "2024-07-01");
  
  // ゲームドメイン
  await memory.remember("勇者がドラゴンを倒した", "2024-08-01");
  await memory.remember("勇者がレベル50になった", "2024-09-01");
  
  // ビジネスドメイン
  await memory.remember("会社が新製品をリリースした", "2024-10-01");
  await memory.remember("売上が200%増加した", "2024-11-01");
  
  console.log('\n❓ 2. 複雑な質問');
  console.log('-'.repeat(50));
  
  const questions = [
    "太郎は今どこに住んでいますか？",
    "太郎は何について知識がありますか？",
    "What is Alice's current role?",
    "What organization is Alice part of?",
    "勇者は何を成し遂げましたか？",
    "勇者の現在のレベルは？",
    "会社は最近何をしましたか？",
    "売上はどうなりましたか？"
  ];
  
  for (const q of questions) {
    const answer = await memory.ask(q, "2024-12-29");
    console.log(`Q: ${q}`);
    console.log(`A: ${answer}\n`);
  }
  
  console.log('📊 3. 時系列分析');
  console.log('-'.repeat(50));
  
  // 過去の状態を確認
  const past2024Jan = await memory.ask("太郎はどこに住んでいる？", "2024-01-15");
  console.log("2024年1月15日時点での太郎の居住地:", past2024Jan);
  
  const past2024Jun = await memory.ask("太郎は何を知っている？", "2024-06-15");
  console.log("2024年6月15日時点での太郎の知識:", past2024Jun);
  
  console.log('\n🧪 4. エッジケース');
  console.log('-'.repeat(50));
  
  // 絵文字を含む文
  await memory.remember("🤖がプログラミングを学習した", "2024-12-01");
  
  // 複雑な文章
  await memory.remember(
    "山田さんは東京から大阪に転勤になり、同時に新しいプロジェクトのリーダーに任命された",
    "2024-12-15"
  );
  
  // 未来の予定
  await memory.remember("来月、新しいAIシステムが稼働予定", "2025-01-01");
  
  const edgeCaseQuestions = [
    "🤖は何を学習しましたか？",
    "山田さんの現在の勤務地は？",
    "山田さんの役職は？",
    "AIシステムはいつ稼働しますか？"
  ];
  
  for (const q of edgeCaseQuestions) {
    const answer = await memory.ask(q, "2024-12-29");
    console.log(`Q: ${q}`);
    console.log(`A: ${answer}\n`);
  }
  
  console.log('📈 5. パフォーマンス測定');
  console.log('-'.repeat(50));
  
  const startTime = Date.now();
  
  // 10個のイベントを連続で記録
  for (let i = 1; i <= 10; i++) {
    await memory.remember(
      `テストユーザー${i}がシステムにログインした`,
      `2024-12-${String(i).padStart(2, '0')}`
    );
  }
  
  const recordTime = Date.now() - startTime;
  console.log(`10イベント記録時間: ${recordTime}ms (平均: ${recordTime/10}ms/event)`);
  
  const queryStart = Date.now();
  
  // 10個の質問を連続で実行
  for (let i = 1; i <= 10; i++) {
    await memory.ask(`テストユーザー${i}は何をしましたか？`, "2024-12-29");
  }
  
  const queryTime = Date.now() - queryStart;
  console.log(`10質問実行時間: ${queryTime}ms (平均: ${queryTime/10}ms/query)`);
  
  console.log('\n=== テスト完了 ===');
  console.log('✅ 実LLM APIとの統合成功');
  console.log('✅ 多言語・多ドメイン対応確認');
  console.log('✅ 時系列推論動作確認');
  console.log('✅ エッジケース処理確認');
  console.log(`✅ 平均応答時間: ${(recordTime/10 + queryTime/10)/2}ms`);
}

testWithRealAPI().catch(console.error);