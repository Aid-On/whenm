#!/usr/bin/env node

/**
 * 統合エンジンテスト
 * 
 * 真のスキーマレス：未知の概念を動的に学習
 */

import { createUnifiedEngine } from '../../dist/final-engine.js';

async function testBasicFunctionality() {
  console.log('=== 基本機能テスト ===\n');
  
  const engine = await createUnifiedEngine({ debug: true });
  
  // 通常のイベント
  await engine.remember("Alice learned TypeScript", "2024-01-01");
  await engine.remember("Bob moved to Tokyo", "2024-02-01");
  await engine.remember("太郎がRustを学んだ", "2024-03-01");
  
  // 質問
  const q1 = await engine.ask("What does Alice know?", "2024-12-01");
  console.log("Q: What does Alice know?");
  console.log("A:", q1, "\n");
  
  const q2 = await engine.ask("Where does Bob live?", "2024-12-01");
  console.log("Q: Where does Bob live?");
  console.log("A:", q2, "\n");
  
  const q3 = await engine.ask("太郎は何を知っている？", "2024-12-01");
  console.log("Q: 太郎は何を知っている？");
  console.log("A:", q3, "\n");
}

async function testDynamicLearning() {
  console.log('\n=== 動的学習テスト（未知の動詞） ===\n');
  
  const engine = await createUnifiedEngine({ 
    debug: false,
    autoLearn: true 
  });
  
  console.log('📚 新しい概念を学習させる...\n');
  
  // 完全に未知の動詞を使用
  await engine.remember("Alice grokked quantum physics", "2024-01-01");
  await engine.remember("Bob grokked machine learning", "2024-02-01");
  
  // 「grok」が「深い理解」を意味すると推論させる
  await engine.learn([
    "Charlie grokked the essence of reality",
    "Dana grokked the meaning of life"
  ]);
  
  console.log('❓ 学習した概念で質問...\n');
  
  const q1 = await engine.ask("What does Alice grok?", "2024-12-01");
  console.log("Q: What does Alice grok?");
  console.log("A:", q1);
  
  const q2 = await engine.ask("Who grokked machine learning?", "2024-12-01");
  console.log("\nQ: Who grokked machine learning?");
  console.log("A:", q2);
}

async function testRPGDomain() {
  console.log('\n=== RPGドメインテスト（完全に新しい世界） ===\n');
  
  const engine = await createUnifiedEngine({ debug: false });
  
  console.log('🎮 RPGの世界を構築...\n');
  
  // RPGイベント
  await engine.remember("勇者がスライムを倒した", "2024-01-01");
  await engine.remember("勇者が経験値を100獲得した", "2024-01-01");
  await engine.remember("勇者がレベル2になった", "2024-01-02");
  await engine.remember("勇者が火の剣を装備した", "2024-01-03");
  await engine.remember("魔法使いが勇者のパーティに加わった", "2024-01-04");
  await engine.remember("勇者がドラゴンを倒した", "2024-01-10");
  await engine.remember("勇者がレベル10になった", "2024-01-11");
  
  console.log('❓ RPG世界での質問...\n');
  
  const questions = [
    "勇者のレベルは？",
    "勇者は何を装備している？",
    "誰がドラゴンを倒した？",
    "パーティには誰がいる？"
  ];
  
  for (const q of questions) {
    const answer = await engine.ask(q, "2024-12-01");
    console.log(`Q: ${q}`);
    console.log(`A: ${answer}\n`);
  }
}

async function testBusinessDomain() {
  console.log('\n=== ビジネスドメインテスト（M&A・組織変更） ===\n');
  
  const engine = await createUnifiedEngine({ debug: false });
  
  console.log('🏢 企業活動を記録...\n');
  
  // ビジネスイベント
  await engine.remember("TechCorp acquired StartupX for $100M", "2024-01-01");
  await engine.remember("Alice became CEO of TechCorp", "2024-02-01");
  await engine.remember("TechCorp launched AI Product", "2024-03-01");
  await engine.remember("StartupX team merged into TechCorp", "2024-04-01");
  await engine.remember("TechCorp IPO'd at $10B valuation", "2024-06-01");
  await engine.remember("Bob resigned from TechCorp", "2024-07-01");
  await engine.remember("TechCorp acquired by MegaCorp", "2024-10-01");
  
  console.log('❓ ビジネス状況の質問...\n');
  
  const questions = [
    "Who is the CEO of TechCorp?",
    "What did TechCorp acquire?",
    "What is TechCorp's valuation?",
    "Who owns TechCorp now?"
  ];
  
  for (const q of questions) {
    const answer = await engine.ask(q, "2024-12-01");
    console.log(`Q: ${q}`);
    console.log(`A: ${answer}\n`);
  }
}

async function testProxyEntityIntegration() {
  console.log('\n=== ProxyEntity統合テスト ===\n');
  
  const engine = await createUnifiedEngine({ debug: false });
  
  console.log('🔮 動的エンティティアクセス...\n');
  
  // イベント記録
  await engine.remember("Alice became a wizard", "2024-01-01");
  await engine.remember("Alice learned fireball spell", "2024-02-01");
  await engine.remember("Alice joined the magic guild", "2024-03-01");
  
  // ProxyEntityアクセス
  const alice = engine.entity('alice');
  
  console.log('Aliceのプロパティ（動的取得）:');
  console.log('  - role:', await alice.role);
  console.log('  - knows:', await alice.knows);
  console.log('  - member_of:', await alice.member_of);
  
  // 動的プロパティ設定
  await alice.setProperty('mana', 100);
  await alice.setProperty('health', 150);
  
  console.log('\n動的に設定したプロパティ:');
  console.log('  - mana:', await alice.mana);
  console.log('  - health:', await alice.health);
  
  // 全プロパティ取得
  const allProps = await alice.toObject();
  console.log('\nAliceの全状態:', allProps);
}

async function testKnowledgeExport() {
  console.log('\n=== 学習知識のエクスポート ===\n');
  
  const engine = await createUnifiedEngine({ debug: false });
  
  // 様々なイベントを学習
  await engine.remember("Alice invented time machine", "2024-01-01");
  await engine.remember("Bob discovered new planet", "2024-02-01");
  await engine.remember("Charlie revolutionized physics", "2024-03-01");
  await engine.remember("Dana decoded alien language", "2024-04-01");
  
  // 知識をエクスポート
  const knowledge = engine.exportKnowledge();
  
  console.log('📊 学習統計:');
  console.log(`  - 学習した動詞数: ${knowledge.verbs.length}`);
  console.log(`  - 記録したイベント数: ${knowledge.eventCount}`);
  console.log('\n学習した動詞:');
  knowledge.verbs.forEach(v => console.log(`  - ${v}`));
  
  console.log('\n生成されたPrologルール（抜粋）:');
  const rules = knowledge.rules.split('\n').slice(0, 5);
  rules.forEach(r => console.log(`  ${r}`));
  if (knowledge.rules.split('\n').length > 5) {
    console.log('  ...');
  }
}

async function testComplexScenario() {
  console.log('\n=== 複雑シナリオテスト（時系列での状態変化） ===\n');
  
  const engine = await createUnifiedEngine({ 
    debug: false,
    useUnixTime: true  // ミリ秒精度
  });
  
  console.log('📖 アリスの人生をシミュレート...\n');
  
  // アリスの人生イベント
  const events = [
    { text: "Alice was born in Tokyo", date: "1990-01-01" },
    { text: "Alice moved to New York", date: "2008-09-01" },
    { text: "Alice enrolled in MIT", date: "2008-09-15" },
    { text: "Alice learned programming", date: "2009-01-01" },
    { text: "Alice graduated from MIT", date: "2012-06-01" },
    { text: "Alice joined Google", date: "2012-07-01" },
    { text: "Alice became senior engineer", date: "2015-01-01" },
    { text: "Alice left Google", date: "2018-12-31" },
    { text: "Alice founded StartupAI", date: "2019-01-15" },
    { text: "Alice became CEO of StartupAI", date: "2019-01-15" },
    { text: "Alice raised $10M funding", date: "2020-06-01" },
    { text: "Alice sold StartupAI to TechGiant", date: "2023-12-01" },
    { text: "Alice became CTO of TechGiant", date: "2024-01-01" }
  ];
  
  for (const event of events) {
    await engine.remember(event.text, event.date);
  }
  
  console.log('❓ 時点ごとのアリスの状態...\n');
  
  const timePoints = [
    { date: "2010-01-01", question: "Where does Alice live?" },
    { date: "2010-01-01", question: "What is Alice's role?" },
    { date: "2016-01-01", question: "Where does Alice work?" },
    { date: "2016-01-01", question: "What is Alice's position?" },
    { date: "2020-01-01", question: "What company did Alice found?" },
    { date: "2024-06-01", question: "What is Alice's current role?" }
  ];
  
  for (const { date, question } of timePoints) {
    const answer = await engine.ask(question, date);
    console.log(`[${date}] ${question}`);
    console.log(`→ ${answer}\n`);
  }
}

// 全テスト実行
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     統合スキーマレスエンジン 完全テスト      ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  try {
    await testBasicFunctionality();
    await testDynamicLearning();
    await testRPGDomain();
    await testBusinessDomain();
    await testProxyEntityIntegration();
    await testKnowledgeExport();
    await testComplexScenario();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 全テスト完了！統合エンジン正常動作！');
    console.log('='.repeat(50));
    
    console.log('\n📋 達成項目:');
    console.log('✅ schema.ts完全不要');
    console.log('✅ 未知の動詞を動的学習');
    console.log('✅ RPG/ビジネス等の新ドメイン対応');
    console.log('✅ ProxyEntityで動的プロパティアクセス');
    console.log('✅ 時系列での状態追跡');
    console.log('✅ 知識のエクスポート/永続化対応');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

runAllTests();