#!/usr/bin/env node

/**
 * WhenM Integration with LoCoMo Benchmark
 *
 * LoCoMo benchmark temporal reasoning tasks processed by WhenM
 */

import { WhenM } from '../../dist/whenm.js';

// LoCoMo conversation session data
const locomoSessions = [
  {
    session: 1, date: "2024-01-15",
    turns: [
      "Alice: I just started learning Python today",
      "Bob: That's great! I learned it last year",
      "Alice: I'm also planning to join the AI club"
    ]
  },
  {
    session: 2, date: "2024-02-01",
    turns: [
      "Alice: I completed my first Python project",
      "Bob: Nice! What was it about?",
      "Alice: A weather prediction app. I also joined the AI club as planned"
    ]
  },
  {
    session: 3, date: "2024-03-15",
    turns: [
      "Alice: I got promoted to club president!",
      "Bob: Congrats! I started learning Rust",
      "Alice: I'm now mentoring new members"
    ]
  },
  {
    session: 4, date: "2024-04-20",
    turns: [
      "Bob: I built my first Rust project",
      "Alice: What kind?",
      "Bob: A high-performance web server"
    ]
  },
  {
    session: 5, date: "2024-05-10",
    turns: [
      "Alice: We won the university hackathon!",
      "Bob: Amazing! I joined as a judge",
      "Alice: The prize was $10,000"
    ]
  }
];

// LoCoMo benchmark questions
const locomoQuestions = {
  singleHop: [
    { q: "What did Alice start learning in session 1?", answer: "Python" },
    { q: "What position did Alice get in session 3?", answer: "club president" }
  ],
  multiHop: [
    { q: "What did Alice complete after learning Python?", answer: "first Python project" },
    { q: "What did Bob build after learning Rust?", answer: "high-performance web server" }
  ],
  temporal: [
    { q: "When did Alice join the AI club?", answer: "2024-02-01" },
    { q: "When did Bob learn Rust?", answer: "2024-03-15" },
    { q: "When did Alice become club president?", answer: "2024-03-15" },
    { q: "When did Alice win the hackathon?", answer: "2024-05-10" }
  ],
  ordering: [
    { q: "List Alice's achievements in chronological order", answer: "learned Python -> joined AI club -> became president -> won hackathon" },
    { q: "What was the sequence of Bob's learning?", answer: "Python -> Rust" }
  ]
};

// Event extraction patterns
const EVENT_PATTERNS = [
  { regex: /started learning (.+)/i, verb: 'learned' },
  { regex: /learned (.+)/i, verb: 'learned' },
  { regex: /completed (.+)/i, verb: 'completed' },
  { regex: /joined (.+)/i, verb: 'joined' },
  { regex: /got promoted to (.+)/i, verb: 'became' },
  { regex: /built (.+)/i, verb: 'built' },
  { regex: /won (.+)/i, verb: 'won' },
  { regex: /planning to (.+)/i, verb: 'planned' }
];

async function parseConversation(memory, sessions) {
  console.log('Loading LoCoMo conversation data into WhenM...\n');
  for (const session of sessions) {
    for (const turn of session.turns) {
      const [speaker, utterance] = turn.split(': ');
      for (const pattern of EVENT_PATTERNS) {
        const match = utterance.match(pattern.regex);
        if (match) {
          const event = `${speaker} ${pattern.verb} ${match[1]}`;
          await memory.remember(event, session.date);
          console.log(`  Recorded: ${event} on ${session.date}`);
        }
      }
    }
  }
  console.log();
}

function evaluateCategory(label, items, evaluator) {
  console.log(`${label}:`);
  const result = { correct: 0, total: 0 };
  for (const item of items) {
    const { answer, correct } = evaluator(item);
    result.total++;
    if (correct) result.correct++;
    console.log(`  Q: ${item.q}`);
    console.log(`  A: ${JSON.stringify(answer).slice(0, 100)}...`);
    console.log(`  Expected: ${item.answer} | ${correct ? 'PASS' : 'FAIL'}\n`);
  }
  return result;
}

async function evaluateQuestions(memory, questions) {
  console.log('Evaluating LoCoMo benchmark questions:\n');

  const answeredSingleHop = await Promise.all(
    questions.singleHop.map(async q => ({ ...q, result: await memory.nl(q.q) }))
  );
  const answeredMultiHop = await Promise.all(
    questions.multiHop.map(async q => ({ ...q, result: await memory.nl(q.q) }))
  );
  const answeredTemporal = await Promise.all(
    questions.temporal.map(async q => ({ ...q, result: await memory.nl(q.q) }))
  );
  const answeredOrdering = await Promise.all(
    questions.ordering.map(async q => ({ ...q, result: await memory.nl(q.q) }))
  );

  const checkIncludes = (item) => {
    const correct = item.result.toString().toLowerCase().includes(item.answer.toLowerCase());
    return { answer: item.result, correct };
  };
  const orderingCheck = (item) => ({ answer: item.result, correct: false });

  const results = {
    singleHop: evaluateCategory('Single-hop Questions', answeredSingleHop, checkIncludes),
    multiHop: evaluateCategory('Multi-hop Questions', answeredMultiHop, checkIncludes),
    temporal: evaluateCategory('Temporal Reasoning Questions', answeredTemporal, checkIncludes),
    ordering: evaluateCategory('Event Ordering Questions', answeredOrdering, orderingCheck)
  };

  return results;
}

function extractEntities(query) {
  const entities = [];
  if (query.includes('alice')) entities.push('alice');
  if (query.includes('bob')) entities.push('bob');
  return entities;
}

function classifyQuery(query) {
  if (query.includes('when')) return 'timeline';
  if (query.includes('after') || query.includes('before')) return 'compare';
  if (query.includes('list') || query.includes('sequence') || query.includes('chronological')) return 'ordered-query';
  return 'query';
}

function buildJsonResponse(query) {
  const entities = extractEntities(query);
  const action = classifyQuery(query);
  const base = { action, entities: entities.length > 0 ? entities : undefined };

  if (action === 'compare') {
    return { ...base, entities: entities.length > 0 ? entities : ['alice'], timeframe: { from: '2024-01-01', to: '2024-12-31' } };
  }
  if (action === 'ordered-query') {
    return { ...base, action: 'query', orderBy: { field: 'time', direction: 'asc' } };
  }
  if (action === 'timeline') {
    return { ...base, entities: entities.length > 0 ? entities : ['alice', 'bob'] };
  }
  return base;
}

async function main() {
  console.log('='.repeat(60));
  console.log('WhenM x LoCoMo Benchmark Integration');
  console.log('='.repeat(60));
  console.log();

  const memory = await WhenM.custom({
    async parseEvent(text) {
      const patterns = [
        /^(\w+)\s+(learned|completed|joined|became|built|won|planned)\s+(.+)$/i,
        /^(\w+)\s+(\w+)\s+(.+)$/i
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return { subject: match[1].toLowerCase(), verb: match[2].toLowerCase(), object: match[3] };
        }
      }
      const parts = text.split(' ');
      return { subject: parts[0].toLowerCase(), verb: parts[1].toLowerCase(), object: parts.slice(2).join(' ') };
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
    async parseQuestion(_q) { return { queryType: 'what', subject: 'test' }; },
    async formatResponse(results) { return results; },
    async complete(prompt, options = {}) {
      if (options.format === 'json') {
        const query = prompt.toLowerCase();
        return JSON.stringify(buildJsonResponse(query));
      }
      return "Mock response";
    }
  }, { debug: false });

  await parseConversation(memory, locomoSessions);
  const results = await evaluateQuestions(memory, locomoQuestions);

  console.log('='.repeat(60));
  console.log('LoCoMo Benchmark Results:');
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
    console.log(`${cat.replace(/([A-Z])/g, ' $1').trim()}: ${score.correct}/${score.total} (${accuracy}%)`);
  }

  console.log(`\nOverall: ${totalCorrect}/${totalQuestions} (${(totalCorrect/totalQuestions*100).toFixed(1)}%)`);
}

main().catch(console.error);
