/**
 * Query operations for UnifiedSchemalessEngine
 *
 * Extracted from unified-engine.ts for maintainability
 */

import type { WhenMEngine } from '../index.js';
import type { UnifiedLLMProvider } from '../providers/llm-provider.js';

export interface QueryOptions {
  debug?: boolean;
}

/**
 * Filter results for relevance using LLM
 */
export async function filterRelevantResults(
  results: unknown[],
  question: string,
  llm: UnifiedLLMProvider
): Promise<unknown[]> {
  const prompt = `Given these events, which are most relevant to answer: "${question}"?
Events: ${JSON.stringify(results)}
Return only the indices of relevant events as JSON array (e.g., [0, 2]):`;

  try {
    const response = await llm.complete(prompt);
    const indices = JSON.parse(response);
    return indices.map((i: number) => (results as unknown[])[i]).filter(Boolean);
  } catch {
    return results;
  }
}

/**
 * Execute structured Prolog query (truly schemaless)
 */
export async function executeStructuredQuery(
  query: { subject?: string; targetDomain?: string },
  engine: WhenMEngine,
  options: QueryOptions
): Promise<unknown[]> {
  if (!engine.query) {
    return [];
  }

  const { subject, targetDomain } = query;

  let prologQuery = '';

  if (targetDomain && subject) {
    const normalizedSubject = subject.toLowerCase();
    prologQuery = `findall(Val, current_state("${normalizedSubject}", ${targetDomain}, Val), Results)`;
  } else if (subject) {
    const normalizedSubject = subject.toLowerCase();
    prologQuery = `all_current_states("${normalizedSubject}", States)`;
  }

  if (!prologQuery) {
    return [];
  }

  const results = await engine.query(prologQuery);
  return processQueryResults(results);
}

/**
 * Process query results from Prolog engine, handling AsyncGenerator and arrays
 */
export async function processQueryResults(results: unknown): Promise<unknown[]> {
  const processed: unknown[] = [];

  if (!results || typeof results !== 'object') {
    return processed;
  }

  if (Symbol.asyncIterator in (results as Record<symbol, unknown>)) {
    for await (const result of results as AsyncIterable<unknown>) {
      processed.push(result);
    }
  } else if (Array.isArray(results)) {
    return results;
  } else if ((results as { length?: number }).length !== undefined) {
    return Array.from(results as Iterable<unknown>);
  }

  return processed;
}

/**
 * Build and execute a Prolog query for current state
 */
export function buildCurrentStateQuery(
  subject: string,
  domain: string
): string {
  return `findall(Val, current_state("${subject}", ${domain}, Val), Results)`;
}
