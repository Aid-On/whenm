#!/usr/bin/env node

/**
 * LoCoMo Extensive Test
 *
 * Large-scale LoCoMo benchmark
 */

import { whenm } from '../../dist/whenm.js';

const events = [
  { text: "Alice joined the company", date: "2024-01-01" },
  { text: "Alice learned Python", date: "2024-01-15" },
  { text: "Alice learned JavaScript", date: "2024-02-01" },
  { text: "Alice completed first project", date: "2024-02-15" },
  { text: "Alice learned TypeScript", date: "2024-03-01" },
  { text: "Alice became senior engineer", date: "2024-06-01" },
  { text: "Alice mentored Bob", date: "2024-07-01" },
  { text: "Alice won the hackathon", date: "2024-09-15" },
  { text: "Alice learned Rust", date: "2024-10-01" },
  { text: "Alice became team lead", date: "2024-11-01" },
  { text: "Bob joined the company", date: "2024-03-01" },
  { text: "Bob learned JavaScript", date: "2024-03-15" },
  { text: "Bob completed onboarding", date: "2024-04-01" },
  { text: "Bob learned React", date: "2024-04-15" },
  { text: "Bob built first feature", date: "2024-05-01" },
  { text: "Bob learned Docker", date: "2024-06-15" },
  { text: "Bob became tech lead", date: "2024-10-01" },
  { text: "Bob learned Kubernetes", date: "2024-11-15" },
  { text: "Charlie joined as CTO", date: "2024-02-01" },
  { text: "Charlie implemented new architecture", date: "2024-03-15" },
  { text: "Charlie became CEO", date: "2024-07-01" },
  { text: "Charlie launched new product", date: "2024-09-01" },
  { text: "Diana joined the company", date: "2024-04-01" },
  { text: "Diana learned Go", date: "2024-04-15" },
  { text: "Diana became principal engineer", date: "2024-08-01" },
  { text: "Diana published research paper", date: "2024-10-15" },
  { text: "Eve joined the company", date: "2024-05-01" },
  { text: "Eve learned Python", date: "2024-05-15" },
  { text: "Eve learned machine learning", date: "2024-07-01" },
  { text: "Eve deployed AI model", date: "2024-08-15" }
];

const queries = [
  { q: "What did Alice learn?", type: "What", expected: ["Python", "JavaScript", "TypeScript", "Rust"] },
  { q: "What did Bob learn?", type: "What", expected: ["JavaScript", "React", "Docker", "Kubernetes"] },
  { q: "What did Eve learn?", type: "What", expected: ["Python", "machine learning"] },
  { q: "When did Alice become senior engineer?", type: "When", expected: "2024-06-01" },
  { q: "When did Bob join the company?", type: "When", expected: "2024-03-01" },
  { q: "When did Charlie become CEO?", type: "When", expected: "2024-07-01" },
  { q: "When did Diana publish research paper?", type: "When", expected: "2024-10-15" },
  { q: "Who learned Python?", type: "Who", expected: ["alice", "eve"] },
  { q: "Who became team lead?", type: "Who", expected: ["alice"] },
  { q: "Who became tech lead?", type: "Who", expected: ["bob"] },
  { q: "Who won the hackathon?", type: "Who", expected: ["alice"] },
  { q: "How many things did Alice learn?", type: "Count", expected: 4 },
  { q: "How many people learned Python?", type: "Count", expected: 2 },
  { q: "How many people joined the company?", type: "Count", expected: 5 }
];

async function loadEvents(memory) {
  console.log('Loading ' + events.length + ' events...');
  for (const { text, date } of events) {
    await memory.remember(text, date);
    console.log(`  ${text} (${date})`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  console.log();
}

function evaluateResult(resultStr, expected) {
  if (Array.isArray(expected)) {
    return expected.every(exp => resultStr.toLowerCase().includes(exp.toLowerCase()));
  }
  if (typeof expected === 'number') {
    return resultStr.includes(expected.toString());
  }
  return resultStr.includes(expected);
}

async function runQueries(memory) {
  let correct = 0;
  for (const { q, type, expected } of queries) {
    console.log(`[${type}] ${q}`);
    try {
      const result = await memory.nl(q);
      const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
      const isCorrect = evaluateResult(resultStr, expected);

      console.log(`Answer: ${resultStr.slice(0, 100)}${resultStr.length > 100 ? '...' : ''}`);
      console.log(`Expected: ${JSON.stringify(expected)}`);
      console.log(`Result: ${isCorrect ? 'PASS' : 'FAIL'}\n`);
      if (isCorrect) correct++;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`Error: ${error.message}\nResult: FAIL\n`);
    }
  }
  return correct;
}

async function testLoCoMoExtensive() {
  console.log('='.repeat(60));
  console.log('LoCoMo Extensive Benchmark Test');
  console.log('='.repeat(60));
  console.log();

  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );

  await loadEvents(memory);
  console.log('Testing comprehensive LoCoMo queries:\n');

  const correct = await runQueries(memory);
  const total = queries.length;
  const ratio = correct / total;

  console.log('='.repeat(60));
  console.log(`Results: ${correct}/${total} (${(ratio * 100).toFixed(0)}%)`);
  console.log('='.repeat(60));

  if (ratio === 1) console.log('\nAll tests passed!');
  else if (ratio >= 0.8) console.log('\nGood performance! Most queries working.');
  else console.log('\nNeeds improvement.');
}

testLoCoMoExtensive().catch(console.error);
