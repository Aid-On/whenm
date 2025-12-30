#!/usr/bin/env node

/**
 * Test modern query builder API
 */

import { WhenM } from '../../dist/whenm.js';

async function testModernAPI() {
  console.log('=== Testing Modern Query Builder API ===\n');
  
  // Use mock provider for testing
  const memory = await WhenM.custom({
    async parseEvent(text) {
      // Simple parser for testing
      const patterns = {
        'joined': { verb: 'joined', type: 'role' },
        'learned': { verb: 'learned', type: 'skill' },
        'became': { verb: 'became', type: 'role' },
        'moved': { verb: 'moved', type: 'location' },
      };
      
      for (const [key, value] of Object.entries(patterns)) {
        if (text.includes(key)) {
          const parts = text.split(' ');
          return {
            subject: parts[0],
            verb: value.verb,
            object: parts.slice(2).join(' ').replace(/\.$/, '')
          };
        }
      }
      
      return { subject: 'unknown', verb: 'unknown', object: text };
    },
    
    async generateRules(verb) {
      const rules = {
        'joined': { type: 'accumulative', initiates: [{ fluent: 'member_of' }] },
        'learned': { type: 'accumulative', initiates: [{ fluent: 'knows' }] },
        'became': { 
          type: 'singular', 
          initiates: [{ fluent: 'role' }],
          terminates: [{ fluent: 'role' }]
        },
        'moved': {
          type: 'singular',
          initiates: [{ fluent: 'lives_in' }],
          terminates: [{ fluent: 'lives_in' }]
        }
      };
      return rules[verb] || { type: 'state_change' };
    },
    
    async parseQuestion(question) {
      return {
        queryType: 'what',
        subject: 'test',
        predicate: 'role'
      };
    },
    
    async formatResponse(results) {
      return JSON.stringify(results);
    },
    
    async complete(prompt) {
      return "Test response";
    }
  }, { debug: true });
  
  try {
    // Setup test data
    console.log('1. Setting up test data...');
    await memory.remember("Alice joined the company", "2020-01-15");
    await memory.remember("Alice learned Python", "2020-03-01");
    await memory.remember("Alice learned React", "2020-06-01");
    await memory.remember("Alice became senior engineer", "2022-01-01");
    await memory.remember("Alice moved to Tokyo", "2022-06-01");
    await memory.remember("Alice became tech lead", "2024-01-01");
    
    await memory.remember("Bob joined the company", "2021-06-01");
    await memory.remember("Bob learned Go", "2021-09-01");
    await memory.remember("Bob became engineer", "2021-06-15");
    
    console.log('✅ Test data created\n');
    
    // Test 1: Fluent Query Builder
    console.log('2. Testing Fluent Query Builder...');
    
    const aliceEvents = await memory
      .query()
      .where({ subject: "Alice" })
      .last(30, 'days')
      .orderBy('time', 'desc')
      .limit(5)
      .execute();
    
    console.log('Recent Alice events:', aliceEvents);
    
    // Test 2: Time range queries
    console.log('\n3. Testing time range queries...');
    
    const events2022 = await memory
      .query()
      .between("2022-01-01", "2022-12-31")
      .execute();
    
    console.log('Events in 2022:', events2022);
    
    // Test 3: Verb filtering
    console.log('\n4. Testing verb filtering...');
    
    const learningEvents = await memory
      .query()
      .verb("learned")
      .orderBy('time', 'asc')
      .execute();
    
    console.log('Learning events:', learningEvents);
    
    // Test 4: Pagination
    console.log('\n5. Testing pagination...');
    
    const page1 = await memory
      .query()
      .page(1, 3)
      .execute();
    
    const page2 = await memory
      .query()
      .page(2, 3)
      .execute();
    
    console.log('Page 1:', page1);
    console.log('Page 2:', page2);
    
    // Test 5: Timeline API
    console.log('\n6. Testing Timeline API...');
    
    const aliceTimeline = memory.timeline("Alice");
    
    const snapshot2021 = await aliceTimeline.at("2021-01-01");
    console.log('Alice snapshot at 2021-01-01:', snapshot2021);
    
    const snapshot2023 = await aliceTimeline.at("2023-01-01");
    console.log('Alice snapshot at 2023-01-01:', snapshot2023);
    
    const recentChanges = await aliceTimeline.recent(365);
    console.log('Alice recent changes:', recentChanges);
    
    const comparison = await aliceTimeline.compare("2021-01-01", "2024-01-01");
    console.log('Alice changes 2021 → 2024:', comparison);
    
    // Test 6: Aggregation queries
    console.log('\n7. Testing aggregation queries...');
    
    const distinctSubjects = await memory
      .query()
      .distinct('subject');
    
    console.log('Distinct subjects:', distinctSubjects);
    
    const distinctVerbs = await memory
      .query()
      .distinct('verb');
    
    console.log('Distinct verbs:', distinctVerbs);
    
    const eventCount = await memory
      .query()
      .where({ subject: "Alice" })
      .count();
    
    console.log('Alice event count:', eventCount);
    
    // Test 7: Existence checks
    console.log('\n8. Testing existence checks...');
    
    const hasBobEvents = await memory
      .query()
      .where({ subject: "Bob" })
      .exists();
    
    console.log('Bob has events:', hasBobEvents);
    
    const hasCharlieEvents = await memory
      .query()
      .where({ subject: "Charlie" })
      .exists();
    
    console.log('Charlie has events:', hasCharlieEvents);
    
    // Test 8: Helper methods
    console.log('\n9. Testing helper methods...');
    
    const recentAll = await memory.recent(7);
    console.log('Recent events (7 days):', recentAll);
    
    const searchResults = await memory.search("engineer");
    console.log('Search "engineer":', searchResults);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All Modern API tests completed!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testModernAPI().catch(console.error);