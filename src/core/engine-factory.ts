/**
 * Final Unified Schemaless Engine
 *
 * Entry point and factory functions for the WhenM temporal memory system
 */

import type { WhenMEngine, EventMetadata } from '../index.js';
import { UniLLMProvider, type UniLLMConfig } from '../providers/llm-provider.js';
import { UnifiedSchemalessEngine } from './unified-engine.js';
import { QueryRefinementLayer } from '../processors/query-refiner.js';

// Re-export for backward compatibility
export { UniLLMProvider, UnifiedSchemalessEngine, QueryRefinementLayer };
export type { UnifiedLLMProvider, UniLLMConfig } from '../providers/llm-provider.js';

/**
 * Unified engine creation options
 */
export interface CreateEngineOptions {
  llm?: UniLLMConfig | string | UniLLMProvider;
  debug?: boolean;
  autoLearn?: boolean;
  useUnixTime?: boolean;
  persistenceType?: 'memory' | 'd1' | 'custom';
  persistenceOptions?: unknown;
  useCompromise?: boolean;
}

interface EventStoreEntry {
  event: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

/**
 * Create a mock Prolog engine for fallback
 */
function createMockProlog(): Record<string, (...args: unknown[]) => unknown> {
  return {
    consult: async () => { throw new Error('Prolog not available'); },
    consultText: async () => { throw new Error('Prolog not available'); },
    query: async () => { throw new Error('Prolog not available'); },
    queryOnce: async () => null
  };
}

/**
 * Create the WhenMEngine backed by Prolog + in-memory store
 */
function createEngineImpl(
  prolog: Record<string, (...args: unknown[]) => unknown>,
  eventStore: EventStoreEntry[],
  debug?: boolean
): WhenMEngine {
  const engine: WhenMEngine = {
    async remember(event: string, metadata?: EventMetadata): Promise<void> {
      eventStore.push({ event, metadata: (metadata ?? {}) as Record<string, unknown>, timestamp: Date.now() });
    },
    async assertEvent(fact: string, date?: string): Promise<void> {
      try {
        if (prolog.consultText) {
          await prolog.consultText(fact);
        } else if (prolog.assertz) {
          await prolog.assertz(fact.replace(/\.$/, ''));
        }
      } catch {
        // Prolog assertion failed, continue with in-memory fallback
      }
      const timestamp = date ? new Date(date).getTime() : Date.now();
      eventStore.push({ event: fact, metadata: { date }, timestamp });
    },
    async query(question: string): Promise<unknown> {
      return queryProlog(prolog, eventStore, question);
    },
    async getEvents(): Promise<unknown[]> {
      return eventStore;
    },
    async reset(): Promise<void> {
      eventStore.length = 0;
    },
    async loadFacts(facts: string): Promise<void> {
      try {
        if (prolog.consultText) {
          await prolog.consultText(facts);
        } else if (prolog.consult) {
          await prolog.consult(facts);
        }
      } catch {
        // Log error but continue with in-memory fallback
      }
      parseFactsIntoStore(facts, eventStore);
    }
  };

  engine.query = async (queryString: string): Promise<unknown> => {
    return queryProlog(prolog, eventStore, queryString);
  };

  return engine;
}

async function queryProlog(
  prolog: Record<string, (...args: unknown[]) => unknown>,
  eventStore: EventStoreEntry[],
  queryString: string
): Promise<unknown[]> {
  try {
    const results = prolog.query(queryString) as AsyncIterable<unknown>;
    const processed: unknown[] = [];
    for await (const result of results) {
      processed.push(result);
    }
    return processed;
  } catch {
    if (queryString.includes('event(')) {
      const match = queryString.match(/event\("?([^",]*)"?,\s*"?([^",]*)"?,\s*"?([^",)]*)"?\)/);
      if (match) {
        const [, subject, verb, object] = match;
        return eventStore.filter(e => {
          if (!e.event) return false;
          return (!subject || subject === '_' || e.event.includes(subject)) &&
                 (!verb || verb === '_' || e.event.includes(verb)) &&
                 (!object || object === '_' || e.event.includes(object));
        });
      }
    }
    return eventStore;
  }
}

function parseFactsIntoStore(facts: string, eventStore: EventStoreEntry[]): void {
  const lines = facts.split('\n').filter(line => line.trim());
  for (const line of lines) {
    const match = line.match(/event_at\((.+?),\s*"([^"]+)"\)/);
    if (match) {
      eventStore.push({
        event: match[1],
        metadata: { date: match[2] },
        timestamp: new Date(match[2]).getTime()
      });
    }
  }
}

/**
 * Create unified engine with options
 */
export async function createUnifiedEngine(
  options: CreateEngineOptions = {}
): Promise<UnifiedSchemalessEngine> {
  let prolog: Record<string, (...args: unknown[]) => unknown>;
  try {
    const { Prolog } = await import('trealla');
    const p = new Prolog();
    await p.init();
    prolog = p as unknown as Record<string, (...args: unknown[]) => unknown>;
  } catch {
    prolog = createMockProlog();
  }

  const eventStore: EventStoreEntry[] = [];
  const engine = createEngineImpl(prolog, eventStore, options.debug);

  let llm: UniLLMProvider;

  if (options.llm instanceof UniLLMProvider) {
    llm = options.llm;
  } else if (typeof options.llm === 'string') {
    llm = new UniLLMProvider(options.llm);
  } else if (options.llm) {
    llm = new UniLLMProvider(options.llm);
  } else {
    llm = new UniLLMProvider({ provider: 'mock' });
  }

  const unifiedEngine = new UnifiedSchemalessEngine(engine, llm, {
    autoLearn: options.autoLearn,
    debug: options.debug,
    useUnixTime: options.useUnixTime,
    persistenceType: options.persistenceType,
    persistenceOptions: options.persistenceOptions,
    useCompromise: options.useCompromise !== false
  });

  await unifiedEngine.initialize();
  return unifiedEngine;
}

/**
 * Create a mock engine for testing
 */
export async function createMockEngine(): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({ llm: 'mock' });
}

/**
 * Quick creation helpers
 */
export async function createGroqEngine(
  apiKey: string,
  model?: string
): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({
    llm: model ? `groq:${apiKey}:${model}` : `groq:${apiKey}`
  });
}

export async function createGeminiEngine(
  apiKey: string,
  model?: string
): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({
    llm: { provider: 'gemini', apiKey, model }
  });
}

export async function createCloudflareEngine(
  accountId: string,
  apiKey: string,
  email?: string
): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({
    llm: { provider: 'cloudflare', apiKey, accountId, email }
  });
}
