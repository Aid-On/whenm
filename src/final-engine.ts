/**
 * Final Unified Schemaless Engine
 * 
 * Entry point and factory functions for the WhenM temporal memory system
 */

import type { WhenMEngine } from './index.js';
import { UniLLMProvider, type UniLLMConfig } from './llm-provider.js';
import { UnifiedSchemalessEngine } from './unified-engine.js';
import { QueryRefinementLayer } from './query-refiner.js';

// Re-export for backward compatibility
export { UniLLMProvider, UnifiedSchemalessEngine, QueryRefinementLayer };
export type { UnifiedLLMProvider, UniLLMConfig } from './llm-provider.js';

/**
 * Unified engine creation options
 */
export interface CreateEngineOptions {
  // LLM configuration - unified approach
  llm?: UniLLMConfig | string | UniLLMProvider;  // Config, "provider:apikey", or instance
  
  // Engine options
  debug?: boolean;
  autoLearn?: boolean;
  useUnixTime?: boolean;
  persistenceType?: 'memory' | 'd1' | 'custom';
  persistenceOptions?: any;
  useCompromise?: boolean;
}

/**
 * Create unified engine with options
 */
export async function createUnifiedEngine(options: CreateEngineOptions = {}): Promise<UnifiedSchemalessEngine> {
  // Create Prolog engine with error handling
  let prolog: any;
  try {
    const { Prolog } = await import('trealla');
    prolog = new Prolog();
    await prolog.init();  // Initialize the WASM module
  } catch (error) {
    // Fallback to mock Prolog for testing
    if (options.debug) {
      console.error('Prolog initialization failed:', error);
    }
    prolog = {
      consult: async () => { throw new Error('Prolog not available'); },
      consultText: async () => { throw new Error('Prolog not available'); },
      query: async () => { throw new Error('Prolog not available'); },
      queryOnce: async () => null
    };
  }
  
  // In-memory storage for testing
  const eventStore: any[] = [];
  
  const engine: WhenMEngine = {
    async remember(event: string, metadata?: any): Promise<void> {
      // Store in memory
      eventStore.push({ event, metadata, timestamp: Date.now() });
    },
    async assertEvent(fact: string, date?: string): Promise<void> {
      // Assert Event Calculus fact into Prolog
      // The fact should already be in proper Prolog format
      
      try {
        if (prolog.consultText) {
          // Use consultText to add the fact
          await prolog.consultText(fact);
        } else if (prolog.assertz) {
          // Remove trailing period for assertz
          await prolog.assertz(fact.replace(/\.$/, ''));
        }
      } catch (error) {
        if (options.debug) {
          console.error('Failed to assert fact:', fact, error);
        }
      }
      
      // Also store in memory for fallback
      const timestamp = date ? new Date(date).getTime() : Date.now();
      eventStore.push({ event: fact, metadata: { date }, timestamp });
    },
    async query(question: string): Promise<any> {
      // Try Prolog first
      try {
        if (prolog.query) {
          const results = [];
          for await (const answer of prolog.query(question)) {
            results.push(answer);
          }
          if (results.length > 0) {
            return results;
          }
        }
      } catch (error) {
        if (options.debug) {
          console.error('Prolog query failed:', error);
        }
      }
      
      // Fallback to in-memory
      return eventStore.filter(e => 
        e.event.includes(question.replace('event(', '').replace(')', ''))
      );
    },
    async getEvents(options?: any): Promise<any[]> {
      return eventStore;
    },
    async reset(): Promise<void> {
      // Clear storage
      eventStore.length = 0;
    },
    async loadFacts(facts: string): Promise<void> {
      try {
        // Use consultText for Trealla
        if (prolog.consultText) {
          await prolog.consultText(facts);
        } else if (prolog.consult) {
          // Fall back to file-based consult
          await prolog.consult(facts);
        }
      } catch (error) {
        // Log error but continue with in-memory fallback
        if (options.debug) {
          console.error('Failed to load facts:', error);
        }
      }
      
      // Also parse and store in eventStore for getEvents
      const lines = facts.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // Parse event_at(event(...), "date") format
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
  };
  
  // Override query method with enhanced fallback
  engine.query = async (queryString: string): Promise<any> => {
    try {
      const results = await prolog.query(queryString);
      // Convert AsyncGenerator to array
      const processed: any[] = [];
      for await (const result of results) {
        processed.push(result);
      }
      return processed;
    } catch (error) {
      // Fallback to in-memory search for testing
      if (queryString.includes('event(')) {
        // Parse the Prolog-style query
        const match = queryString.match(/event\("?([^",]*)"?,\s*"?([^",]*)"?,\s*"?([^",)]*)"?\)/);
        if (match) {
          const [, subject, verb, object] = match;
          return eventStore.filter(e => {
            if (!e.event) return false;
            const evt = e.event;
            return (!subject || subject === '_' || evt.includes(subject)) &&
                   (!verb || verb === '_' || evt.includes(verb)) &&
                   (!object || object === '_' || evt.includes(object));
          });
        }
      }
      return eventStore;
    }
  };
  
  // Create or use provided LLM provider - unified approach
  let llm: UniLLMProvider;
  
  if (options.llm instanceof UniLLMProvider) {
    // Already an instance
    llm = options.llm;
  } else if (typeof options.llm === 'string') {
    // Simple string format: "provider:apikey" or "provider:apikey:model"
    llm = new UniLLMProvider(options.llm);
  } else if (options.llm) {
    // Config object
    llm = new UniLLMProvider(options.llm);
  } else {
    // Default mock provider
    llm = new UniLLMProvider({ provider: 'mock' });
  }
  
  // Create unified engine
  const unifiedEngine = new UnifiedSchemalessEngine(engine, llm, {
    autoLearn: options.autoLearn,
    debug: options.debug,
    useUnixTime: options.useUnixTime,
    persistenceType: options.persistenceType,
    persistenceOptions: options.persistenceOptions,
    useCompromise: options.useCompromise !== false  // Enable by default
  });
  
  // Initialize
  await unifiedEngine.initialize();
  
  return unifiedEngine;
}

/**
 * Create a mock engine for testing
 */
export async function createMockEngine(): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({
    llm: 'mock'
  });
}

/**
 * Quick creation helpers
 */
export async function createGroqEngine(apiKey: string, model?: string): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({
    llm: model ? `groq:${apiKey}:${model}` : `groq:${apiKey}`
  });
}

export async function createGeminiEngine(apiKey: string, model?: string): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({
    llm: { provider: 'gemini', apiKey, model }
  });
}

export async function createCloudflareEngine(accountId: string, apiKey: string, email?: string): Promise<UnifiedSchemalessEngine> {
  return createUnifiedEngine({
    llm: {
      provider: 'cloudflare',
      apiKey,
      cloudflare: { accountId, email }
    }
  });
}