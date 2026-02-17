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
} from './core/engine-factory.js';
import { UniLLMProvider, type UnifiedLLMProvider } from './providers/llm-provider.js';
import type { WhenMEngine } from './index.js';

interface DiffResult {
  from: { date: string | Date; state: string };
  to: { date: string | Date; state: string };
}

/**
 * WhenM Main Class
 *
 * @example
 * ```typescript
 * const whenm = WhenM.cloudflare({ accountId: '...', apiKey: '...' });
 * const whenm = WhenM.groq(process.env.GROQ_API_KEY);
 * await whenm.remember("Alice became CEO");
 * await whenm.ask("What is Alice's role?");
 * ```
 */
export class WhenM {
  private engine: UnifiedSchemalessEngine;
  private constructor(engine: UnifiedSchemalessEngine) { this.engine = engine; }

  static async create(config: string | UniLLMConfig | CreateEngineOptions): Promise<WhenM> {
    let engineOptions: CreateEngineOptions;

    if (typeof config === 'string') {
      engineOptions = { llm: config };
    } else if ('provider' in config && !('llm' in config)) {
      engineOptions = { llm: config as UniLLMConfig };
    } else {
      engineOptions = config as CreateEngineOptions;
    }

    const engine = await createUnifiedEngine(engineOptions);
    return new WhenM(engine);
  }

  static async auto(options?: CreateEngineOptions): Promise<WhenM> {
    if (typeof process !== 'undefined' && process.env) {
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
        return WhenM.create({ llm: `groq:${process.env.GROQ_API_KEY}`, ...options });
      }

      if (process.env.GEMINI_API_KEY) {
        return WhenM.create({ llm: `gemini:${process.env.GEMINI_API_KEY}`, ...options });
      }
    }

    return WhenM.create({ llm: 'mock', ...options });
  }

  static async mock(options?: CreateEngineOptions): Promise<WhenM> {
    const engine = await createUnifiedEngine({ llm: 'mock', ...options });
    return new WhenM(engine);
  }

  static async cloudflare(options: {
    accountId: string;
    apiKey: string;
    email?: string;
    model?: string;
    debug?: boolean;
  }): Promise<WhenM> {
    const engine = await createCloudflareEngine(options.accountId, options.apiKey, options.email);
    return new WhenM(engine);
  }

  static async groq(apiKey: string, model?: string): Promise<WhenM> {
    const engine = await createGroqEngine(apiKey, model);
    return new WhenM(engine);
  }

  static async gemini(apiKey: string, model?: string): Promise<WhenM> {
    const engine = await createGeminiEngine(apiKey, model);
    return new WhenM(engine);
  }

  static async custom(
    llmProvider: UniLLMProvider | UniLLMConfig,
    options?: CreateEngineOptions
  ): Promise<WhenM> {
    const engine = await createUnifiedEngine({ ...options, llm: llmProvider });
    return new WhenM(engine);
  }

  async remember(text: string, date?: string | Date): Promise<WhenM> {
    await this.engine.remember(text, date);
    return this;
  }

  async ask(question: string, date?: string | Date): Promise<string> {
    return this.engine.ask(question, date);
  }

  /**
   * @deprecated Entity manipulation removed in schemaless implementation
   */
  entity(_name: string): unknown {
    return null;
  }

  async recent(days: number = 30): Promise<string> {
    return this.ask(`What events happened in the last ${days} days?`);
  }

  async search(keyword: string): Promise<string> {
    return this.ask(`What events contain "${keyword}"?`);
  }

  async getEvents(options?: { limit?: number }): Promise<unknown[]> {
    const eng = this.engine.getEngine();
    if (eng.getEvents) {
      return eng.getEvents(options);
    }
    return [];
  }

  async reset(): Promise<void> {
    const eng = this.engine.getEngine();
    if (eng.reset) {
      return eng.reset();
    }
    throw new Error('Reset not supported');
  }

  async export(): Promise<string> {
    return this.exportKnowledge();
  }

  async import(knowledge: string): Promise<void> {
    const eng = this.engine.getEngine();
    if (eng.loadFacts) {
      return eng.loadFacts(knowledge);
    }
    throw new Error('Import not supported');
  }

  getEngine(): WhenMEngine {
    return this.engine.getEngine();
  }

  exportKnowledge(): string {
    return this.engine.getLearner().exportRules();
  }

  async batch(events: Array<{ text: string; date?: string | Date }>): Promise<WhenM> {
    for (const event of events) {
      await this.remember(event.text, event.date);
    }
    return this;
  }

  async diff(entity: string, from: string | Date, to: string | Date): Promise<DiffResult> {
    const fromState = await this.engine.ask(`What was ${entity}'s state?`, from);
    const toState = await this.engine.ask(`What was ${entity}'s state?`, to);
    return {
      from: { date: from, state: fromState },
      to: { date: to, state: toState }
    };
  }

  async askMany(questions: string[], date?: string | Date): Promise<string[]> {
    return Promise.all(questions.map(q => this.ask(q, date)));
  }

  debug(enabled: boolean): WhenM {
    if ('options' in this.engine) {
      (this.engine as unknown as { options: { debug: boolean } }).options.debug = enabled;
    }
    return this;
  }

  async persist(): Promise<void> {
    if ('persist' in this.engine && typeof this.engine.persist === 'function') {
      await this.engine.persist();
    }
  }

  async restore(query?: unknown): Promise<void> {
    if ('restore' in this.engine && typeof this.engine.restore === 'function') {
      await this.engine.restore(query);
    }
  }

  async persistenceStats(): Promise<Record<string, unknown>> {
    if ('getPersistenceStats' in this.engine && typeof this.engine.getPersistenceStats === 'function') {
      return this.engine.getPersistenceStats();
    }
    return { enabled: false };
  }
}

export default WhenM;
