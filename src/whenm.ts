/**
 * WhenM - Temporal Memory for AI
 * 
 * Clean, intuitive API for temporal memory operations
 */

import { 
  UnifiedSchemalessEngine, 
  createUnifiedEngine,
  createGroqEngine,
  createGeminiEngine,
  createCloudflareEngine,
  type CreateEngineOptions,
  type UniLLMConfig
} from './final-engine.js';
import { UniLLMProvider, type UnifiedLLMProvider } from './llm-provider.js';
import type { WhenMEngine } from './index.js';
import { QueryBuilder, Timeline, createQueryBuilder, createTimeline } from './query-builder.js';
import { NaturalLanguageQuery, NaturalLanguageQueryChain } from './natural-query.js';

/**
 * WhenM メインクラス
 * 
 * @example
 * ```typescript
 * // Cloudflare Workers AI
 * const whenm = WhenM.cloudflare({
 *   accountId: '...',
 *   apiToken: '...'
 * });
 * 
 * // Groq
 * const whenm = WhenM.groq(process.env.GROQ_API_KEY);
 * 
 * // Gemini
 * const whenm = WhenM.gemini(process.env.GEMINI_API_KEY);
 * 
 * // カスタム
 * const whenm = WhenM.create({ ... });
 * 
 * // 使用
 * await whenm.remember("Alice became CEO");
 * await whenm.ask("What is Alice's role?");
 * ```
 */
export class WhenM {
  private constructor(private engine: UnifiedSchemalessEngine) {}


  /**
   * Create WhenM with unified config
   * 
   * @example
   * ```typescript
   * // Simple string format
   * const whenm = await WhenM.create('groq:api-key');
   * const whenm = await WhenM.create('groq:api-key:llama-3.3-70b-versatile');
   * 
   * // Config object
   * const whenm = await WhenM.create({
   *   provider: 'groq',
   *   apiKey: 'your-key',
   *   model: 'llama-3.3-70b-versatile'
   * });
   * ```
   */
  static async create(config: string | UniLLMConfig | CreateEngineOptions): Promise<WhenM> {
    let engineOptions: CreateEngineOptions;
    
    if (typeof config === 'string') {
      engineOptions = { llm: config };
    } else if ('provider' in config && !('llm' in config)) {
      // UniLLMConfig format
      engineOptions = { llm: config as UniLLMConfig };
    } else {
      // Full CreateEngineOptions
      engineOptions = config as CreateEngineOptions;
    }
    
    const engine = await createUnifiedEngine(engineOptions);
    return new WhenM(engine);
  }

  /**
   * Auto-detect provider from environment variables
   */
  static async auto(options?: CreateEngineOptions): Promise<WhenM> {
    // Check for environment variables
    if (typeof process !== 'undefined' && process.env) {
      // Special case: if CLOUDFLARE_ACCOUNT_ID is 'mock', use mock provider
      if (process.env.CLOUDFLARE_ACCOUNT_ID === 'mock') {
        return WhenM.create({ llm: 'mock', ...options });
      }
      
      if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_KEY) {
        return WhenM.create({
          llm: {
            provider: 'cloudflare',
            apiKey: process.env.CLOUDFLARE_API_KEY,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            email: process.env.CLOUDFLARE_EMAIL
          },
          ...options
        });
      }
      
      if (process.env.GROQ_API_KEY) {
        return WhenM.create({
          llm: `groq:${process.env.GROQ_API_KEY}`,
          ...options
        });
      }
      
      if (process.env.GEMINI_API_KEY) {
        return WhenM.create({
          llm: `gemini:${process.env.GEMINI_API_KEY}`,
          ...options
        });
      }
    }
    
    // Fallback to mock mode
    return WhenM.create({ llm: 'mock', ...options });
  }

  /**
   * Create WhenM instance with Cloudflare Workers AI
   */
  static async cloudflare(options: {
    accountId: string;
    apiKey: string;
    email?: string;
    model?: string;
    debug?: boolean;
  }): Promise<WhenM> {
    const engine = await createCloudflareEngine(
      options.accountId,
      options.apiKey,
      options.email
    );
    return new WhenM(engine);
  }

  /**
   * Create WhenM instance with Groq
   */
  static async groq(apiKey: string, model?: string): Promise<WhenM> {
    const engine = await createGroqEngine(apiKey, model);
    return new WhenM(engine);
  }

  /**
   * Create WhenM instance with Gemini
   */
  static async gemini(apiKey: string, model?: string): Promise<WhenM> {
    const engine = await createGeminiEngine(apiKey, model);
    return new WhenM(engine);
  }

  /**
   * Create WhenM instance with custom LLM provider
   */
  static async custom(llmProvider: UniLLMProvider | UniLLMConfig, options?: CreateEngineOptions): Promise<WhenM> {
    const engineOptions: CreateEngineOptions = {
      ...options,
      llm: llmProvider
    };
    const engine = await createUnifiedEngine(engineOptions);
    return new WhenM(engine);
  }


  /**
   * Remember an event at a specific time
   */
  async remember(text: string, date?: string | Date): Promise<WhenM> {
    await this.engine.remember(text, date);
    return this; // chainable
  }

  /**
   * Ask a question about the remembered events
   */
  async ask(question: string, date?: string | Date): Promise<string> {
    return this.engine.ask(question, date);
  }

  /**
   * Entity method removed - use natural language queries instead
   * @deprecated Entity manipulation removed in schemaless implementation
   */
  entity(name: string): any {
    console.warn('entity() method is deprecated. Use natural language queries instead.');
    return null;
  }

  /**
   * Create a modern query builder
   * 
   * @example
   * ```typescript
   * const events = await memory
   *   .query()
   *   .where({ subject: "Alice" })
   *   .last(30, 'days')
   *   .orderBy('time', 'desc')
   *   .execute();
   * ```
   */
  query(): QueryBuilder {
    return createQueryBuilder(this.engine.getEngine());
  }

  /**
   * Create a timeline for a specific entity
   * 
   * @example
   * ```typescript
   * const timeline = memory.timeline("Alice");
   * const snapshot = await timeline.at("2023-06-15");
   * const changes = await timeline.recent(30);
   * ```
   */
  timeline(entity: string): Timeline {
    return createTimeline(entity, this.engine.getEngine());
  }

  /**
   * Get recent events across all entities
   * 
   * @example
   * ```typescript
   * const recentEvents = await memory.recent(7); // Last 7 days
   * ```
   */
  async recent(days: number = 30): Promise<any[]> {
    return this.query().last(days, 'days').orderBy('time', 'desc').execute();
  }

  /**
   * Search events by keyword
   * 
   * @example
   * ```typescript
   * const promotions = await memory.search("promotion");
   * const learningEvents = await memory.search("learned");
   * ```
   */
  async search(keyword: string): Promise<any[]> {
    // This is a simplified search - could be enhanced with LLM
    const engineCore = this.engine.getEngine();
    if (!engineCore.allEvents) {
      return [];
    }
    const allEvents = await engineCore.allEvents();
    return allEvents.filter((e: any) => 
      e.event.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Natural Language Query Interface
   * 
   * @example
   * ```typescript
   * // Simple direct queries
   * await memory.nl("What did Alice do last month?");
   * await memory.nl("Show me all promotions in 2024");
   * await memory.nl("How many times did Bob learn something?");
   * 
   * // Chainable with modifiers
   * await memory
   *   .nl("What did Alice do")
   *   .during("last month")
   *   .limit(10);
   * 
   * await memory
   *   .nl("Show all learning events")
   *   .about("Bob")
   *   .recent(30);
   * ```
   */
  nl(query: string): NaturalLanguageQueryChain {
    const nlQuery = new NaturalLanguageQuery(
      this.engine.getEngine(),
      this.engine.getLLM()
    );
    return new NaturalLanguageQueryChain(nlQuery, query);
  }

  /**
   * Get all events
   */
  async getEvents(options?: { limit?: number }): Promise<any[]> {
    const engine = this.engine.getEngine();
    if (engine.getEvents) {
      return engine.getEvents(options);
    }
    // Fallback to query
    return this.query().limit(options?.limit || 1000).execute();
  }

  /**
   * Reset/clear all events
   */
  async reset(): Promise<void> {
    const engine = this.engine.getEngine();
    if (engine.reset) {
      return engine.reset();
    }
    throw new Error('Reset not supported');
  }

  /**
   * Export knowledge base
   */
  async export(): Promise<string> {
    return this.exportKnowledge();
  }

  /**
   * Import knowledge base
   */
  async import(knowledge: string): Promise<void> {
    const engine = this.engine.getEngine();
    if (engine.loadFacts) {
      return engine.loadFacts(knowledge);
    }
    throw new Error('Import not supported');
  }

  /**
   * Get the underlying engine for advanced usage
   */
  getEngine(): WhenMEngine {
    return this.engine.getEngine();
  }

  /**
   * Create a default LLM provider for natural language queries
   */
  private createDefaultLLM(): any {
    // Return the engine's internal LLM if available
    // This is a simplified version - in production, we'd properly type this
    return {
      async complete(prompt: string, options?: any): Promise<string> {
        return "Query result";
      },
      async parseEvent(text: string): Promise<any> {
        return { subject: "unknown", verb: "unknown", object: text };
      },
      async generateRules(verb: string, context: string): Promise<any> {
        return { type: "state_change" };
      },
      async parseQuestion(question: string): Promise<any> {
        return { queryType: "what", subject: "unknown" };
      },
      async formatResponse(results: any[], question: string): Promise<string> {
        return JSON.stringify(results);
      }
    };
  }

  /**
   * Export learned knowledge and rules
   */
  exportKnowledge() {
    // Use the learner to export rules
    return this.engine.getLearner().exportRules();
  }

  /**
   * Remember multiple events in batch
   */
  async batch(events: Array<{ text: string; date?: string | Date }>): Promise<WhenM> {
    for (const event of events) {
      await this.remember(event.text, event.date);
    }
    return this;
  }


  /**
   * Get state changes between two dates
   */
  async diff(entity: string, from: string | Date, to: string | Date): Promise<any> {
    const fromState = await this.engine.ask(`What was ${entity}'s state?`, from);
    const toState = await this.engine.ask(`What was ${entity}'s state?`, to);
    return {
      from: { date: from, state: fromState },
      to: { date: to, state: toState }
    };
  }

  /**
   * Ask multiple questions in parallel
   */
  async askMany(questions: string[], date?: string | Date): Promise<string[]> {
    return Promise.all(questions.map(q => this.ask(q, date)));
  }

  /**
   * Toggle debug mode
   */
  debug(enabled: boolean): WhenM {
    if ('options' in this.engine) {
      (this.engine as any).options.debug = enabled;
    }
    return this;
  }
  
  /**
   * Persist current state to configured storage
   * @example
   * await memory.persist();
   */
  async persist(): Promise<void> {
    if ('persist' in this.engine && typeof this.engine.persist === 'function') {
      await this.engine.persist();
    }
  }
  
  /**
   * Restore state from configured storage
   * @example
   * await memory.restore();
   * await memory.restore({ timeRange: { from: '2024-01-01' } });
   */
  async restore(query?: any): Promise<void> {
    if ('restore' in this.engine && typeof this.engine.restore === 'function') {
      await this.engine.restore(query);
    }
  }
  
  /**
   * Get persistence statistics
   * @example
   * const stats = await memory.persistenceStats();
   * console.log(`Total events: ${stats.totalEvents}`);
   */
  async persistenceStats(): Promise<any> {
    if ('getPersistenceStats' in this.engine && typeof this.engine.getPersistenceStats === 'function') {
      return this.engine.getPersistenceStats();
    }
    return { enabled: false };
  }
}

// Convenient shortcuts
export const whenm = {
  /**
   * Quick Cloudflare Workers AI setup
   * @example
   * const memory = await whenm.cloudflare('account-id', 'api-key', 'email@example.com');
   */
  cloudflare: async (accountId: string, apiKey: string, email: string, options?: any) => 
    WhenM.cloudflare({ accountId, apiKey, email, ...options }),
  
  /**
   * Quick Groq setup
   * @example
   * const memory = await whenm.groq(process.env.GROQ_API_KEY);
   */
  groq: async (apiKey: string, options?: any) => 
    WhenM.groq(apiKey, options),
  
  /**
   * Quick Gemini setup
   * @example
   * const memory = await whenm.gemini(process.env.GEMINI_API_KEY);
   */
  gemini: async (apiKey: string, options?: any) => 
    WhenM.gemini(apiKey, options),
  
  /**
   * Auto-detect provider from environment variables
   * @example
   * const memory = await whenm.auto();
   */
  auto: async (options?: any) => WhenM.auto(options)
};

// Default export
export default WhenM;