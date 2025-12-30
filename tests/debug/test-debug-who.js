#!/usr/bin/env node

/**
 * Debug WHO query accuracy issues
 */

import { whenm } from '../../dist/whenm.js';
import fs from 'fs/promises';

async function debugWho() {
  console.log('='.repeat(60));
  console.log('🔍 WHO Query Debug - Analyzing stored events');
  console.log('='.repeat(60));
  console.log();
  
  // Check if data is loaded
  try {
    await fs.access('.locomo-data-loaded');
    console.log('✅ Using existing data\n');
  } catch {
    console.log('❌ No data loaded yet!');
    process.exit(1);
  }
  
  // Connect to existing data
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  // Get all events
  const allEvents = await memory.engine.allEvents();
  
  // Debug Python learners
  console.log('📚 Python Learning Events:');
  console.log('Expected: 12 people\n');
  
  const pythonEvents = allEvents.filter(e => {
    const eventStr = e.event.toLowerCase();
    return eventStr.includes('learned') && eventStr.includes('python');
  });
  
  const pythonSubjects = pythonEvents.map(e => {
    const match = e.event.match(/event\("([^"]+)"/);
    return match ? match[1] : null;
  }).filter(Boolean);
  
  const uniquePythonLearners = [...new Set(pythonSubjects)];
  console.log(`Found ${uniquePythonLearners.length} unique Python learners:`);
  uniquePythonLearners.sort().forEach(s => console.log(`  - ${s}`));
  
  console.log('\n' + '='.repeat(40) + '\n');
  
  // Debug JavaScript learners
  console.log('💻 JavaScript Learning Events:');
  console.log('Expected: 6 people\n');
  
  const jsEvents = allEvents.filter(e => {
    const eventStr = e.event.toLowerCase();
    return eventStr.includes('learned') && eventStr.includes('javascript');
  });
  
  const jsSubjects = jsEvents.map(e => {
    const match = e.event.match(/event\("([^"]+)"/);
    return match ? match[1] : null;
  }).filter(Boolean);
  
  const uniqueJSLearners = [...new Set(jsSubjects)];
  console.log(`Found ${uniqueJSLearners.length} unique JavaScript learners:`);
  uniqueJSLearners.sort().forEach(s => console.log(`  - ${s}`));
  
  console.log('\n' + '='.repeat(40) + '\n');
  
  // Test the actual query method
  console.log('🧪 Testing query method:\n');
  
  const pythonQuery = await memory.nl("Who learned Python?");
  console.log(`"Who learned Python?" returned ${pythonQuery.length} results`);
  console.log('Query results:', pythonQuery.sort());
  
  const jsQuery = await memory.nl("Who learned JavaScript?");
  console.log(`\n"Who learned JavaScript?" returned ${jsQuery.length} results`);
  console.log('Query results:', jsQuery.sort());
  
  console.log('\n' + '='.repeat(60));
  
  // Show how the WHO query filters work
  console.log('\n📋 WHO Query Filter Analysis:');
  console.log('\nFor "Who learned Python?":');
  console.log('Query words extracted: ["learned", "python"]');
  console.log('Events must contain ALL query words\n');
  
  // Count events that match
  let pythonMatchCount = 0;
  allEvents.forEach(e => {
    const eventStr = e.event.toLowerCase();
    const queryWords = ["learned", "python"];
    const matches = queryWords.every(word => eventStr.includes(word));
    if (matches) {
      pythonMatchCount++;
      if (pythonMatchCount <= 3) {
        console.log(`✓ Matches: ${e.event.substring(0, 80)}...`);
      }
    }
  });
  
  if (pythonMatchCount > 3) {
    console.log(`  ... and ${pythonMatchCount - 3} more`);
  }
  
  console.log(`\nTotal matching events: ${pythonMatchCount}`);
}

debugWho().catch(console.error);