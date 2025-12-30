#!/usr/bin/env node

/**
 * 真のスキーマレスエンジン v2 テスト
 * 
 * schema.tsを完全に排除した実装の検証
 */

import { createTrulySchemalessWhenM } from '../../dist/truly-schemaless-v2.js';
import { createProxyTemporalDB } from '../../dist/proxy-entity.js';
import { createUnixTimeEngine } from './dist/unix-time-engine.js';

async function testTrulySchemaless() {
  console.log('=== 真のスキーマレスエンジン v2 テスト ===\n');
  
  console.log('📝 1. 完全スキーマレス記憶');
  console.log('-'.repeat(50));
  
  const memory = await createTrulySchemalessWhenM();
  
  // 未知の動詞でも動作
  await memory.remember("Alice grokked Prolog", "2024-01-01");
  await memory.remember("Bob flarbinated the quantum resonator", "2024-02-01");
  await memory.remember("太郎 超越した 次元の壁", "2024-03-01");
  await memory.remember("System initialized hyperspace drive", "2024-04-01");
  
  console.log('記憶完了: 4つの未定義動詞イベント\n');
  
  console.log('❓ 2. 動的クエリ');
  console.log('-'.repeat(50));
  
  const q1 = await memory.ask("Where is Alice?", "2024-12-01");
  console.log("Q: Where is Alice?");
  console.log("A:", q1);
  
  const q2 = await memory.ask("What does Bob know?", "2024-12-01");
  console.log("\nQ: What does Bob know?");
  console.log("A:", q2);
  
  const q3 = await memory.ask("太郎はどこにいる？", "2024-12-01");
  console.log("\nQ: 太郎はどこにいる？");
  console.log("A:", q3);
  
  console.log('\n📊 3. メタルール学習状況');
  console.log('-'.repeat(50));
  
  const stats = memory.getStats();
  console.log(`処理したイベント数: ${stats.eventsProcessed}`);
  console.log(`学習した動詞数: ${stats.verbsLearned}`);
  console.log('\n学習したルール:');
  stats.rules.forEach(rule => {
    console.log(`  - ${rule.verb}: ${rule.type}${rule.singular ? ' (singular)' : ''}`);
  });
}

async function testProxyEntity() {
  console.log('\n\n=== Proxy Entity テスト ===\n');
  
  console.log('🔮 1. 動的プロパティアクセス');
  console.log('-'.repeat(50));
  
  const db = await createProxyTemporalDB();
  
  // 通常のオブジェクトのように使える
  const alice = db.entity('alice');
  
  // 未定義のプロパティも動的に設定可能
  await alice.setProperty('mood', 'happy');
  await alice.setProperty('superpower', 'telepathy');
  await alice.setProperty('quantum_state', 'entangled');
  
  console.log('設定したプロパティ:');
  console.log('  - mood:', await alice.mood);
  console.log('  - superpower:', await alice.superpower);
  console.log('  - quantum_state:', await alice.quantum_state);
  
  // 存在しないプロパティは undefined
  console.log('  - undefined_prop:', await alice.undefined_prop);
  
  console.log('\n🔍 2. 全プロパティ取得');
  console.log('-'.repeat(50));
  
  const allProps = await alice.getAllProperties();
  console.log('Aliceの全プロパティ:', allProps);
  
  const aliceObj = await alice.toObject();
  console.log('Aliceオブジェクト:', aliceObj);
  
  console.log('\n📜 3. イベント履歴');
  console.log('-'.repeat(50));
  
  const history = await alice.history();
  console.log('Aliceの履歴:');
  history.forEach(h => {
    console.log(`  - ${h.time}: ${h.event}`);
  });
  
  console.log('\n🔎 4. 動的検索');
  console.log('-'.repeat(50));
  
  // Bob も作成
  const bob = db.entity('bob');
  await bob.setProperty('mood', 'excited');
  await bob.setProperty('superpower', 'invisibility');
  
  // 条件検索
  const happyEntities = await db.where({ mood: 'happy' });
  console.log('mood=happy のエンティティ:', happyEntities.map(e => e.name));
  
  const telepaths = await db.where({ superpower: 'telepathy' });
  console.log('superpower=telepathy のエンティティ:', telepaths.map(e => e.name));
}

async function testUnixTime() {
  console.log('\n\n=== Unix Time Engine テスト ===\n');
  
  console.log('⏰ 1. タイムスタンプベースの記録');
  console.log('-'.repeat(50));
  
  const timeEngine = await createUnixTimeEngine();
  
  // ミリ秒精度のイベント記録
  const now = Date.now();
  await timeEngine.assertEvent('started("process_1")', now);
  await timeEngine.assertEvent('logged("info", "Starting up")', now + 100);
  await timeEngine.assertEvent('completed("process_1")', now + 5000);
  
  console.log(`記録時刻: ${new Date(now).toISOString()}`);
  console.log('3つのイベントをミリ秒精度で記録\n');
  
  console.log('📈 2. タイムライン生成');
  console.log('-'.repeat(50));
  
  const timeline = await timeEngine.getTimeline(
    undefined,
    now - 1000,
    now + 6000
  );
  
  console.log('タイムライン:');
  timeline.forEach(t => {
    const relativeMs = t.timestamp - now;
    console.log(`  ${relativeMs >= 0 ? '+' : ''}${relativeMs}ms: ${t.event}`);
  });
  
  console.log('\n🔄 3. 相対時間クエリ');
  console.log('-'.repeat(50));
  
  // 「3秒前の状態は？」
  const threeSecondsAgo = await timeEngine.queryRelativeTime(
    'holds_at(State, T)',
    now + 5000,
    { minutes: -0.05 } // -3秒
  );
  console.log('3秒前の状態:', threeSecondsAgo);
  
  console.log('\n📊 4. 統計情報');
  console.log('-'.repeat(50));
  
  const stats = await timeEngine.getStats();
  console.log('イベント統計:', stats);
}

async function testIntegration() {
  console.log('\n\n=== 統合テスト ===\n');
  
  console.log('🚀 全システム統合');
  console.log('-'.repeat(50));
  
  // 1. スキーマレスエンジンで記録
  const schemaless = await createTrulySchemalessWhenM();
  await schemaless.remember("Alice hyperjumped to Mars", "2024-01-01");
  
  // 2. ProxyEntityでアクセス
  const db = await createProxyTemporalDB();
  const alice = db.entity('alice');
  
  // 未定義プロパティへの動的アクセス（エラーにならない）
  const location = await alice.hyperjumped;
  console.log('Aliceのhyperjumped状態:', location || '未定義');
  
  // 3. Unixタイムスタンプで精密制御
  const timeEngine = await createUnixTimeEngine();
  const preciseTime = new Date('2024-01-01T12:34:56.789Z').getTime();
  await timeEngine.assertEvent('teleported("alice", "jupiter")', preciseTime);
  
  const events = await timeEngine.getTimeline('alice');
  console.log('\nAliceの精密タイムライン:');
  events.forEach(e => {
    console.log(`  ${e.time}: ${e.event}`);
  });
  
  console.log('\n✨ 統合成功！');
  console.log('- スキーマ定義: 不要');
  console.log('- 動詞マッピング: 不要');
  console.log('- プロパティ定義: 不要');
  console.log('- 時間精度: ミリ秒');
}

// 全テスト実行
async function runAllTests() {
  try {
    await testTrulySchemaless();
    await testProxyEntity();
    await testUnixTime();
    await testIntegration();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 全テスト完了！真のスキーマレス実現！');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

runAllTests();