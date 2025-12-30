/**
 * Performance benchmarks for WhenM
 * 
 * Tests query speed with different configurations
 */

import { createWhenM } from '../src/index.js';

async function benchmark(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  await fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return end - start;
}

async function runBenchmarks() {
  console.log('🚀 WhenM Performance Benchmarks\n');
  console.log('=' .repeat(60));
  
  // Test 1: Default configuration (10k events)
  console.log('\n📊 Test 1: Default Configuration (~10k events)');
  console.log('-'.repeat(60));
  
  const memory1 = await createWhenM({
    currentDate: '2025-01-15'
  });
  
  // Generate 10k events
  console.log('Generating 10,000 events...');
  for (let i = 0; i < 10000; i++) {
    const date = new Date(2020, 0, 1 + Math.floor(i / 10));
    const subject = `user${i % 100}`;
    const action = ['learned', 'became', 'joined'][i % 3];
    const object = ['Python', 'manager', 'chess_club'][i % 3];
    
    await memory1.remember(
      `${subject} ${action} ${object}`,
      date.toISOString().split('T')[0]
    );
    
    if (i % 1000 === 0) {
      console.log(`  ${i}/10000 events...`);
    }
  }
  
  // Benchmark queries
  console.log('\nQuery benchmarks:');
  
  await benchmark('Simple "what" query', async () => {
    await memory1.ask("What is user1's job?");
  });
  
  await benchmark('Timeline query', async () => {
    await memory1.history('user1');
  });
  
  await benchmark('State at time query', async () => {
    await memory1.stateAt('2024-01-01', 'user1');
  });
  
  // Test 2: With Sliding Window (50k events)
  console.log('\n📊 Test 2: Sliding Window Configuration (~50k events)');
  console.log('-'.repeat(60));
  
  const memory2 = await createWhenM({
    currentDate: '2025-01-15',
    window: {
      maxEvents: 10000,
      windowDays: 365
    }
  });
  
  // Generate 50k events (but only last 10k in memory)
  console.log('Generating 50,000 events with sliding window...');
  for (let i = 0; i < 50000; i++) {
    const date = new Date(2020, 0, 1 + Math.floor(i / 50));
    const subject = `user${i % 500}`;
    const action = ['learned', 'became', 'joined', 'created', 'finished'][i % 5];
    const object = ['Python', 'manager', 'chess_club', 'project', 'task'][i % 5];
    
    await memory2.remember(
      `${subject} ${action} ${object}`,
      date.toISOString().split('T')[0]
    );
    
    if (i % 5000 === 0) {
      console.log(`  ${i}/50000 events...`);
    }
  }
  
  // Benchmark queries with window
  console.log('\nQuery benchmarks with sliding window:');
  
  await benchmark('Simple "what" query', async () => {
    await memory2.ask("What is user1's job?");
  });
  
  await benchmark('Timeline query', async () => {
    await memory2.history('user1');
  });
  
  await benchmark('State at time query', async () => {
    await memory2.stateAt('2024-01-01', 'user1');
  });
  
  if (memory2.getWindowStats) {
    console.log('\nWindow statistics:');
    console.log(memory2.getWindowStats());
  }
  
  // Test 3: Query complexity
  console.log('\n📊 Test 3: Query Complexity');
  console.log('-'.repeat(60));
  
  const memory3 = await createWhenM({
    currentDate: '2025-01-15'
  });
  
  // Setup some test data
  await memory3.remember('alice became programmer', '2020-01-01');
  await memory3.remember('alice learned Python', '2020-06-01');
  await memory3.remember('alice learned JavaScript', '2021-01-01');
  await memory3.remember('alice became tech_lead', '2022-01-01');
  await memory3.remember('alice learned Rust', '2023-01-01');
  
  console.log('\nDifferent query types:');
  
  await benchmark('Pattern matching query', async () => {
    await memory3.ask("What does alice know?");
  });
  
  await benchmark('Temporal query', async () => {
    await memory3.ask("When did alice learn Python?");
  });
  
  await benchmark('Boolean query', async () => {
    await memory3.ask("Is alice still a tech_lead?");
  });
  
  await benchmark('Complex state query', async () => {
    await memory3.stateAt('2021-06-01', 'alice');
  });
  
  console.log('\n✅ Benchmarks complete!');
  console.log('=' .repeat(60));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks().catch(console.error);
}

export { runBenchmarks };