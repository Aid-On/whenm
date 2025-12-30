#!/usr/bin/env node

/**
 * Test the exact scenario from README
 */

import { WhenM } from '../../dist/whenm.js';

async function testREADMEScenario() {
  console.log('=== Testing README Scenario ===\n');
  
  // Check for environment variables
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_KEY || !process.env.CLOUDFLARE_EMAIL) {
    console.error('❌ Missing environment variables!');
    console.error('Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_KEY, and CLOUDFLARE_EMAIL');
    process.exit(1);
  }
  
  try {
    // Create memory instance exactly as shown in README
    console.log('1. Creating WhenM instance...');
    const memory = await WhenM.cloudflare({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiKey: process.env.CLOUDFLARE_API_KEY,
      email: process.env.CLOUDFLARE_EMAIL,
      debug: true  // Enable debug to see what's happening
    });
    console.log('✅ Connected to Cloudflare Workers AI\n');
    
    // Test the exact README scenario
    console.log('2. Recording Alice\'s career progression...');
    await memory.remember("Alice joined as intern", "2020-01-01");
    console.log('✅ Recorded: Alice joined as intern (2020-01-01)');
    
    await memory.remember("Alice became senior engineer", "2022-06-01");
    console.log('✅ Recorded: Alice became senior engineer (2022-06-01)');
    
    await memory.remember("Alice became CTO", "2024-01-01");
    console.log('✅ Recorded: Alice became CTO (2024-01-01)\n');
    
    // Test questions from README
    console.log('3. Testing temporal queries...\n');
    
    console.log('Q: What was Alice\'s role in 2021?');
    const role2021 = await memory.ask("What was Alice's role in 2021?");
    console.log('A:', role2021);
    console.log('Expected: intern');
    console.log('Match:', role2021.toLowerCase().includes('intern') ? '✅' : '❌');
    
    console.log('\nQ: What is Alice\'s role now?');
    const roleNow = await memory.ask("What is Alice's role now?");
    console.log('A:', roleNow);
    console.log('Expected: CTO');
    console.log('Match:', roleNow.toLowerCase().includes('cto') ? '✅' : '❌');
    
    console.log('\nQ: When did Alice become senior engineer?');
    const whenPromoted = await memory.ask("When did Alice become senior engineer?");
    console.log('A:', whenPromoted);
    console.log('Expected: 2022-06-01 (or June 2022)');
    console.log('Match:', whenPromoted.includes('2022') ? '✅' : '❌');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Test Summary:');
    const success = 
      role2021.toLowerCase().includes('intern') &&
      roleNow.toLowerCase().includes('cto') &&
      whenPromoted.includes('2022');
    
    if (success) {
      console.log('✅ All README scenarios passed!');
    } else {
      console.log('❌ Some scenarios failed - temporal reasoning may need adjustment');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testREADMEScenario().catch(console.error);