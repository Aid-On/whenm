#!/usr/bin/env node

import { whenm } from '../../dist/whenm.js';

async function debugCompound() {
  console.log('Testing compound event parsing\n');
  
  const memory = await whenm.auto();
  
  // Enable debug to see what's happening
  memory.engine.options = { ...memory.engine.options, debug: true };
  
  console.log('Testing: "Nancy joined as Data Scientist"\n');
  await memory.remember("Nancy joined as Data Scientist", "2023-07-15");
  
  console.log('\n=====\n');
  
  console.log('Testing: "Alice joined the company"\n');
  await memory.remember("Alice joined the company", "2023-01-02");
}

debugCompound().catch(console.error);