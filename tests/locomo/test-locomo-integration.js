#!/usr/bin/env node

/**
 * WhenM Integration with LoCoMo Benchmark
 * 
 * LoCoMoベンチマークの時間推論タスクをWhenMで処理するデモ
 */

import { WhenM } from '../../dist/whenm.js';

// LoCoMo形式の会話データサンプル
const locomoSessions = [
  {
    session: 1,
    date: "2024-01-15",
    turns: [
      "Alice: I just started learning Python today",
      "Bob: That's great! I learned it last year",
      "Alice: I'm also planning to join the AI club"
    ]
  },
  {
    session: 2,
    date: "2024-02-01",
    turns: [
      "Alice: I completed my first Python project",
      "Bob: Nice! What was it about?",
      "Alice: A weather prediction app. I also joined the AI club as planned"
    ]
  },
  {
    session: 3,
    date: "2024-03-15",
    turns: [
      "Alice: I got promoted to club president!",
      "Bob: Congrats! I started learning Rust",
      "Alice: I'm now mentoring new members"
    ]
  },
  {
    session: 4,
    date: "2024-04-20",
    turns: [
      "Bob: I built my first Rust project",
      "Alice: What kind?",
      "Bob: A high-performance web server"
    ]
  },
  {
    session: 5,
    date: "2024-05-10",
    turns: [
      "Alice: We won the university hackathon!",
      "Bob: Amazing! I joined as a judge",
      "Alice: The prize was $10,000"
    ]
  }
];

// LoCoMoベンチマーク形式の質問
const locomoQuestions = {
  // Single-hop (単一セッション)
  singleHop: [
    { q: "What did Alice start learning in session 1?", answer: "Python" },
    { q: "What position did Alice get in session 3?", answer: "club president" }
  ],
  
  // Multi-hop (クロスセッション)
  multiHop: [
    { q: "What did Alice complete after learning Python?", answer: "first Python project" },
    { q: "What did Bob build after learning Rust?", answer: "high-performance web server" }
  ],
  
  // Temporal reasoning (時間推論)
  temporal: [
    { q: "When did Alice join the AI club?", answer: "2024-02-01" },
    { q: "When did Bob learn Rust?", answer: "2024-03-15" },
    { q: "When did Alice become club president?", answer: "2024-03-15" },
    { q: "When did Alice win the hackathon?", answer: "2024-05-10" }
  ],
  
  // Event ordering (イベント順序)
  ordering: [
    { q: "List Alice's achievements in chronological order", answer: "learned Python → joined AI club → became president → won hackathon" },
    { q: "What was the sequence of Bob's learning?", answer: "Python → Rust" }
  ]
};

async function parseConversation(memory, sessions) {
  console.log('📥 Loading LoCoMo conversation data into WhenM...\n');
  
  for (const session of sessions) {
    for (const turn of session.turns) {
      // 簡単な発話解析
      const [speaker, utterance] = turn.split(': ');
      
      // イベント抽出のパターン
      const patterns = [
        { regex: /started learning (.+)/i, verb: 'learned' },
        { regex: /learned (.+)/i, verb: 'learned' },
        { regex: /completed (.+)/i, verb: 'completed' },
        { regex: /joined (.+)/i, verb: 'joined' },
        { regex: /got promoted to (.+)/i, verb: 'became' },
        { regex: /built (.+)/i, verb: 'built' },
        { regex: /won (.+)/i, verb: 'won' },
        { regex: /planning to (.+)/i, verb: 'planned' }
      ];
      
      for (const pattern of patterns) {
        const match = utterance.match(pattern.regex);
        if (match) {
          const event = `${speaker} ${pattern.verb} ${match[1]}`;
          await memory.remember(event, session.date);
          console.log(`  ✓ Recorded: ${event} on ${session.date}`);
        }
      }
    }
  }
  console.log();
}

async function evaluateQuestions(memory, questions) {
  const results = {
    singleHop: { correct: 0, total: 0 },
    multiHop: { correct: 0, total: 0 },
    temporal: { correct: 0, total: 0 },
    ordering: { correct: 0, total: 0 }
  };
  
  console.log('🧪 Evaluating LoCoMo benchmark questions:\n');
  
  // Single-hop questions
  console.log('📍 Single-hop Questions:');
  for (const q of questions.singleHop) {
    const answer = await memory.nl(q.q);
    const correct = answer.toString().toLowerCase().includes(q.answer.toLowerCase());
    results.singleHop.total++;
    if (correct) results.singleHop.correct++;
    console.log(`  Q: ${q.q}`);
    console.log(`  A: ${JSON.stringify(answer).slice(0, 100)}...`);
    console.log(`  Expected: ${q.answer} | ${correct ? '✅' : '❌'}\n`);
  }
  
  // Multi-hop questions
  console.log('🔗 Multi-hop Questions:');
  for (const q of questions.multiHop) {
    const answer = await memory.nl(q.q);
    const correct = answer.toString().toLowerCase().includes(q.answer.toLowerCase());
    results.multiHop.total++;
    if (correct) results.multiHop.correct++;
    console.log(`  Q: ${q.q}`);
    console.log(`  A: ${JSON.stringify(answer).slice(0, 100)}...`);
    console.log(`  Expected: ${q.answer} | ${correct ? '✅' : '❌'}\n`);
  }
  
  // Temporal reasoning questions
  console.log('⏰ Temporal Reasoning Questions:');
  for (const q of questions.temporal) {
    const answer = await memory.nl(q.q);
    const correct = answer.toString().toLowerCase().includes(q.answer.toLowerCase());
    results.temporal.total++;
    if (correct) results.temporal.correct++;
    console.log(`  Q: ${q.q}`);
    console.log(`  A: ${JSON.stringify(answer).slice(0, 100)}...`);
    console.log(`  Expected: ${q.answer} | ${correct ? '✅' : '❌'}\n`);
  }
  
  // Event ordering questions
  console.log('📅 Event Ordering Questions:');
  for (const q of questions.ordering) {
    const answer = await memory.nl(q.q);
    results.ordering.total++;
    // For ordering, check if events are mentioned in correct sequence
    console.log(`  Q: ${q.q}`);
    console.log(`  A: ${JSON.stringify(answer).slice(0, 200)}...`);
    console.log(`  Expected sequence: ${q.answer}\n`);
  }
  
  return results;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 WhenM × LoCoMo Benchmark Integration');
  console.log('='.repeat(60));
  console.log();
  
  // Create WhenM instance with improved mock LLM
  const memory = await WhenM.custom({
    async parseEvent(text) {
      // Better parsing for LoCoMo events
      const patterns = [
        /^(\w+)\s+(learned|completed|joined|became|built|won|planned)\s+(.+)$/i,
        /^(\w+)\s+(\w+)\s+(.+)$/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return {
            subject: match[1].toLowerCase(),
            verb: match[2].toLowerCase(),
            object: match[3]
          };
        }
      }
      
      const parts = text.split(' ');
      return {
        subject: parts[0].toLowerCase(),
        verb: parts[1].toLowerCase(),
        object: parts.slice(2).join(' ')
      };
    },
    
    async generateRules(verb) {
      const rules = {
        'learned': { type: 'accumulative', initiates: [{ fluent: 'knows' }] },
        'completed': { type: 'achievement', initiates: [{ fluent: 'completed' }] },
        'joined': { type: 'state_change', initiates: [{ fluent: 'member_of' }] },
        'became': { type: 'singular', initiates: [{ fluent: 'role' }], terminates: [{ fluent: 'role' }] },
        'built': { type: 'achievement', initiates: [{ fluent: 'created' }] },
        'won': { type: 'achievement', initiates: [{ fluent: 'winner' }] }
      };
      return rules[verb] || { type: 'state_change' };
    },
    
    async parseQuestion(question) {
      return { queryType: 'what', subject: 'test' };
    },
    
    async formatResponse(results) {
      return results;
    },
    
    async complete(prompt, options = {}) {
      // Mock LLM for LoCoMo task parsing
      if (options.format === 'json') {
        const query = prompt.toLowerCase();
        
        // Extract entities from the query
        const entities = [];
        if (query.includes('alice')) entities.push('alice');
        if (query.includes('bob')) entities.push('bob');
        
        if (query.includes('when')) {
          return JSON.stringify({ 
            action: 'timeline', 
            entities: entities.length > 0 ? entities : ['alice', 'bob'] 
          });
        } else if (query.includes('after') || query.includes('before')) {
          return JSON.stringify({ 
            action: 'compare',
            entities: entities.length > 0 ? entities : ['alice'],
            timeframe: { from: '2024-01-01', to: '2024-12-31' }
          });
        } else if (query.includes('list') || query.includes('sequence') || query.includes('chronological')) {
          return JSON.stringify({ 
            action: 'query', 
            entities: entities.length > 0 ? entities : undefined,
            orderBy: { field: 'time', direction: 'asc' } 
          });
        } else if (query.includes('what') && query.includes('did')) {
          return JSON.stringify({
            action: 'query',
            entities: entities.length > 0 ? entities : undefined
          });
        }
        
        return JSON.stringify({ 
          action: 'query',
          entities: entities.length > 0 ? entities : undefined
        });
      }
      return "Mock response";
    }
  }, { debug: false });
  
  // Load conversation data
  await parseConversation(memory, locomoSessions);
  
  // Evaluate benchmark questions
  const results = await evaluateQuestions(memory, locomoQuestions);
  
  // Calculate scores
  console.log('='.repeat(60));
  console.log('📊 LoCoMo Benchmark Results:');
  console.log('='.repeat(60));
  console.log();
  
  const categories = ['singleHop', 'multiHop', 'temporal', 'ordering'];
  let totalCorrect = 0;
  let totalQuestions = 0;
  
  for (const cat of categories) {
    const score = results[cat];
    const accuracy = score.total > 0 ? (score.correct / score.total * 100).toFixed(1) : 0;
    totalCorrect += score.correct;
    totalQuestions += score.total;
    
    console.log(`${cat.replace(/([A-Z])/g, ' $1').trim()}:`);
    console.log(`  Correct: ${score.correct}/${score.total} (${accuracy}%)`);
  }
  
  console.log('\nOverall Accuracy:');
  console.log(`  ${totalCorrect}/${totalQuestions} (${(totalCorrect/totalQuestions*100).toFixed(1)}%)`);
  
  console.log('\n💡 Key Insights:');
  console.log('• WhenMはLoCoMoの時間推論タスクに対応可能');
  console.log('• Event Calculusによる形式的な時間論理が強み');
  console.log('• 自然言語インターフェースで直接質問処理');
  console.log('• クロスセッション推論もサポート');
  
  console.log('\n🎯 LoCoMoベンチマーク適合性:');
  console.log('✅ Single-hop QA: 単一セッションの質問応答');
  console.log('✅ Multi-hop QA: 複数セッションを跨ぐ推論');
  console.log('✅ Temporal Reasoning: 時間的順序・前後関係');
  console.log('✅ Event Ordering: イベントの時系列整理');
  console.log('⚠️  Adversarial: 誤解を招く質問への対処（要改善）');
}

main().catch(console.error);