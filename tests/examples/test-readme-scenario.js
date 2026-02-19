#!/usr/bin/env node

/**
 * Test the exact scenario from README
 */

import { WhenM } from '../../dist/whenm.js';

function checkRequiredEnvVars() {
  const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_KEY', 'CLOUDFLARE_EMAIL'];
  const missing = required.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing.join(', '));
    process.exit(1);
  }
}

function checkMatch(actual, expected, label) {
  const match = actual.toLowerCase().includes(expected.toLowerCase());
  console.log(`Q: ${label}`);
  console.log(`A: ${actual}`);
  console.log(`Expected: ${expected}`);
  console.log(`Match: ${match ? 'PASS' : 'FAIL'}\n`);
  return match;
}

async function testREADMEScenario() {
  console.log('=== Testing README Scenario ===\n');
  checkRequiredEnvVars();

  try {
    console.log('1. Creating WhenM instance...');
    const memory = await WhenM.cloudflare({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiKey: process.env.CLOUDFLARE_API_KEY,
      email: process.env.CLOUDFLARE_EMAIL,
      debug: true
    });
    console.log('Connected to Cloudflare Workers AI\n');

    console.log("2. Recording Alice's career progression...");
    await memory.remember("Alice joined as intern", "2020-01-01");
    await memory.remember("Alice became senior engineer", "2022-06-01");
    await memory.remember("Alice became CTO", "2024-01-01");
    console.log('Events recorded.\n');

    console.log('3. Testing temporal queries...\n');
    const role2021 = await memory.ask("What was Alice's role in 2021?");
    const roleNow = await memory.ask("What is Alice's role now?");
    const whenPromoted = await memory.ask("When did Alice become senior engineer?");

    const r1 = checkMatch(role2021, 'intern', "What was Alice's role in 2021?");
    const r2 = checkMatch(roleNow, 'cto', "What is Alice's role now?");
    const r3 = checkMatch(whenPromoted, '2022', "When did Alice become senior engineer?");

    console.log('='.repeat(50));
    console.log(r1 && r2 && r3 ? 'All README scenarios passed!' : 'Some scenarios failed');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testREADMEScenario().catch(console.error);
