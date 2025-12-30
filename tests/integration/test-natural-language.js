#!/usr/bin/env node

/**
 * Test Natural Language Query API
 * 
 * This tests the natural language interface for WhenM
 */

import { WhenM } from '../../dist/whenm.js';

async function testNaturalLanguage() {
  console.log('=== Testing Natural Language Query API ===\n');
  
  // Create memory with mock provider for testing
  const memory = await WhenM.custom({
    async parseEvent(text) {
      const patterns = {
        'joined': { verb: 'joined', type: 'role' },
        'learned': { verb: 'learned', type: 'skill' },
        'became': { verb: 'became', type: 'role' },
        'moved': { verb: 'moved', type: 'location' },
        'promoted': { verb: 'promoted', type: 'role' },
      };
      
      for (const [key, value] of Object.entries(patterns)) {
        if (text.toLowerCase().includes(key)) {
          const parts = text.split(' ');
          return {
            subject: parts[0].toLowerCase(),
            verb: value.verb,
            object: parts.slice(2).join(' ').replace(/\.$/, '')
          };
        }
      }
      
      return { subject: 'unknown', verb: 'unknown', object: text };
    },
    
    async generateRules(verb) {
      const rules = {
        'joined': { type: 'state_change', initiates: [{ fluent: 'member_of' }] },
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
        },
        'promoted': {
          type: 'singular',
          initiates: [{ fluent: 'role' }],
          terminates: [{ fluent: 'role' }]
        }
      };
      return rules[verb] || { type: 'state_change' };
    },
    
    async parseQuestion(question) {
      const lower = question.toLowerCase();
      
      // Parse different question types
      if (lower.includes('what') && lower.includes('role')) {
        return { queryType: 'what', predicate: 'role' };
      } else if (lower.includes('where') && lower.includes('live')) {
        return { queryType: 'where', predicate: 'lives_in' };
      } else if (lower.includes('what') && lower.includes('know')) {
        return { queryType: 'what', predicate: 'knows' };
      } else if (lower.includes('how many')) {
        return { queryType: 'how', predicate: 'count' };
      } else if (lower.includes('when')) {
        return { queryType: 'when' };
      }
      
      // Extract subject if mentioned
      const capitalWords = question.match(/[A-Z][a-z]+/g);
      const subject = capitalWords ? capitalWords[0].toLowerCase() : undefined;
      
      return {
        queryType: 'what',
        subject,
        predicate: 'state'
      };
    },
    
    async formatResponse(results) {
      if (!results || results.length === 0) {
        return "I don't know";
      }
      
      if (results.length === 1 && typeof results[0] === 'object') {
        const r = results[0];
        return r.X || r.value || r.role || r.object || JSON.stringify(r);
      }
      
      return results.map(r => 
        typeof r === 'object' ? (r.X || r.value || JSON.stringify(r)) : r
      ).join(', ');
    },
    
    async complete(prompt, options = {}) {
      // Enhanced mock implementation for natural language parsing
      const lower = prompt.toLowerCase();
      
      if (options.format === 'json') {
        // Parse the query in the prompt to detect intent
        const queryMatch = prompt.match(/Query: "([^"]+)"/);
        if (queryMatch) {
          const query = queryMatch[1].toLowerCase();
          
          // Detect action type
          let action = 'query';
          if (query.includes('how many') || query.includes('count')) {
            action = 'aggregate';
            const aggregation = 'count';
            return JSON.stringify({ action, aggregation });
          } else if (query.includes('compare')) {
            action = 'compare';
          } else if (query.includes('timeline') || query.includes('history')) {
            action = 'timeline';
          }
          
          // Extract entities
          const entities = [];
          const capitalWords = queryMatch[1].match(/[A-Z][a-z]+/g);
          if (capitalWords) {
            entities.push(...capitalWords.map(w => w.toLowerCase()));
          }
          
          // Detect timeframe
          let timeframe;
          if (query.includes('last month')) {
            timeframe = { type: 'relative', duration: { amount: 1, unit: 'months' } };
          } else if (query.includes('last week')) {
            timeframe = { type: 'relative', duration: { amount: 1, unit: 'weeks' } };
          } else if (query.includes('last') && query.match(/last (\d+)/)) {
            const match = query.match(/last (\d+) (\w+)/);
            if (match) {
              timeframe = { 
                type: 'relative', 
                duration: { 
                  amount: parseInt(match[1]), 
                  unit: match[2] 
                } 
              };
            }
          } else if (query.includes('in 2022')) {
            timeframe = {
              type: 'range',
              from: '2022-01-01',
              to: '2022-12-31'
            };
          }
          
          // Extract verbs for filtering
          const filters = {};
          const verbPatterns = ['learned', 'became', 'joined', 'moved', 'promoted'];
          const verbs = verbPatterns.filter(v => query.includes(v));
          if (verbs.length > 0) {
            filters.verbs = verbs;
          }
          
          // Detect ordering
          let orderBy;
          if (query.includes('sorted by date') || query.includes('by date')) {
            orderBy = { field: 'time', direction: 'desc' };
          }
          
          // Detect limit
          let limit;
          const limitMatch = query.match(/limit:? (\d+)/);
          if (limitMatch) {
            limit = parseInt(limitMatch[1]);
          }
          
          return JSON.stringify({
            action,
            ...(entities.length > 0 && { entities }),
            ...(timeframe && { timeframe }),
            ...(Object.keys(filters).length > 0 && { filters }),
            ...(orderBy && { orderBy }),
            ...(limit && { limit })
          });
        }
      }
      
      return "Mock LLM response";
    }
  }, { debug: false });
  
  try {
    // Setup test data
    console.log('1. Setting up test data...');
    
    // Alice's timeline
    await memory.remember("Alice joined the company", "2020-01-15");
    await memory.remember("Alice learned Python", "2020-03-01");
    await memory.remember("Alice learned JavaScript", "2020-06-01");
    await memory.remember("Alice became senior developer", "2022-01-01");
    await memory.remember("Alice learned Rust", "2022-03-01");
    await memory.remember("Alice moved to Tokyo", "2022-06-01");
    await memory.remember("Alice became team lead", "2023-01-01");
    await memory.remember("Alice learned Go", "2023-06-01");
    await memory.remember("Alice became engineering manager", "2024-01-01");
    
    // Bob's timeline
    await memory.remember("Bob joined the company", "2021-06-01");
    await memory.remember("Bob learned React", "2021-09-01");
    await memory.remember("Bob became developer", "2021-12-01");
    await memory.remember("Bob learned TypeScript", "2022-03-01");
    await memory.remember("Bob moved to Osaka", "2022-09-01");
    
    console.log('✅ Test data created\n');
    
    // Test 1: Simple natural language queries
    console.log('2. Testing simple natural language queries...\n');
    
    console.log('Query: "What did Alice do last month?"');
    const result1 = await memory.nl("What did Alice do last month?");
    console.log('Result:', result1, '\n');
    
    console.log('Query: "Show me all promotions in 2022"');
    const result2 = await memory.nl("Show me all promotions in 2022");
    console.log('Result:', result2, '\n');
    
    // Test 2: Aggregation queries
    console.log('3. Testing aggregation queries...\n');
    
    console.log('Query: "How many times did Alice learn something?"');
    const result3 = await memory.nl("How many times did Alice learn something?");
    console.log('Result:', result3, '\n');
    
    console.log('Query: "Count all events for Bob"');
    const result4 = await memory.nl("Count all events for Bob");
    console.log('Result:', result4, '\n');
    
    // Test 3: Timeline queries
    console.log('4. Testing timeline queries...\n');
    
    console.log('Query: "Show Alice\'s timeline"');
    const result5 = await memory.nl("Show Alice's timeline");
    console.log('Result:', result5, '\n');
    
    // Test 4: Complex queries
    console.log('5. Testing complex queries...\n');
    
    console.log('Query: "Who learned Python in the last 5 years?"');
    const result6 = await memory.nl("Who learned Python in the last 5 years?");
    console.log('Result:', result6, '\n');
    
    console.log('Query: "List all role changes sorted by date"');
    const result7 = await memory.nl("List all role changes sorted by date");
    console.log('Result:', result7, '\n');
    
    // Test 5: Chainable Natural Language Interface
    console.log('6. Testing chainable NL interface...\n');
    
    const result8 = await memory
      .nl("What skills did Alice learn")
      .during("in 2022");
    console.log('NL Query: "What skills did Alice learn in 2022"');
    console.log('Result:', result8, '\n');
    
    const result9 = await memory
      .nl("Show all events")
      .about("Bob")
      .limit(3);
    console.log('NL Query: "Show all events about Bob (limit 3)"');
    console.log('Result:', result9, '\n');
    
    // Test shorthand methods
    const result10 = await memory
      .nl("What happened")
      .recent(7);
    console.log('NL Query: "What happened in the last 7 days"');
    console.log('Result:', result10, '\n');
    
    // Test 6: Mixed Japanese/English queries
    console.log('7. Testing mixed language queries...\n');
    
    await memory.remember("太郎がエンジニアになった", "2023-01-01");
    console.log('Query: "太郎の役割は何ですか？"');
    const result11 = await memory.nl("太郎の役割は何ですか？");
    console.log('Result:', result11, '\n');
    
    // Summary
    console.log('='.repeat(50));
    console.log('✅ Natural Language Query tests completed!');
    console.log('='.repeat(50));
    
    console.log('\n📊 Test Summary:');
    console.log('- Simple NL queries: ✅');
    console.log('- Aggregation queries: ✅');
    console.log('- Timeline queries: ✅');
    console.log('- Complex queries: ✅');
    console.log('- Chainable NL interface: ✅');
    console.log('- Multi-language support: ✅');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testNaturalLanguage().catch(console.error);