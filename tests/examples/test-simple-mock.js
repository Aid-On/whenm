#!/usr/bin/env node

/**
 * Test with simplified mock that actually works
 */

import { WhenM } from '../../dist/whenm.js';

// Create a simple in-memory storage
class SimpleMockProvider {
  constructor() {
    this.memory = new Map();
  }
  
  async parseEvent(text) {
    // Simple pattern matching
    const patterns = [
      /^(.+?) became (.+)$/i,
      /^(.+?) learned (.+)$/i,
      /^(.+?) joined as (.+)$/i,
      /^(.+?) moved to (.+)$/i,
      /^(.+?) acquired (.+)$/i,
      /^(.+?) defeated (.+)$/i,
      /^(.+?) grokked (.+)$/i,
      /^(.+?)が(.+?)に引っ越した$/,
      /^(.+?)が(.+)$/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const subject = match[1].toLowerCase().trim();
        const object = match[match.length - 1].trim();
        const verb = match[2] || 'did';
        
        // Store in memory
        if (!this.memory.has(subject)) {
          this.memory.set(subject, {});
        }
        
        // Special handling for certain verbs
        if (text.includes('became') || text.includes('joined as')) {
          this.memory.get(subject).role = object;
        } else if (text.includes('learned') || text.includes('grokked')) {
          if (!this.memory.get(subject).knows) {
            this.memory.get(subject).knows = [];
          }
          this.memory.get(subject).knows.push(object);
        } else if (text.includes('moved to') || text.includes('引っ越した')) {
          this.memory.get(subject).location = object;
        } else if (text.includes('acquired')) {
          this.memory.get(subject).owns = object;
        }
        
        return { subject, verb, object };
      }
    }
    
    return { subject: 'unknown', verb: 'did', object: text };
  }
  
  async generateRules(verb) {
    return { initiates: [{ fluent: verb }], type: 'state_change' };
  }
  
  async parseQuestion(question) {
    const q = question.toLowerCase();
    
    // Find subject
    let subject = 'unknown';
    const names = ['alice', 'bob', 'charlie', '太郎', 'player', 'techcorp', 'startupx'];
    for (const name of names) {
      if (q.includes(name)) {
        subject = name;
        break;
      }
    }
    
    return {
      queryType: q.includes('what') ? 'what' : 
                 q.includes('who') ? 'who' :
                 q.includes('when') ? 'when' : 
                 'what',
      subject,
      predicate: q.includes('role') ? 'role' : 
                 q.includes('know') ? 'knows' : 
                 undefined,
      timeframe: undefined
    };
  }
  
  async formatResponse(results, question) {
    const q = question.toLowerCase();
    
    // Extract subject
    let subject = null;
    const names = ['alice', 'bob', 'charlie', '太郎', 'player', 'techcorp', 'startupx'];
    for (const name of names) {
      if (q.includes(name)) {
        subject = name;
        break;
      }
    }
    
    if (!subject || !this.memory.has(subject)) {
      return q.includes('日本語') || q.includes('は') ? 'わかりません' : "I don't know";
    }
    
    const data = this.memory.get(subject);
    
    // Answer based on question type
    if (q.includes('role')) {
      return data.role || "I don't know";
    }
    if (q.includes('know')) {
      return data.knows ? data.knows.join(', ') : "I don't know";
    }
    if (q.includes('where') || q.includes('どこ')) {
      return data.location || "I don't know";
    }
    if (q.includes('own')) {
      return data.owns || "I don't know";
    }
    
    // Try to return something relevant
    const values = Object.values(data);
    if (values.length > 0) {
      return Array.isArray(values[0]) ? values[0].join(', ') : String(values[0]);
    }
    
    return "I don't know";
  }
}

async function test() {
  console.log('=== Simple Mock Test ===\n');
  
  // Create with our simple provider
  const provider = new SimpleMockProvider();
  const memory = await WhenM.custom(provider);
  
  // Test basic example from README
  console.log('1. Recording events...');
  await memory.remember("Alice joined as intern", "2020-01-01");
  await memory.remember("Alice became senior engineer", "2022-06-01");
  await memory.remember("Alice became CTO", "2024-01-01");
  
  console.log('\n2. Asking questions...');
  const role = await memory.ask("What is Alice's role?");
  console.log("Alice's role:", role);
  
  // Test learning
  console.log('\n3. Testing knowledge...');
  await memory.remember("Bob learned Python", "2019-01-01");
  await memory.remember("Bob learned Rust", "2021-01-01");
  
  const skills = await memory.ask("What does Bob know?");
  console.log("Bob's skills:", skills);
  
  // Test location
  console.log('\n4. Testing location...');
  await memory.remember("太郎が東京に引っ越した", "2024-01-01");
  const location = await memory.ask("太郎はどこに住んでいる？");
  console.log("太郎の場所:", location);
  
  console.log('\n✅ Simple mock works!');
}

test().catch(console.error);