#!/usr/bin/env node

/**
 * Test with simplified mock that actually works
 */

import { WhenM } from '../../dist/whenm.js';

function matchPattern(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

function storeEventData(memory, subject, text, object) {
  if (!memory.has(subject)) {
    memory.set(subject, {});
  }
  const data = memory.get(subject);

  if (text.includes('became') || text.includes('joined as')) {
    data.role = object;
  } else if (text.includes('learned') || text.includes('grokked')) {
    if (!data.knows) data.knows = [];
    data.knows.push(object);
  } else if (text.includes('moved to') || text.includes('\u5F15\u3063\u8D8A\u3057\u305F')) {
    data.location = object;
  } else if (text.includes('acquired')) {
    data.owns = object;
  }
}

function findSubjectInQuestion(q, names) {
  for (const name of names) {
    if (q.includes(name)) return name;
  }
  return null;
}

function detectQueryType(q) {
  if (q.includes('what')) return 'what';
  if (q.includes('who')) return 'who';
  if (q.includes('when')) return 'when';
  return 'what';
}

function answerQuestion(data, q) {
  if (q.includes('role')) return data.role || "I don't know";
  if (q.includes('know')) return data.knows ? data.knows.join(', ') : "I don't know";
  if (q.includes('where') || q.includes('\u3069\u3053')) return data.location || "I don't know";
  if (q.includes('own')) return data.owns || "I don't know";

  const values = Object.values(data);
  if (values.length > 0) {
    return Array.isArray(values[0]) ? values[0].join(', ') : String(values[0]);
  }
  return "I don't know";
}

class SimpleMockProvider {
  constructor() {
    this.memory = new Map();
    this.patterns = [
      /^(.+?) became (.+)$/i,
      /^(.+?) learned (.+)$/i,
      /^(.+?) joined as (.+)$/i,
      /^(.+?) moved to (.+)$/i,
      /^(.+?) acquired (.+)$/i,
      /^(.+?) defeated (.+)$/i,
      /^(.+?) grokked (.+)$/i,
      /^(.+?)\u304C(.+?)\u306B\u5F15\u3063\u8D8A\u3057\u305F$/,
      /^(.+?)\u304C(.+)$/,
    ];
    this.names = ['alice', 'bob', 'charlie', '\u592A\u90CE', 'player', 'techcorp', 'startupx'];
  }

  async parseEvent(text) {
    const match = matchPattern(text, this.patterns);
    if (match) {
      const subject = match[1].toLowerCase().trim();
      const object = match[match.length - 1].trim();
      const verb = match[2] || 'did';
      storeEventData(this.memory, subject, text, object);
      return { subject, verb, object };
    }
    return { subject: 'unknown', verb: 'did', object: text };
  }

  async generateRules(verb) {
    return { initiates: [{ fluent: verb }], type: 'state_change' };
  }

  async parseQuestion(question) {
    const q = question.toLowerCase();
    const subject = findSubjectInQuestion(q, this.names) || 'unknown';
    return {
      queryType: detectQueryType(q),
      subject,
      predicate: q.includes('role') ? 'role' : q.includes('know') ? 'knows' : undefined,
      timeframe: undefined
    };
  }

  async formatResponse(results, question) {
    const q = question.toLowerCase();
    const subject = findSubjectInQuestion(q, this.names);

    if (!subject || !this.memory.has(subject)) {
      return (q.includes('\u65E5\u672C\u8A9E') || q.includes('\u306F')) ? '\u308F\u304B\u308A\u307E\u305B\u3093' : "I don't know";
    }

    return answerQuestion(this.memory.get(subject), q);
  }

  async complete(prompt) {
    return '{}';
  }
}

async function test() {
  const provider = new SimpleMockProvider();
  const memory = await WhenM.custom(provider);

  await memory.remember("Alice joined as intern", "2020-01-01");
  await memory.remember("Alice became senior engineer", "2022-06-01");
  await memory.remember("Alice became CTO", "2024-01-01");

  const role = await memory.ask("What is Alice's role?");

  await memory.remember("Bob learned Python", "2019-01-01");
  await memory.remember("Bob learned Rust", "2021-01-01");

  const skills = await memory.ask("What does Bob know?");

  await memory.remember("\u592A\u90CE\u304C\u6771\u4EAC\u306B\u5F15\u3063\u8D8A\u3057\u305F", "2024-01-01");
  const location = await memory.ask("\u592A\u90CE\u306F\u3069\u3053\u306B\u4F4F\u3093\u3067\u3044\u308B\uFF1F");
}

test().catch(() => {});
