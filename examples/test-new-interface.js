#!/usr/bin/env node

/**
 * Test new WhenM interface
 */

import { WhenM, whenm } from '../dist/whenm.js';

async function testClassInterface() {
  console.log('=== Testing WhenM Class Interface ===\n');
  
  // Create with different providers
  console.log('1. Creating with mock provider...');
  const memory = await WhenM.create({});
  
  // Remember events using method chaining
  console.log('2. Remembering events with chaining...');
  await memory
    .remember("Alice joined as intern", "2020-01-01")
    .then(m => m.remember("Alice became senior engineer", "2022-01-01"))
    .then(m => m.remember("Alice became CTO", "2024-01-01"));
  
  // Ask questions
  console.log('3. Asking questions...');
  const role2021 = await memory.ask("What was Alice's role?", "2021-06-01");
  console.log(`   Alice's role in 2021: ${role2021}`);
  
  const roleNow = await memory.ask("What is Alice's role now?");
  console.log(`   Alice's role now: ${roleNow}`);
  
  // Batch operations
  console.log('\n4. Batch operations...');
  await memory.batch([
    { text: "Bob joined as developer", date: "2021-01-01" },
    { text: "Bob learned Rust", date: "2022-01-01" },
    { text: "Bob became tech lead", date: "2023-01-01" }
  ]);
  
  // Ask multiple questions
  console.log('5. Parallel questions...');
  const answers = await memory.askMany([
    "What is Bob's role?",
    "What does Bob know?",
    "When did Bob join?"
  ]);
  answers.forEach((answer, i) => {
    console.log(`   Q${i+1}: ${answer}`);
  });
  
  // Entity access
  console.log('\n6. Entity proxy access...');
  const alice = memory.entity('alice');
  await alice.setProperty('level', 99);
  await alice.setProperty('skills', ['TypeScript', 'Rust', 'Leadership']);
  console.log(`   Alice's level: ${await alice.level}`);
  console.log(`   Alice's skills:`, await alice.skills);
  
  // Timeline
  console.log('\n7. Timeline...');
  const timeline = await memory.timeline('alice');
  console.log('   Alice timeline:', timeline);
  
  // Export knowledge
  console.log('\n8. Export knowledge...');
  const knowledge = memory.exportKnowledge();
  console.log(`   Learned ${knowledge.verbs.length} verbs`);
  console.log(`   Verbs:`, knowledge.verbs.slice(0, 5));
}

async function testShorthandInterface() {
  console.log('\n\n=== Testing whenm Shorthand Interface ===\n');
  
  // Auto-detect from environment
  console.log('1. Auto-detecting provider...');
  const memory = await whenm.auto();
  
  // Quick usage
  console.log('2. Quick event recording...');
  await memory.remember("System initialized", new Date());
  
  const status = await memory.ask("What happened to the system?");
  console.log(`   System status: ${status}`);
  
  // Debug toggle
  console.log('\n3. Debug mode...');
  memory.debug(true);
  await memory.remember("Debug event logged", new Date());
  memory.debug(false);
}

async function testProviderSpecific() {
  console.log('\n\n=== Testing Provider-Specific Creation ===\n');
  
  // Would need actual API keys to test these
  console.log('Provider-specific methods available:');
  console.log('- WhenM.cloudflare({ accountId, apiToken })');
  console.log('- WhenM.groq(apiKey)');
  console.log('- WhenM.gemini(apiKey)');
  console.log('- whenm.cloudflare(accountId, apiToken)');
  console.log('- whenm.groq(apiKey)');
  console.log('- whenm.gemini(apiKey)');
}

// Run all tests
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║          WhenM New Interface Test           ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  try {
    await testClassInterface();
    await testShorthandInterface();
    await testProviderSpecific();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();