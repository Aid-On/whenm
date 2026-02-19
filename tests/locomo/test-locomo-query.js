#!/usr/bin/env node

/**
 * LoCoMo Query Tester - Tests queries against pre-loaded data
 */

import { whenm } from '../../dist/whenm.js';
import fs from 'fs/promises';

const queries = [
  { q: "Who learned Python?", type: "Who", expectedCount: 4, description: "Python learners" },
  { q: "Who became senior engineer?", type: "Who", expectedCount: 2, description: "Senior promotions" },
  { q: "Who won hackathon?", type: "Who", expectedCount: 2, description: "Hackathon winners" },
  { q: "When did Charlie become CTO?", type: "When", expected: "2023-08-01", description: "Charlie's CTO promotion" },
  { q: "When did Nancy join the company?", type: "When", expected: "2023-07-15", description: "Nancy's join date" },
  { q: "What did Alice learn?", type: "What", expectedItems: ["Python", "Git"], description: "Alice's learning" },
  { q: "What did Steve learn?", type: "What", expectedItems: ["Python"], description: "Steve's learning" },
  { q: "How many people learned Python?", type: "Count", expected: 5, description: "Total Python learners" },
  { q: "How many people joined the company?", type: "Count", expected: 9, description: "Total hires" },
  { q: "How many people became senior engineer?", type: "Count", expected: 2, description: "Senior promotions" },
  { q: "Who joined as CTO?", type: "Who", expectedCount: 0, description: "Direct CTO hires" }
];

function evaluateResult(result, query) {
  const { expected, expectedCount, expectedItems } = query;
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);

  if (expectedCount !== undefined) {
    const actualCount = Array.isArray(result) ? result.length : (result?.count || 0);
    return { isCorrect: actualCount === expectedCount, expectedStr: `${expectedCount} items`, displayStr: `Found ${actualCount} items` };
  }
  if (expectedItems) {
    const isCorrect = expectedItems.every(item => resultStr.toLowerCase().includes(item.toLowerCase()));
    return { isCorrect, expectedStr: expectedItems.join(', '), displayStr: resultStr.slice(0, 100) + '...' };
  }
  if (expected !== undefined) {
    return { isCorrect: resultStr.includes(String(expected)), expectedStr: String(expected), displayStr: resultStr };
  }
  return { isCorrect: false, expectedStr: 'N/A', displayStr: resultStr };
}

async function checkDataLoaded() {
  try {
    await fs.access('.locomo-data-loaded');
    const loadTime = await fs.readFile('.locomo-data-loaded', 'utf-8');
    console.log(`Using data loaded at: ${loadTime}\n`);
  } catch {
    console.log('No data loaded yet! Please run: node test-locomo-load.js');
    process.exit(1);
  }
}

async function runQueries(memory) {
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
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log(`Status: FAIL\n`);
    }
  }

  return { correct, total: queries.length, queryTime: Date.now() - queryStartTime };
}

async function testQueries() {
  console.log('='.repeat(60));
  console.log('LoCoMo Query Test (Data Pre-loaded)');
  console.log('='.repeat(60));
  console.log();

  await checkDataLoaded();

  const memory = await whenm.cloudflare(
    "0fc5c2d478a1383a6b624d19ff4bd340",
    "4f7207ceb8822e7ca0825cf26da84fe32e02b",
    "Hiromi.motodera@aid-on.org"
  );

  console.log('Running queries on pre-loaded data:\n');
  const { correct, total, queryTime } = await runQueries(memory);

  console.log('='.repeat(60));
  console.log(`Results: ${correct}/${total} (${(correct / total * 100).toFixed(1)}%)`);
  console.log(`Query Time: ${(queryTime / 1000).toFixed(2)}s`);
  console.log(`Average: ${(queryTime / total).toFixed(0)}ms per query`);
  console.log('='.repeat(60));

  const ratio = correct / total;
  if (ratio === 1) console.log('\nPERFECT SCORE!');
  else if (ratio >= 0.9) console.log('\nExcellent! Over 90% accuracy!');
  else if (ratio >= 0.8) console.log('\nGood! 80%+ accuracy.');
  else console.log('\nNeeds improvement.');
}

testQueries().catch(console.error);
