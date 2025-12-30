#!/usr/bin/env node

/**
 * Test with real Cloudflare Workers AI
 */

import { WhenM, whenm } from '../../dist/whenm.js';

// Get credentials from environment variables
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_KEY || !CLOUDFLARE_EMAIL) {
  console.error('❌ Missing required environment variables!');
  console.error('Please set:');
  console.error('  CLOUDFLARE_ACCOUNT_ID=your_account_id');
  console.error('  CLOUDFLARE_API_KEY=your_api_key');
  console.error('  CLOUDFLARE_EMAIL=your_email');
  console.error('\nExample:');
  console.error('  CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_KEY=xxx CLOUDFLARE_EMAIL=xxx node test-cloudflare-real.js');
  process.exit(1);
}

async function testBasicExample() {
  console.log('=== Testing with Cloudflare Workers AI ===\n');
  console.log('Account ID:', CLOUDFLARE_ACCOUNT_ID.substring(0, 8) + '...');
  console.log('API Key:', CLOUDFLARE_API_KEY.substring(0, 8) + '...');
  console.log('Email:', CLOUDFLARE_EMAIL, '\n');
  
  try {
    // Create with Cloudflare provider
    console.log('Creating WhenM with Cloudflare provider...');
    const memory = await WhenM.cloudflare({
      accountId: CLOUDFLARE_ACCOUNT_ID,
      apiKey: CLOUDFLARE_API_KEY,
      email: CLOUDFLARE_EMAIL,
      debug: true  // Enable debug to see LLM interactions
    });
    
    console.log('✅ Connected to Cloudflare Workers AI\n');
    
    // Test 1: Career progression
    console.log('📝 Test 1: Career Progression');
    console.log('----------------------------------------');
    await memory.remember("Alice joined as intern", "2020-01-01");
    await memory.remember("Alice became senior engineer", "2022-06-01");
    await memory.remember("Alice became CTO", "2024-01-01");
    
    const role2021 = await memory.ask("What was Alice's role in 2021?");
    console.log("Q: What was Alice's role in 2021?");
    console.log("A:", role2021);
    
    const roleNow = await memory.ask("What is Alice's role now?");
    console.log("Q: What is Alice's role now?");
    console.log("A:", roleNow);
    
    const whenPromoted = await memory.ask("When did Alice become senior engineer?");
    console.log("Q: When did Alice become senior engineer?");
    console.log("A:", whenPromoted);
    
    // Test 2: Knowledge tracking
    console.log('\n📚 Test 2: Knowledge Tracking');
    console.log('----------------------------------------');
    await memory.remember("Bob learned Python", "2019-01-01");
    await memory.remember("Bob learned Rust", "2021-01-01");
    await memory.remember("Bob became tech lead", "2023-01-01");
    
    const skills = await memory.ask("What skills did Bob have when he became tech lead?");
    console.log("Q: What skills did Bob have when he became tech lead?");
    console.log("A:", skills);
    
    // Test 3: Relationship changes
    console.log('\n🏢 Test 3: Relationship Changes');
    console.log('----------------------------------------');
    await memory.remember("TechCorp acquired StartupX", "2024-01-01");
    await memory.remember("StartupX team integrated into TechCorp", "2024-03-01");
    await memory.remember("MegaCorp acquired TechCorp", "2024-10-01");
    
    const owner = await memory.ask("Who owns StartupX now?");
    console.log("Q: Who owns StartupX now?");
    console.log("A:", owner);
    
    // Test 4: Multi-language support
    console.log('\n🌍 Test 4: Multi-Language Support');
    console.log('----------------------------------------');
    await memory.remember("太郎が東京に引っ越した", "2024-01-01");
    const location = await memory.ask("太郎はどこに住んでいる？");
    console.log("Q: 太郎はどこに住んでいる？");
    console.log("A:", location);
    
    // Test 5: Gaming context
    console.log('\n🎮 Test 5: Gaming Context');
    console.log('----------------------------------------');
    await memory.remember("Player defeated dragon", "2024-01-01");
    await memory.remember("Player gained legendary sword", "2024-01-01");
    const loot = await memory.ask("What did the player get from the dragon?");
    console.log("Q: What did the player get from the dragon?");
    console.log("A:", loot);
    
    // Test 6: Made-up verbs
    console.log('\n🔮 Test 6: Made-up Verbs');
    console.log('----------------------------------------');
    await memory.remember("Alice grokked quantum computing", "2024-01-01");
    const grok = await memory.ask("What does Alice grok?");
    console.log("Q: What does Alice grok?");
    console.log("A:", grok);
    
    // Test 7: Temporal reasoning (WhenM vs RAG)
    console.log('\n⏰ Test 7: Temporal Reasoning');
    console.log('----------------------------------------');
    await memory.remember("Charlie was CEO", "2020-01-01");
    await memory.remember("Diana became CEO", "2024-01-01");
    await memory.remember("Charlie retired", "2023-12-31");
    
    const ceo2022 = await memory.ask("Who was CEO in 2022?");
    console.log("Q: Who was CEO in 2022?");
    console.log("A:", ceo2022);
    
    const ceoNow = await memory.ask("Who is CEO now?");
    console.log("Q: Who is CEO now?");
    console.log("A:", ceoNow);
    
    // Test 8: Export knowledge
    console.log('\n💾 Test 8: Knowledge Export');
    console.log('----------------------------------------');
    const knowledge = memory.exportKnowledge();
    console.log("Learned verbs:", knowledge.verbs.slice(0, 10));
    console.log("Event count:", knowledge.eventCount);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All Cloudflare tests completed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

async function testShorthandAPI() {
  console.log('\n\n=== Testing Shorthand API ===\n');
  
  try {
    // Test whenm shorthand
    const memory = await whenm.cloudflare(
      CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL
    );
    
    await memory.remember("Test event", new Date());
    const result = await memory.ask("What happened?");
    console.log("Shorthand API result:", result);
    
  } catch (error) {
    console.error('Shorthand API error:', error.message);
  }
}

// Run tests
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   WhenM + Cloudflare Workers AI Test Suite   ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  await testBasicExample();
  await testShorthandAPI();
}

main().catch(console.error);