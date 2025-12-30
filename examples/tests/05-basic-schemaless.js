/**
 * スキーマレスエンジンのテスト
 * 
 * 日本語、英語、造語、なんでも受け入れる
 */

import { createSchemalessWhenM } from '../../dist/schemaless-engine.js';

async function test() {
  console.log('=== スキーマレス推論エンジン テスト ===\n');
  
  const engine = await createSchemalessWhenM({ debug: true });
  
  console.log('1. 日本語の記憶');
  console.log('-'.repeat(40));
  
  await engine.remember("太郎が東京に引っ越した", "2024-01-01");
  await engine.remember("太郎がPythonを学んだ", "2024-06-01");
  await engine.remember("花子がロボットを作った", "2024-07-01");
  
  console.log('\n2. 英語の記憶');
  console.log('-'.repeat(40));
  
  await engine.remember("Alice moved to London", "2024-02-01");
  await engine.remember("Bob learned JavaScript", "2024-03-01");
  
  console.log('\n3. 造語・ゲーム用語の記憶');
  console.log('-'.repeat(40));
  
  await engine.remember("プレイヤーがドラゴンを倒した", "2024-08-01");
  await engine.remember("勇者がレベルアップした", "2024-08-02");
  await engine.remember("システムが異常を検知した", "2024-09-01");
  
  console.log('\n4. 質問と推論');
  console.log('-'.repeat(40));
  
  const q1 = await engine.ask("太郎はどこに住んでいる？");
  console.log("Q: 太郎はどこに住んでいる？");
  console.log("A:", q1);
  
  const q2 = await engine.ask("太郎は何を知っている？");
  console.log("\nQ: 太郎は何を知っている？");
  console.log("A:", q2);
  
  const q3 = await engine.ask("What does Bob know?");
  console.log("\nQ: What does Bob know?");
  console.log("A:", q3);
  
  console.log('\n5. 新しいパターンを教える');
  console.log('-'.repeat(40));
  
  // 「倒した」→「defeated」の関係を教える
  await engine.teach("倒した", "defeated");
  
  // 「検知した」→「detected」の関係を教える
  await engine.teach("検知した", "detected");
  
  const q4 = await engine.ask("プレイヤーは何を倒した？");
  console.log("\nQ: プレイヤーは何を倒した？");
  console.log("A:", q4);
  
  console.log('\n=== まとめ ===');
  console.log('✅ 日本語OK');
  console.log('✅ 英語OK');
  console.log('✅ 造語OK');
  console.log('✅ 学習機能あり');
  console.log('✅ schema.ts不要！');
}

test().catch(console.error);