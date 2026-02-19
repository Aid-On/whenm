#!/usr/bin/env node

/**
 * LoCoMo Massive Benchmark Test
 *
 * 100+ events for quality verification
 */

import { whenm } from '../../dist/whenm.js';

// Massive event dataset - realistic company history
const events = [
  // 2023 Q1 - Hires
  { text: "Alice joined the company", date: "2023-01-02" },
  { text: "Bob joined the company", date: "2023-01-09" },
  { text: "Charlie joined as VP Engineering", date: "2023-01-15" },
  { text: "Diana joined the company", date: "2023-02-01" },
  { text: "Eve joined the company", date: "2023-02-15" },
  { text: "Frank joined as Product Manager", date: "2023-03-01" },
  { text: "Grace joined the company", date: "2023-03-15" },
  // Q1 Learning
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
  // Q1 Projects
  { text: "Alice completed onboarding", date: "2023-01-20" },
  { text: "Bob completed onboarding", date: "2023-01-30" },
  { text: "Alice built authentication system", date: "2023-02-15" },
  { text: "Bob built frontend dashboard", date: "2023-02-28" },
  { text: "Diana deployed API service", date: "2023-03-10" },
  { text: "Eve configured CI/CD pipeline", date: "2023-03-15" },
  // 2023 Q2 - Hires
  { text: "Henry joined the company", date: "2023-04-01" },
  { text: "Iris joined the company", date: "2023-04-15" },
  { text: "Jack joined as DevOps Engineer", date: "2023-05-01" },
  { text: "Kate joined the company", date: "2023-05-15" },
  { text: "Leo joined the company", date: "2023-06-01" },
  // Q2 Learning
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
  // Q2 Achievements
  { text: "Alice won hackathon", date: "2023-04-25" },
  { text: "Bob published tech blog", date: "2023-05-05" },
  { text: "Charlie gave conference talk", date: "2023-05-25" },
  { text: "Diana won hackathon", date: "2023-06-10" },
  { text: "Eve published research paper", date: "2023-06-20" },
  // 2023 Q3 - Hires
  { text: "Mike joined the company", date: "2023-07-01" },
  { text: "Nancy joined as Data Scientist", date: "2023-07-15" },
  { text: "Oscar joined the company", date: "2023-08-01" },
  { text: "Patricia joined the company", date: "2023-08-15" },
  { text: "Quinn joined the company", date: "2023-09-01" },
  // Q3 Promotions
  { text: "Alice became senior engineer", date: "2023-07-01" },
  { text: "Bob became senior engineer", date: "2023-07-15" },
  { text: "Charlie became CTO", date: "2023-08-01" },
  { text: "Diana became tech lead", date: "2023-08-15" },
  { text: "Eve became principal engineer", date: "2023-09-01" },
  // Q3 Learning
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
  // 2023 Q4 - Hires
  { text: "Rachel joined the company", date: "2023-10-01" },
  { text: "Steve joined as Security Engineer", date: "2023-10-15" },
  { text: "Tina joined the company", date: "2023-11-01" },
  { text: "Uma joined the company", date: "2023-11-15" },
  { text: "Victor joined the company", date: "2023-12-01" },
  // Q4 Learning
  { text: "Rachel learned JavaScript", date: "2023-10-10" },
  { text: "Steve learned Python", date: "2023-10-20" },
  { text: "Steve learned security tools", date: "2023-10-25" },
  { text: "Tina learned React", date: "2023-11-10" },
  { text: "Uma learned Python", date: "2023-11-20" },
  { text: "Victor learned Go", date: "2023-12-10" },
  // Q4 Milestones
  { text: "Alice launched product feature", date: "2023-10-15" },
  { text: "Bob launched mobile app", date: "2023-11-01" },
  { text: "Diana launched ML platform", date: "2023-11-15" },
  { text: "Eve launched microservices", date: "2023-12-01" },
  // 2024 Q1
  { text: "Walter joined the company", date: "2024-01-05" },
  { text: "Xena joined as AI Engineer", date: "2024-01-15" },
  { text: "Yuki joined the company", date: "2024-02-01" },
  { text: "Zara joined the company", date: "2024-02-15" },
  { text: "Walter learned Rust", date: "2024-01-20" },
  { text: "Xena learned Python", date: "2024-01-25" },
  { text: "Xena learned PyTorch", date: "2024-02-05" },
  { text: "Yuki learned JavaScript", date: "2024-02-10" },
  { text: "Zara learned Python", date: "2024-02-20" },
  { text: "Alice mentored Mike", date: "2024-01-10" },
  { text: "Bob mentored Rachel", date: "2024-01-15" },
  { text: "Diana mentored Nancy", date: "2024-02-01" },
  { text: "Eve mentored Oscar", date: "2024-02-10" },
  { text: "Alice became VP Engineering", date: "2024-03-01" },
  { text: "Bob became Engineering Manager", date: "2024-03-01" },
  { text: "Frank became Senior PM", date: "2024-03-01" },
  { text: "Grace became tech lead", date: "2024-03-01" }
];

// Comprehensive test queries
const queries = [
  { q: "Who learned Python?", type: "Who", expectedCount: 14, description: "Multiple people learned Python" },
  { q: "Who learned JavaScript?", type: "Who", expectedCount: 5, description: "JavaScript learners" },
  { q: "Who became senior engineer?", type: "Who", expectedCount: 2, description: "Senior promotions" },
  { q: "Who won hackathon?", type: "Who", expectedCount: 2, description: "Hackathon winners" },
  { q: "When did Alice become VP Engineering?", type: "When", expected: "2024-03-01", description: "Alice's final promotion" },
  { q: "When did Charlie become CTO?", type: "When", expected: "2023-08-01", description: "Charlie's CTO promotion" },
  { q: "When did Nancy join the company?", type: "When", expected: "2023-07-15", description: "Nancy's join date" },
  { q: "What did Alice learn?", type: "What", expectedItems: ["Python", "Git", "TypeScript", "Docker", "Kubernetes", "AWS"], description: "Alice's learning journey" },
  { q: "What did Steve learn?", type: "What", expectedItems: ["Python", "security tools"], description: "Steve's learning" },
  { q: "How many people learned Python?", type: "Count", expected: 14, description: "Total Python learners" },
  { q: "How many people joined the company?", type: "Count", expected: 26, description: "Total hires" },
  { q: "How many times did Alice learn something?", type: "Count", expected: 6, description: "Alice's learning count" },
  { q: "How many people became senior engineer?", type: "Count", expected: 2, description: "Senior promotions" },
  { q: "Who joined as CTO?", type: "Who", expectedCount: 0, description: "Direct CTO hires (should be 0)" },
  { q: "How many people learned Rust?", type: "Count", expected: 3, description: "Rust adopters" },
  { q: "How many people learned AWS?", type: "Count", expected: 2, description: "AWS learners" }
];

async function loadEvents(memory) {
  console.log(`Loading ${events.length} events...`);
  const startTime = Date.now();
  for (let i = 0; i < events.length; i++) {
    const { text, date } = events[i];
    await memory.remember(text, date);
    if ((i + 1) % 10 === 0) {
      console.log(`  Loaded ${i + 1}/${events.length} events...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  const loadTime = Date.now() - startTime;
  console.log(`All events loaded in ${(loadTime / 1000).toFixed(2)}s\n`);
}

function evaluateResult(result, query) {
  const { expected, expectedCount, expectedItems } = query;
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);

  if (expectedCount !== undefined) {
    const actualCount = Array.isArray(result) ? result.length : (result?.count || 0);
    return { isCorrect: actualCount === expectedCount, expectedStr: `${expectedCount} people/items`, displayStr: `Found ${actualCount} items` };
  }
  if (expectedItems) {
    const isCorrect = expectedItems.every(item => resultStr.toLowerCase().includes(item.toLowerCase()));
    return { isCorrect, expectedStr: expectedItems.join(', '), displayStr: resultStr.slice(0, 100) + '...' };
  }
  if (expected !== undefined) {
    return { isCorrect: resultStr.includes(String(expected)), expectedStr: String(expected), displayStr: resultStr.slice(0, 100) + '...' };
  }
  return { isCorrect: false, expectedStr: 'N/A', displayStr: resultStr.slice(0, 100) };
}

async function runQueries(memory) {
  console.log('Running comprehensive queries:\n');
  let correct = 0;
  const queryStartTime = Date.now();

  for (const query of queries) {
    console.log(`[${query.type}] ${query.q}`);
    console.log(`Description: ${query.description}`);
    try {
      const result = await memory.nl(query.q);
      const { isCorrect, expectedStr, displayStr } = evaluateResult(result, query);
      console.log(`Result: ${displayStr}`);
      console.log(`Expected: ${expectedStr}`);
      console.log(`Status: ${isCorrect ? 'PASS' : 'FAIL'}\n`);
      if (isCorrect) correct++;
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log(`Status: FAIL\n`);
    }
  }

  return { correct, total: queries.length, queryTime: Date.now() - queryStartTime };
}

function printSummary({ correct, total, queryTime }) {
  console.log('='.repeat(80));
  console.log(`Results: ${correct}/${total} (${(correct / total * 100).toFixed(1)}%)`);
  console.log(`Performance: ${(queryTime / 1000).toFixed(2)}s for ${total} queries`);
  console.log(`Average: ${(queryTime / total).toFixed(0)}ms per query`);
  console.log('='.repeat(80));

  const ratio = correct / total;
  if (ratio === 1) console.log('\nPERFECT SCORE!');
  else if (ratio >= 0.9) console.log('\nExcellent! Over 90% accuracy!');
  else if (ratio >= 0.8) console.log('\nGood! 80%+ accuracy at scale.');
  else console.log('\nPerformance degradation detected. Needs optimization.');

  console.log('\nDataset Statistics:');
  console.log(`  Total events: ${events.length}`);
  console.log(`  Unique people: 26`);
  console.log(`  Time span: 2023-01-02 to 2024-03-01`);
}

async function testLoCoMoMassive() {
  console.log('='.repeat(80));
  console.log('LoCoMo MASSIVE Benchmark Test (100+ Events)');
  console.log('='.repeat(80));
  console.log();

  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );

  await loadEvents(memory);
  const results = await runQueries(memory);
  printSummary(results);
}

testLoCoMoMassive().catch(console.error);
