#!/usr/bin/env node

/**
 * LoCoMo Massive Benchmark Test
 * 
 * 100+ イベントで品質検証
 */

import { whenm } from '../../dist/whenm.js';

async function testLoCoMoMassive() {
  console.log('='.repeat(80));
  console.log('🚀 LoCoMo MASSIVE Benchmark Test (100+ Events)');
  console.log('='.repeat(80));
  console.log();
  
  // Use Cloudflare for production test
  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );
  
  // Massive event dataset - realistic company history
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
    
    // Project events Q1
    { text: "Alice completed onboarding", date: "2023-01-20" },
    { text: "Bob completed onboarding", date: "2023-01-30" },
    { text: "Alice built authentication system", date: "2023-02-15" },
    { text: "Bob built frontend dashboard", date: "2023-02-28" },
    { text: "Diana deployed API service", date: "2023-03-10" },
    { text: "Eve configured CI/CD pipeline", date: "2023-03-15" },
    
    // === 2023 Q2 ===
    { text: "Henry joined the company", date: "2023-04-01" },
    { text: "Iris joined the company", date: "2023-04-15" },
    { text: "Jack joined as DevOps Engineer", date: "2023-05-01" },
    { text: "Kate joined the company", date: "2023-05-15" },
    { text: "Leo joined the company", date: "2023-06-01" },
    
    // Learning events Q2
    { text: "Alice learned TypeScript", date: "2023-04-05" },
    { text: "Alice learned Docker", date: "2023-04-15" },
    { text: "Bob learned TypeScript", date: "2023-04-10" },
    { text: "Bob learned GraphQL", date: "2023-04-20" },
    { text: "Charlie learned Python", date: "2023-05-01" },
    { text: "Diana learned React", date: "2023-05-10" },
    { text: "Eve learned Rust", date: "2023-05-15" },
    { text: "Frank learned Python", date: "2023-05-20" },
    { text: "Grace learned JavaScript", date: "2023-06-01" },
    { text: "Henry learned Java", date: "2023-06-10" },
    { text: "Iris learned Python", date: "2023-06-15" },
    { text: "Jack learned Terraform", date: "2023-06-20" },
    { text: "Kate learned Ruby", date: "2023-06-25" },
    
    // Achievements Q2
    { text: "Alice won hackathon", date: "2023-04-25" },
    { text: "Bob published tech blog", date: "2023-05-05" },
    { text: "Charlie gave conference talk", date: "2023-05-25" },
    { text: "Diana won hackathon", date: "2023-06-10" },
    { text: "Eve published research paper", date: "2023-06-20" },
    
    // === 2023 Q3 ===
    { text: "Mike joined the company", date: "2023-07-01" },
    { text: "Nancy joined as Data Scientist", date: "2023-07-15" },
    { text: "Oscar joined the company", date: "2023-08-01" },
    { text: "Patricia joined the company", date: "2023-08-15" },
    { text: "Quinn joined the company", date: "2023-09-01" },
    
    // Promotions Q3
    { text: "Alice became senior engineer", date: "2023-07-01" },
    { text: "Bob became senior engineer", date: "2023-07-15" },
    { text: "Charlie became CTO", date: "2023-08-01" },
    { text: "Diana became tech lead", date: "2023-08-15" },
    { text: "Eve became principal engineer", date: "2023-09-01" },
    
    // Learning events Q3
    { text: "Alice learned Kubernetes", date: "2023-07-10" },
    { text: "Alice learned AWS", date: "2023-07-20" },
    { text: "Bob learned AWS", date: "2023-07-25" },
    { text: "Leo learned Python", date: "2023-07-05" },
    { text: "Mike learned JavaScript", date: "2023-08-01" },
    { text: "Mike learned Python", date: "2023-08-10" },
    { text: "Nancy learned Python", date: "2023-08-01" },
    { text: "Nancy learned TensorFlow", date: "2023-08-15" },
    { text: "Oscar learned Go", date: "2023-09-01" },
    { text: "Patricia learned Java", date: "2023-09-10" },
    { text: "Quinn learned Python", date: "2023-09-15" },
    
    // === 2023 Q4 ===
    { text: "Rachel joined the company", date: "2023-10-01" },
    { text: "Steve joined as Security Engineer", date: "2023-10-15" },
    { text: "Tina joined the company", date: "2023-11-01" },
    { text: "Uma joined the company", date: "2023-11-15" },
    { text: "Victor joined the company", date: "2023-12-01" },
    
    // Learning events Q4
    { text: "Rachel learned JavaScript", date: "2023-10-10" },
    { text: "Steve learned Python", date: "2023-10-20" },
    { text: "Steve learned security tools", date: "2023-10-25" },
    { text: "Tina learned React", date: "2023-11-10" },
    { text: "Uma learned Python", date: "2023-11-20" },
    { text: "Victor learned Go", date: "2023-12-10" },
    
    // Major milestones Q4
    { text: "Alice launched product feature", date: "2023-10-15" },
    { text: "Bob launched mobile app", date: "2023-11-01" },
    { text: "Diana launched ML platform", date: "2023-11-15" },
    { text: "Eve launched microservices", date: "2023-12-01" },
    
    // === 2024 Q1 ===
    { text: "Walter joined the company", date: "2024-01-05" },
    { text: "Xena joined as AI Engineer", date: "2024-01-15" },
    { text: "Yuki joined the company", date: "2024-02-01" },
    { text: "Zara joined the company", date: "2024-02-15" },
    
    // More learning
    { text: "Walter learned Rust", date: "2024-01-20" },
    { text: "Xena learned Python", date: "2024-01-25" },
    { text: "Xena learned PyTorch", date: "2024-02-05" },
    { text: "Yuki learned JavaScript", date: "2024-02-10" },
    { text: "Zara learned Python", date: "2024-02-20" },
    
    // Team events
    { text: "Alice mentored Mike", date: "2024-01-10" },
    { text: "Bob mentored Rachel", date: "2024-01-15" },
    { text: "Diana mentored Nancy", date: "2024-02-01" },
    { text: "Eve mentored Oscar", date: "2024-02-10" },
    
    // Final achievements
    { text: "Alice became VP Engineering", date: "2024-03-01" },
    { text: "Bob became Engineering Manager", date: "2024-03-01" },
    { text: "Frank became Senior PM", date: "2024-03-01" },
    { text: "Grace became tech lead", date: "2024-03-01" }
  ];
  
  console.log(`📚 Loading ${events.length} events...`);
  const startTime = Date.now();
  
  for (let i = 0; i < events.length; i++) {
    const {text, date} = events[i];
    await memory.remember(text, date);
    
    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Loaded ${i + 1}/${events.length} events...`);
      // Small delay every 10 events to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`✅ All events loaded in ${(loadTime/1000).toFixed(2)}s\n`);
  
  // Comprehensive test queries
  const queries = [
    // === WHO queries ===
    { 
      q: "Who learned Python?", 
      type: "Who",
      expectedCount: 14, // Alice, Diana, Grace, Charlie, Frank, Iris, Leo, Mike, Nancy, Quinn, Steve, Uma, Xena, Zara
      description: "Multiple people learned Python across timeline"
    },
    { 
      q: "Who learned JavaScript?",
      type: "Who", 
      expectedCount: 5, // Bob, Grace, Mike, Rachel, Yuki
      description: "JavaScript learners"
    },
    {
      q: "Who became senior engineer?",
      type: "Who",
      expectedCount: 2, // Alice, Bob
      description: "Senior engineer promotions"
    },
    {
      q: "Who won hackathon?",
      type: "Who",
      expectedCount: 2, // Alice, Diana
      description: "Hackathon winners"
    },
    
    // === WHEN queries ===
    { 
      q: "When did Alice become VP Engineering?",
      type: "When",
      expected: "2024-03-01",
      description: "Alice's final promotion"
    },
    {
      q: "When did Charlie become CTO?",
      type: "When",
      expected: "2023-08-01",
      description: "Charlie's CTO promotion"
    },
    {
      q: "When did Nancy join the company?",
      type: "When",
      expected: "2023-07-15",
      description: "Nancy's join date"
    },
    
    // === WHAT queries ===
    {
      q: "What did Alice learn?",
      type: "What",
      expectedItems: ["Python", "Git", "TypeScript", "Docker", "Kubernetes", "AWS"],
      description: "Alice's complete learning journey"
    },
    {
      q: "What did Steve learn?",
      type: "What",
      expectedItems: ["Python", "security tools"],
      description: "Steve's security-focused learning"
    },
    
    // === HOW MANY queries ===
    {
      q: "How many people learned Python?",
      type: "Count",
      expected: 14,
      description: "Total Python learners"
    },
    {
      q: "How many people joined the company?",
      type: "Count", 
      expected: 26, // All unique people who joined
      description: "Total hires"
    },
    {
      q: "How many times did Alice learn something?",
      type: "Count",
      expected: 6,
      description: "Alice's learning count"
    },
    {
      q: "How many people became senior engineer?",
      type: "Count",
      expected: 2,
      description: "Senior engineer promotions"
    },
    
    // === COMPLEX queries ===
    {
      q: "Who joined as CTO?",
      type: "Who",
      expectedCount: 0, // Charlie joined as VP, became CTO later
      description: "Direct CTO hires (should be 0)"
    },
    {
      q: "How many people learned Rust?",
      type: "Count",
      expected: 3, // Charlie, Eve, Walter
      description: "Rust adopters"
    },
    {
      q: "How many people learned AWS?",
      type: "Count",
      expected: 2, // Alice, Bob
      description: "AWS learners"
    }
  ];
  
  console.log('🧪 Running comprehensive queries:\n');
  
  let correct = 0;
  let total = queries.length;
  const queryStartTime = Date.now();
  
  for (const query of queries) {
    const {q, type, expected, expectedCount, expectedItems, description} = query;
    console.log(`[${type}] ${q}`);
    console.log(`Description: ${description}`);
    
    try {
      const result = await memory.nl(q);
      const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
      
      let isCorrect = false;
      let expectedStr = '';
      
      if (expectedCount !== undefined) {
        // For Who queries with expectedCount
        const actualCount = Array.isArray(result) ? result.length : (result?.count || 0);
        isCorrect = actualCount === expectedCount;
        expectedStr = `${expectedCount} people/items`;
        console.log(`Result: Found ${actualCount} items`);
      } else if (expectedItems) {
        // For What queries checking multiple items
        isCorrect = expectedItems.every(item => 
          resultStr.toLowerCase().includes(item.toLowerCase())
        );
        expectedStr = expectedItems.join(', ');
        console.log(`Result: ${resultStr.slice(0, 100)}...`);
      } else if (expected !== undefined) {
        // For exact match (When, Count)
        isCorrect = resultStr.includes(String(expected));
        expectedStr = String(expected);
        console.log(`Result: ${resultStr.slice(0, 100)}...`);
      }
      
      console.log(`Expected: ${expectedStr}`);
      console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
      
      if (isCorrect) correct++;
      
      // Delay between queries
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log(`Status: ❌ FAIL\n`);
    }
  }
  
  const queryTime = Date.now() - queryStartTime;
  
  console.log('='.repeat(80));
  console.log(`📊 Test Results: ${correct}/${total} (${(correct/total*100).toFixed(1)}%)`);
  console.log(`⏱️ Performance: ${(queryTime/1000).toFixed(2)}s for ${total} queries`);
  console.log(`📈 Average: ${(queryTime/total).toFixed(0)}ms per query`);
  console.log('='.repeat(80));
  
  if (correct === total) {
    console.log('\n🏆 PERFECT SCORE! WhenM handles massive datasets flawlessly!');
  } else if (correct/total >= 0.9) {
    console.log('\n🎉 Excellent performance! Over 90% accuracy on massive dataset!');
  } else if (correct/total >= 0.8) {
    console.log('\n✅ Good performance! 80%+ accuracy maintained at scale.');
  } else {
    console.log('\n⚠️ Performance degradation detected at scale. Needs optimization.');
  }
  
  // Summary statistics
  console.log('\n📊 Dataset Statistics:');
  console.log(`  • Total events: ${events.length}`);
  console.log(`  • Unique people: 26`);
  console.log(`  • Time span: 2023-01-02 to 2024-03-01`);
  console.log(`  • Event types: join, learn, become, win, launch, mentor, etc.`);
}

testLoCoMoMassive().catch(console.error);