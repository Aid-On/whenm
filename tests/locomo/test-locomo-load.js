#!/usr/bin/env node

/**
 * LoCoMo Data Loader - 一度だけ実行してデータを準備
 */

import { whenm } from '../../dist/whenm.js';
import fs from 'fs/promises';

async function loadData() {
  console.log('='.repeat(60));
  console.log('📚 LoCoMo Data Loader - Preparing Test Data');
  console.log('='.repeat(60));
  console.log();
  
  // Check if already loaded
  try {
    await fs.access('.locomo-data-loaded');
    console.log('✅ Data already loaded! Use test-locomo-query.js to run queries.');
    return;
  } catch {
    // Continue loading
  }
  
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  const events = [
    // === 2023 Q1 ===
    { text: "Alice joined the company", date: "2023-01-02" },
    { text: "Bob joined the company", date: "2023-01-09" },
    { text: "Charlie joined as VP Engineering", date: "2023-01-15" },
    { text: "Diana joined the company", date: "2023-02-01" },
    { text: "Eve joined the company", date: "2023-02-15" },
    { text: "Frank joined as Product Manager", date: "2023-03-01" },
    { text: "Grace joined the company", date: "2023-03-15" },
    
    // Learning events Q1
    { text: "Alice learned Python", date: "2023-01-10" },
    { text: "Alice learned Git", date: "2023-01-12" },
    { text: "Bob learned JavaScript", date: "2023-01-16" },
    { text: "Bob learned React", date: "2023-01-25" },
    { text: "Charlie learned Rust", date: "2023-02-01" },
    { text: "Diana learned Python", date: "2023-02-10" },
    { text: "Diana learned Django", date: "2023-02-20" },
    { text: "Eve learned Go", date: "2023-02-25" },
    { text: "Eve learned Kubernetes", date: "2023-03-05" },
    { text: "Frank learned SQL", date: "2023-03-10" },
    { text: "Grace learned Python", date: "2023-03-20" },
    
    // Achievements
    { text: "Alice won hackathon", date: "2023-04-25" },
    { text: "Bob published tech blog", date: "2023-05-05" },
    { text: "Diana won hackathon", date: "2023-06-10" },
    
    // Promotions
    { text: "Alice became senior engineer", date: "2023-07-01" },
    { text: "Bob became senior engineer", date: "2023-07-15" },
    { text: "Charlie became CTO", date: "2023-08-01" },
    { text: "Diana became tech lead", date: "2023-08-15" },
    
    // More people
    { text: "Nancy joined as Data Scientist", date: "2023-07-15" },
    { text: "Steve joined as Security Engineer", date: "2023-10-15" },
    
    // More learning
    { text: "Steve learned Python", date: "2023-10-20" },
    { text: "Nancy learned Python", date: "2023-08-01" }
  ];
  
  console.log(`📚 Loading ${events.length} events...`);
  const startTime = Date.now();
  
  for (let i = 0; i < events.length; i++) {
    const {text, date} = events[i];
    await memory.remember(text, date);
    
    if ((i + 1) % 5 === 0) {
      console.log(`  ✓ Loaded ${i + 1}/${events.length} events...`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`✅ All events loaded in ${(loadTime/1000).toFixed(2)}s\n`);
  
  // Mark as loaded
  await fs.writeFile('.locomo-data-loaded', new Date().toISOString());
  
  console.log('📝 Data loading complete!');
  console.log('Now run: node test-locomo-query.js');
}

loadData().catch(console.error);