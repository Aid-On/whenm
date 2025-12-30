#!/usr/bin/env node

import { WhenM } from '../../dist/whenm.js';

async function test() {
  console.log('=== Debug Test ===\n');
  
  // Enable debug mode
  const memory = await WhenM.create({ debug: true });
  
  // Simple test
  console.log('1. Recording event...');
  await memory.remember("Alice became CEO", "2024-01-01");
  
  console.log('\n2. Asking question...');
  const role = await memory.ask("What is Alice's role?");
  
  console.log('\nResult:', role);
  
  console.log('\n3. Test direct entity access...');
  const alice = memory.entity('alice');
  await alice.setProperty('test', 'value');
  const testValue = await alice.test;
  console.log('Property test value:', testValue);
}

test().catch(console.error);