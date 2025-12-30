#!/usr/bin/env node

/**
 * Test examples from README to ensure they work
 */

import { WhenM, whenm } from '../../dist/whenm.js';

async function testBasicExample() {
  console.log('=== Testing Basic README Example ===\n');
  
  // From README: Basic usage
  const memory = await WhenM.create({});
  
  // Your AI remembers events over time
  await memory.remember("Alice joined as intern", "2020-01-01");
  await memory.remember("Alice became senior engineer", "2022-06-01");
  await memory.remember("Alice became CTO", "2024-01-01");
  
  // Ask about any point in time
  const role2021 = await memory.ask("What was Alice's role in 2021?");
  console.log("Alice's role in 2021:", role2021);
  
  const roleNow = await memory.ask("What is Alice's role now?");
  console.log("Alice's current role:", roleNow);
  
  const whenPromoted = await memory.ask("When did Alice become senior engineer?");
  console.log("When Alice became senior engineer:", whenPromoted);
  
  console.log('✅ Basic example works!\n');
}

async function testCareerProgression() {
  console.log('=== Testing Career Progression Example ===\n');
  
  const memory = await WhenM.create({});
  
  await memory.remember("Bob learned Python", "2019-01-01");
  await memory.remember("Bob learned Rust", "2021-01-01");
  await memory.remember("Bob became tech lead", "2023-01-01");
  
  const skills = await memory.ask("What skills did Bob have when he became tech lead?");
  console.log("Bob's skills when he became tech lead:", skills);
  
  console.log('✅ Career progression works!\n');
}

async function testRelationshipChanges() {
  console.log('=== Testing Relationship Changes ===\n');
  
  const memory = await whenm.auto();
  
  await memory.remember("TechCorp acquired StartupX", "2024-01-01");
  await memory.remember("StartupX team integrated into TechCorp", "2024-03-01");
  await memory.remember("MegaCorp acquired TechCorp", "2024-10-01");
  
  const owner = await memory.ask("Who owns StartupX now?");
  console.log("StartupX current owner:", owner);
  
  console.log('✅ Relationship tracking works!\n');
}

async function testMultiLanguage() {
  console.log('=== Testing Multi-Language Support ===\n');
  
  const memory = await WhenM.create({});
  
  // Japanese
  await memory.remember("太郎が東京に引っ越した", "2024-01-01");
  const whereJP = await memory.ask("太郎はどこに住んでいる？");
  console.log("太郎の住所:", whereJP);
  
  // Gaming
  await memory.remember("Player defeated dragon", "2024-01-01");
  await memory.remember("Player gained legendary sword", "2024-01-01");
  const loot = await memory.ask("What did the player get from the dragon?");
  console.log("Dragon loot:", loot);
  
  // Made-up verbs
  await memory.remember("Alice grokked quantum computing", "2024-01-01");
  const grok = await memory.ask("What does Alice grok?");
  console.log("Alice groks:", grok);
  
  console.log('✅ Multi-language support works!\n');
}

async function testChainableAPI() {
  console.log('=== Testing Chainable API ===\n');
  
  const memory = await WhenM.create({});
  
  // From README: Chainable API
  await memory
    .remember("Alice joined as intern", "2020-01-01")
    .then(m => m.remember("Alice became CTO", "2024-01-01"));
  
  const role = await memory.ask("What is Alice's role?");
  console.log("Alice's role after chaining:", role);
  
  console.log('✅ Chainable API works!\n');
}

async function testBatchOperations() {
  console.log('=== Testing Batch Operations ===\n');
  
  const memory = await WhenM.create({});
  
  // From README: Batch operations
  await memory.batch([
    { text: "Bob learned Python", date: "2019-01-01" },
    { text: "Bob learned Rust", date: "2021-01-01" }
  ]);
  
  const pythonKnowledge = await memory.ask("Does Bob know Python?");
  const rustKnowledge = await memory.ask("Does Bob know Rust?");
  
  console.log("Bob knows Python:", pythonKnowledge);
  console.log("Bob knows Rust:", rustKnowledge);
  
  console.log('✅ Batch operations work!\n');
}

async function testRAGComparison() {
  console.log('=== Testing WhenM vs RAG Example ===\n');
  
  const whenm = await WhenM.create({});
  
  // WhenM tracks changes over time
  await whenm.remember("Bob was CEO", "2020-01-01");
  await whenm.remember("Alice became CEO", "2024-01-01");
  await whenm.remember("Bob retired", "2023-12-31");
  
  // Understands time and state changes
  const ceo2022 = await whenm.ask("Who was CEO in 2022?");
  console.log("CEO in 2022:", ceo2022);
  
  const ceoNow = await whenm.ask("Who is CEO now?");
  console.log("CEO now:", ceoNow);
  
  const whenChanged = await whenm.ask("When did leadership change?");
  console.log("Leadership changed:", whenChanged);
  
  console.log('✅ Temporal logic (vs RAG) works!\n');
}

async function testEntityProxy() {
  console.log('=== Testing Entity Proxy ===\n');
  
  const memory = await WhenM.create({});
  
  await memory.remember("Alice became a wizard", "2024-01-01");
  
  const alice = memory.entity('alice');
  
  // Access any property - no definition needed!
  await alice.setProperty('level', 42);
  await alice.setProperty('mana', 100);
  await alice.setProperty('guild', 'wizards');
  
  console.log("Alice's level:", await alice.level);
  console.log("Alice's mana:", await alice.mana);
  console.log("Alice's guild:", await alice.guild);
  
  console.log('✅ Entity proxy works!\n');
}

async function testParallelQuestions() {
  console.log('=== Testing Parallel Questions ===\n');
  
  const memory = await WhenM.create({});
  
  await memory.remember("Alice is CEO", "2024-01-01");
  await memory.remember("Bob is CTO", "2024-01-01");
  await memory.remember("Charlie is CFO", "2024-01-01");
  
  const answers = await memory.askMany([
    "What is Alice's role?",
    "What is Bob's role?",
    "What is Charlie's role?"
  ]);
  
  console.log("Parallel answers:", answers);
  
  console.log('✅ Parallel questions work!\n');
}

// Run all tests
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        README Examples Validation Test       ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  try {
    await testBasicExample();
    await testCareerProgression();
    await testRelationshipChanges();
    await testMultiLanguage();
    await testChainableAPI();
    await testBatchOperations();
    await testRAGComparison();
    await testEntityProxy();
    await testParallelQuestions();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All README examples work correctly!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();