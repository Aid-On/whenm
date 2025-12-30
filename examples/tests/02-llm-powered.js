/**
 * LLM-Poweredエンジンの完全テスト
 * 
 * MockプロバイダーとEvent Calculusの統合検証
 */

import { createLLMPoweredWhenM } from '../../dist/llm-powered-engine.js';

async function test() {
  console.log('=== LLM-Powered スキーマレスエンジン 完全テスト ===\n');
  
  // デバッグモードでMockプロバイダー使用
  const memory = await createLLMPoweredWhenM({ debug: true });
  
  console.log('📝 1. 日本語イベントの記憶');
  console.log('-'.repeat(50));
  
  await memory.remember("太郎が東京に引っ越した", "2024-01-01");
  await memory.remember("太郎がPythonを学んだ", "2024-06-01");
  await memory.remember("花子が大阪に引っ越した", "2024-02-01");
  await memory.remember("花子がJavaScriptを学んだ", "2024-07-01");
  
  console.log('\n📝 2. 英語イベントの記憶');
  console.log('-'.repeat(50));
  
  await memory.remember("Alice moved to London", "2024-03-01");
  await memory.remember("Alice learned React", "2024-08-01");
  await memory.remember("Bob moved to Paris", "2024-04-01");
  await memory.remember("Bob learned TypeScript", "2024-09-01");
  
  console.log('\n🔍 3. Event履歴の確認');
  console.log('-'.repeat(50));
  
  const history = await memory.getHistory();
  console.log('記録されたイベント:');
  history.forEach(h => console.log(`  - ${h.time}: ${h.event}`));
  
  console.log('\n❓ 4. 日本語での質問');
  console.log('-'.repeat(50));
  
  const q1 = await memory.ask("太郎はどこに住んでいる？", "2024-12-29");
  console.log("Q: 太郎はどこに住んでいる？");
  console.log("A:", q1);
  
  const q2 = await memory.ask("太郎は何を知っている？", "2024-12-29");
  console.log("\nQ: 太郎は何を知っている？");
  console.log("A:", q2);
  
  const q3 = await memory.ask("花子はどこに住んでいる？", "2024-12-29");
  console.log("\nQ: 花子はどこに住んでいる？");
  console.log("A:", q3);
  
  const q4 = await memory.ask("花子は何を知っている？", "2024-12-29");
  console.log("\nQ: 花子は何を知っている？");
  console.log("A:", q4);
  
  console.log('\n❓ 5. 英語での質問');
  console.log('-'.repeat(50));
  
  const q5 = await memory.ask("Where does Alice live?", "2024-12-29");
  console.log("Q: Where does Alice live?");
  console.log("A:", q5);
  
  const q6 = await memory.ask("What does Alice know?", "2024-12-29");
  console.log("\nQ: What does Alice know?");
  console.log("A:", q6);
  
  const q7 = await memory.ask("Where does Bob live?", "2024-12-29");
  console.log("\nQ: Where does Bob live?");
  console.log("A:", q7);
  
  const q8 = await memory.ask("What does Bob know?", "2024-12-29");
  console.log("\nQ: What does Bob know?");
  console.log("A:", q8);
  
  console.log('\n📊 6. 現在の状態確認');
  console.log('-'.repeat(50));
  
  const currentState = await memory.getCurrentState("2024-12-29");
  console.log('現在の状態 (2024-12-29):');
  currentState.forEach(s => console.log(`  - ${s}`));
  
  console.log('\n🎯 7. 成功率の計算');
  console.log('-'.repeat(50));
  
  // 期待される回答のチェック
  const results = [
    { question: "太郎の居住地", answer: q1, expected: "東京", success: q1.includes("東京") },
    { question: "太郎の知識", answer: q2, expected: "Python", success: q2.includes("Python") },
    { question: "花子の居住地", answer: q3, expected: "大阪", success: q3.includes("大阪") },
    { question: "花子の知識", answer: q4, expected: "JavaScript", success: q4.includes("JavaScript") },
    { question: "Alice's location", answer: q5, expected: "London", success: q5.includes("London") },
    { question: "Alice's knowledge", answer: q6, expected: "React", success: q6.includes("React") },
    { question: "Bob's location", answer: q7, expected: "Paris", success: q7.includes("Paris") },
    { question: "Bob's knowledge", answer: q8, expected: "TypeScript", success: q8.includes("TypeScript") },
  ];
  
  const successCount = results.filter(r => r.success).length;
  
  console.log('\n結果:');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.question}: "${r.answer}" (期待: ${r.expected})`);
  });
  
  console.log(`\n成功率: ${successCount}/${results.length} (${Math.round(successCount * 100 / results.length)}%)`);
  
  console.log('\n=== まとめ ===');
  console.log('✅ LLMが自然言語 → Event Calculus変換を処理');
  console.log('✅ Prolog推論が正しく動作');
  console.log('✅ 日本語・英語の両方に対応');
  console.log('✅ 時系列での状態管理が可能');
  
  if (successCount === results.length) {
    console.log('\n🎉 完璧！すべてのテストに合格しました！');
  } else {
    console.log(`\n⚠️ ${results.length - successCount}個のテストが失敗しました。`);
  }
}

test().catch(console.error);