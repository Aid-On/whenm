/**
 * Mock LLM Provider for Testing
 *
 * Provides mock responses for the LLM provider interface
 */

import { NLPParser } from '../processors/nlp-parser.js';

interface ParsedEvent {
  subject: string;
  verb: string;
  object?: string;
  context?: Record<string, unknown>;
}

interface GeneratedRules {
  type: 'state_change' | 'instantaneous' | 'continuous';
  initiates?: Array<{ fluent: string; pattern?: string }>;
  terminates?: Array<{ fluent: string; pattern?: string }>;
}

interface ParsedQuestion {
  queryType: string;
  subject: string | null;
  predicate: string | null;
  object: string | null;
}

/**
 * Generate mock completion response based on prompt content
 */
export function mockComplete(prompt: string): string {
  if (prompt.includes('Extract structured event')) {
    return '{"subject":"Alice","verb":"learned","object":"Python"}';
  }
  if (prompt.includes('Generate rules')) {
    return '{"type":"state_change","initiates":[{"fluent":"learned_state"}]}';
  }
  if (prompt.includes('Parse this question')) {
    return '{"queryType":"what","subject":"Alice","predicate":"status"}';
  }
  if (prompt.includes('Format response')) {
    return 'Alice is currently in Tokyo.';
  }
  return '{"result":"mock"}';
}

/**
 * Parse event in mock mode using simple word splitting
 */
export function mockParseEvent(text: string): ParsedEvent {
  if (!text) {
    return { subject: 'unknown', verb: 'unknown', object: undefined };
  }
  const words = text.split(' ');
  return {
    subject: words[0],
    verb: words[1] || 'did',
    object: words.slice(2).join(' ') || undefined
  };
}

/**
 * Generate rules in mock mode
 */
export function mockGenerateRules(verb: string): GeneratedRules {
  return {
    type: 'instantaneous',
    initiates: [{ fluent: verb + '_state' }]
  };
}

/**
 * Parse question in mock mode using NLPParser
 */
export function mockParseQuestion(question: string): ParsedQuestion {
  if (!question) {
    return { queryType: 'what', subject: null, predicate: null, object: null };
  }

  const queryType = NLPParser.detectQuestionType(question);
  const subject = NLPParser.extractQuestionSubject(question);
  const keywords = NLPParser.extractKeywords(question);
  const lower = question.toLowerCase();

  const { predicate, object } = extractPredicateAndObject(queryType, lower, keywords, question);
  return { queryType, subject, predicate, object };
}

function extractPredicateAndObject(
  queryType: string,
  lower: string,
  keywords: string[],
  question: string
): { predicate: string | null; object: string | null } {
  if (queryType === 'what' && (lower.includes('position') || lower.includes('role'))) {
    return { predicate: 'be', object: 'current position' };
  }

  if (queryType !== 'when' || keywords.length === 0) {
    return { predicate: null, object: null };
  }

  const predicate = keywords[0];
  const afterVerb = question.match(
    new RegExp(`(?:${predicate}|${predicate}ed|${predicate}s)\\s+(.+?)(?:\\?|$)`, 'i')
  );
  const object = afterVerb ? afterVerb[1].trim() : null;
  return { predicate, object };
}

/**
 * Format response in mock mode
 */
export function mockFormatResponse(data: unknown, _question: string): string {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return 'I don\'t have any information about that.';
  }

  if (!Array.isArray(data) || data.length === 0) {
    return 'Alice learned Python';
  }

  const first = data[0] as Record<string, string>;
  return formatFirstEvent(first);
}

function formatFirstEvent(event: Record<string, string>): string {
  if (event.verb === 'is' && event.object) {
    return `${event.subject} is ${event.object}.`;
  }
  if (event.verb && event.object && event.date) {
    return `${event.subject} ${event.verb} ${event.object} on ${event.date}.`;
  }
  if (event.verb && event.object) {
    return `${event.subject} ${event.verb} ${event.object}.`;
  }
  return 'Alice learned Python';
}

/**
 * Fallback question parsing based on question structure
 */
const QUESTION_PREFIX_MAP: Array<[string, string]> = [
  ['when', 'when'], ['what', 'what'], ['who', 'who'],
  ['how', 'how'], ['why', 'why'], ['where', 'where']
];

const QUESTION_CONTAINS_MAP: Array<[string, string]> = [
  ['\u3044\u3064', 'when'], ['\u4F55', 'what'], ['\u8AB0', 'who']
];

export function fallbackParseQuestion(question: string): ParsedQuestion {
  const lower = question.toLowerCase();
  const queryType = detectQueryType(lower);
  return { queryType, subject: null, predicate: null, object: null };
}

function detectQueryType(lower: string): string {
  for (const [prefix, type] of QUESTION_PREFIX_MAP) {
    if (lower.startsWith(prefix)) return type;
  }
  for (const [substring, type] of QUESTION_CONTAINS_MAP) {
    if (lower.includes(substring)) return type;
  }
  return 'what';
}
