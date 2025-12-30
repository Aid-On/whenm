/**
 * Unified Schemaless Engine for WhenM
 * 
 * Core engine that combines Prolog reasoning with LLM capabilities
 */

import type { WhenMEngine } from './index.js';
import type { UnifiedLLMProvider } from './llm-provider.js';
import { DynamicRuleLearner } from './rule-learner.js';
import { QueryRefinementLayer } from './query-refiner.js';
import { createPersistence, type PersistencePlugin } from './persistence/index.js';
import { EventCalculusProcessor, type EventCalculusStructure } from './event-calculus-processor.js';
import { SchemalessQueryParser } from './schemaless-query-parser.js';

/**
 * 統合スキーマレスエンジン
 */
export class UnifiedSchemalessEngine {
  private learner: DynamicRuleLearner;
  private refiner: QueryRefinementLayer;
  private persistence?: PersistencePlugin;
  public _eventLog: Array<{ event: any; timestamp: number; date: string; text?: string }> = [];
  private ecProcessor: EventCalculusProcessor;
  private ecEvents: EventCalculusStructure[] = [];
  private queryParser: SchemalessQueryParser;
  
  constructor(
    private engine: WhenMEngine,
    private llm: UnifiedLLMProvider,
    private options: {
      autoLearn?: boolean;
      debug?: boolean;
      useUnixTime?: boolean;
      enableRefiner?: boolean;
      persistenceType?: 'memory' | 'd1' | 'custom';
      persistenceOptions?: any;  // D1Config or custom PersistencePlugin
      useCompromise?: boolean;
    } = {}
  ) {
    
    this.learner = new DynamicRuleLearner(engine, this.llm);
    this.refiner = new QueryRefinementLayer(this.llm);
    this.ecProcessor = new EventCalculusProcessor(this.llm);
    this.queryParser = new SchemalessQueryParser(this.llm);
    
    // Initialize persistence if configured
    if (this.options.persistenceType) {
      if (this.options.persistenceType === 'd1' && this.options.persistenceOptions) {
        this.persistence = createPersistence({
          type: 'd1',
          d1: this.options.persistenceOptions
        });
      } else if (this.options.persistenceType === 'custom' && this.options.persistenceOptions) {
        this.persistence = createPersistence({
          type: 'custom',
          custom: this.options.persistenceOptions
        });
      } else {
        this.persistence = createPersistence({ type: 'memory' });
      }
    }
  }
  
  async initialize() {
    // Event Calculus基本ルール - Complete implementation
    const baseRules = `
% Event Calculus Rules for WhenM - Generic Version
% No hardcoded verbs - LLM provides semantic decisions

% Core Event Calculus predicates
% happens(EventID, Time) - an event occurs at a specific time
% holds_at(Fluent, Time) - a fluent (state) holds at a specific time  
% initiates(EventID, Fluent) - an event causes a fluent to become true
% terminates(EventID, Fluent) - an event causes a fluent to become false

% A fluent holds if initiated and not terminated
holds_at(Fluent, T) :-
    initiates(EventID, Fluent),
    happens(EventID, T1),
    T1 =< T,
    \\+ clipped(T1, Fluent, T).

% Basic clipping: explicit terminates exists
clipped(T1, Fluent, T2) :-
    terminates(EventID, Fluent),
    happens(EventID, T),
    T1 < T,
    T < T2.

% Exclusive domain clipping: new value clips old value
% No holds_at check needed - "if it was alive, it dies here"
clipped(T1, Fluent1, T2) :-
    Fluent1 =.. [Domain, Subject, OldValue],
    initiates(EventID, Fluent2),
    Fluent2 =.. [Domain, Subject, NewValue],
    happens(EventID, T),
    is_exclusive_domain(Domain),
    OldValue \\= NewValue,
    T1 < T,
    T < T2.

% Exclusive domains are now dynamically registered by events
% is_exclusive_domain/1 facts will be asserted at runtime

% Query helpers
current_state(Subject, Domain, Value) :-
    get_time(Now),
    Fluent =.. [Domain, Subject, Value],
    holds_at(Fluent, Now).

all_current_states(Subject, States) :-
    get_time(Now),
    findall([Domain, Value], (
        Fluent =.. [Domain, Subject, Value],
        holds_at(Fluent, Now)
    ), States).
`;
    
    if (this.engine.loadFacts) {
      try {
        await this.engine.loadFacts(baseRules);
      } catch (error) {
        // Ignore Prolog initialization errors in tests
        if (this.options.debug) {
          console.error('Failed to initialize Prolog rules:', error);
        }
      }
    }
  }
  
  /**
   * 自然言語イベントを記憶（中核機能）
   */
  async remember(text: string, date?: string | Date): Promise<void> {
    const timestamp = this.toTimestamp(date);
    const dateStr = this.toDateString(date);
    
    if (this.options.debug) {
      console.log(`[UnifiedEngine] Processing: "${text}"`);
    }
    
    // Use refiner to translate to English first
    let processedText = text;
    if (this.options.enableRefiner !== false) {
      try {
        const refined = await this.refiner.refine(text);
        processedText = refined.refined || text;
        if (this.options.debug) {
          console.log(`[UnifiedEngine] Refined: "${processedText}" (from ${refined.language})`);
        }
      } catch (error) {
        processedText = text;
      }
    }
    
    // Use Event Calculus processor for semantic analysis
    const ecStructure = await this.ecProcessor.structureForEventCalculus(processedText, dateStr);
    this.ecEvents.push(ecStructure);
    
    // Generate event ID
    const eventId = `evt_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Generate Prolog facts
    const prologFacts = this.ecProcessor.generatePrologFacts(ecStructure, eventId);
    
    // Assert facts into Prolog
    for (const fact of prologFacts) {
      if (this.engine.assertEvent) {
        await this.engine.assertEvent(fact, dateStr);
      }
    }
    
    // Parse for backward compatibility
    const parsed = await this.llm.parseEvent(processedText);
    
    // 複合イベントの処理
    const events = Array.isArray(parsed) ? parsed : [parsed];
    
    for (const event of events) {
      const { subject, verb, object, context } = event;
      
      if (this.options.debug) {
        console.log(`[UnifiedEngine] Event: ${subject} ${verb} ${object || ''}`);
      }
      
      // 動的ルール学習
      if (this.options.autoLearn) {
        await this.learner.learnVerb(verb, text);
      }
      
      // イベント記録
      const eventRecord = {
        event: { subject, verb, object, context },
        text: processedText,
        timestamp,
        date: dateStr
      };
      this._eventLog.push(eventRecord);
      
      // Legacy compatibility - may be removed in future
      if (this.engine.remember) {
        const eventStr = object 
          ? `${subject} ${verb} ${object}`
          : `${subject} ${verb}`;
        await this.engine.remember(eventStr, { timestamp, date: dateStr, ...context });
      }
    }
  }
  
  /**
   * 自然言語で質問
   */
  async ask(question: string, date?: string | Date): Promise<string> {
    if (this.options.debug) {
      console.log(`[UnifiedEngine] Question: "${question}"`);
    }
    
    // Use schemaless query parser for dynamic domain detection
    const parsed = await this.queryParser.parseQueryDynamic(question);
    
    if (this.options.debug) {
      console.log('[UnifiedEngine] Parsed:', parsed);
    }
    
    // Generic Prolog query for ANY domain (truly schemaless)
    if (parsed.temporalScope === 'CURRENT' && parsed.targetDomain && this.engine.query) {
      const subject = (parsed.subject || 'taro').toLowerCase().replace('太郎', 'taro');
      const domain = parsed.targetDomain.toLowerCase();
      
      // Universal query using findall - works for both single and multiple values
      const prologQuery = `findall(Val, current_state("${subject}", ${domain}, Val), Results)`;
      
      try {
        const results = await this.engine.query(prologQuery);
        
        // Handle AsyncGenerator
        let processedResults: any[] = [];
        if (results && typeof results === 'object') {
          if (Symbol.asyncIterator in results) {
            for await (const result of results as AsyncIterable<any>) {
              processedResults.push(result);
            }
          } else if (Array.isArray(results)) {
            processedResults = results;
          }
        }
        
        // Return formatted response if we have results
        if (processedResults.length > 0 && processedResults[0]?.Results) {
          const values = processedResults[0].Results;
          if (values && values.length > 0) {
            // Let LLM format the response naturally
            return await this.queryParser.formatFactAsResponse(
              question,
              domain,
              subject,
              values
            );
          }
        }
      } catch (e) {
        // Prolog error - fall through to LLM
        if (this.options.debug) {
          console.error('[UnifiedEngine] Prolog query error:', e);
        }
      }
    }
    
    // Fallback to LLM for complex queries or when Prolog fails
    const allEvents = this.ecEvents.map(e => ({
      ...e,
      date: e.timestamp
    }));
    
    const response = await this.llm.formatResponse(allEvents, question);
    
    if (this.options.debug) {
      console.log(`[UnifiedEngine] Response: "${response}"`);
    }
    
    return response;
  }
  
  /**
   * Filter results for relevance using LLM
   */
  private async filterRelevantResults(results: any[], question: string): Promise<any[]> {
    const prompt = `Given these events, which are most relevant to answer: "${question}"?
Events: ${JSON.stringify(results)}
Return only the indices of relevant events as JSON array (e.g., [0, 2]):`;
    
    try {
      const response = await this.llm.complete(prompt);
      const indices = JSON.parse(response);
      return indices.map((i: number) => results[i]).filter(Boolean);
    } catch {
      // If filtering fails, return all results
      return results;
    }
  }
  
  /**
   * 構造化クエリ実行 (Prolog-only, truly schemaless)
   */
  private async executeQuery(
    query: any, 
    referenceDate?: string | Date
  ): Promise<any[]> {
    // If engine doesn't support queries, return empty
    if (!this.engine.query) {
      return [];
    }
    
    const { subject, targetDomain } = query;
    
    // Build universal Prolog query for any domain
    let prologQuery = '';
    
    if (targetDomain && subject) {
      // Universal query for ANY domain - works with dynamically created fluents
      const normalizedSubject = (subject || 'taro').toLowerCase();
      prologQuery = `findall(Val, current_state("${normalizedSubject}", ${targetDomain}, Val), Results)`;
    } else if (subject) {
      // Get all current states if no domain specified
      const normalizedSubject = subject.toLowerCase();
      prologQuery = `all_current_states("${normalizedSubject}", States)`;
    }
    
    if (prologQuery) {
      if (this.options.debug) {
        console.log('[UnifiedEngine] Prolog query:', prologQuery);
      }
      
      const results = await this.engine.query(prologQuery);
      
      // Handle AsyncGenerator if returned
      let processedResults: any[] = [];
      if (results && typeof results === 'object') {
        if (Symbol.asyncIterator in results) {
          for await (const result of results as AsyncIterable<any>) {
            processedResults.push(result);
          }
        } else if (Array.isArray(results)) {
          processedResults = results;
        } else if (results.length !== undefined) {
          processedResults = Array.from(results);
        }
      }
      
      if (this.options.debug) {
        console.log('[UnifiedEngine] Prolog results:', processedResults);
      }
      
      return processedResults;
    }
    
    return [];
  }
  
  
  /**
   * タイムスタンプ変換
   */
  private toTimestamp(date?: string | Date): number {
    if (!date) return Date.now();
    if (typeof date === 'string') {
      const parsed = Date.parse(date);
      return isNaN(parsed) ? Date.now() : parsed;
    }
    return date.getTime();
  }
  
  /**
   * 日付文字列変換
   */
  private toDateString(date?: string | Date): string {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }
    return date.toISOString();
  }
  
  /**
   * Get underlying engine
   */
  getEngine(): WhenMEngine {
    return this.engine;
  }
  
  /**
   * Get LLM provider
   */
  getLLM(): UnifiedLLMProvider {
    return this.llm;
  }
  
  /**
   * Get rule learner
   */
  getLearner(): DynamicRuleLearner {
    return this.learner;
  }
  
  /**
   * Natural language interface (delegates to ask)
   */
  async nl(text: string): Promise<string> {
    return this.ask(text);
  }
  
  /**
   * Get all events
   */
  async getEvents(): Promise<any[]> {
    return this._eventLog;
  }

  getEventLog(): any[] {
    return this._eventLog;
  }

  async allEvents(): Promise<any[]> {
    return this._eventLog;
  }
  
  /**
   * Reset engine
   */
  async reset(): Promise<void> {
    this._eventLog = [];
    this.learner.clearRules();
    this.ecEvents = [];
    if (this.engine.reset) {
      await this.engine.reset();
    }
    if (this.persistence) {
      await this.persistence.clear();
    }
  }
  
  /**
   * Persist current state to storage
   */
  async persist(): Promise<void> {
    if (!this.persistence) {
      if (this.options.debug) {
        console.log('[UnifiedEngine] No persistence configured');
      }
      return;
    }
    
    // Save all events from log
    const events = this._eventLog.map(e => ({
      event: typeof e.event === 'string' ? e.event : JSON.stringify(e.event),
      time: e.date,
      metadata: { timestamp: e.timestamp }
    }));
    
    await this.persistence.saveBatch(events);
    
    if (this.options.debug) {
      console.log(`[UnifiedEngine] Persisted ${events.length} events`);
    }
  }
  
  /**
   * Restore state from storage
   */
  async restore(query?: any): Promise<void> {
    if (!this.persistence) {
      if (this.options.debug) {
        console.log('[UnifiedEngine] No persistence configured');
      }
      return;
    }
    
    // Load events from persistence
    const events = await this.persistence.load(query);
    
    if (this.options.debug) {
      console.log(`[UnifiedEngine] Restoring ${events.length} events`);
    }
    
    // Replay events
    for (const event of events) {
      // Parse event if it's a string representation
      let parsedEvent = event.event;
      if (typeof parsedEvent === 'string' && parsedEvent.startsWith('{')) {
        try {
          parsedEvent = JSON.parse(parsedEvent);
        } catch {
          // Keep as string if not JSON
        }
      }
      
      // Re-process through remember
      await this.remember(parsedEvent, event.time);
    }
  }
  
  /**
   * Get persistence statistics
   */
  async getPersistenceStats(): Promise<any> {
    if (!this.persistence) {
      return { enabled: false };
    }
    
    const stats = await this.persistence.stats();
    return {
      enabled: true,
      ...stats
    };
  }
  
  /**
   * Export to Prolog format
   */
  async exportProlog(query?: any): Promise<string> {
    if (this.persistence) {
      return this.persistence.exportProlog(query);
    }
    
    // Export from memory
    return this._eventLog
      .map(e => `happens(${JSON.stringify(e.event)}, "${e.date}").`)
      .join('\n');
  }
  
  /**
   * Import from Prolog format
   */
  async importProlog(facts: string): Promise<void> {
    if (this.persistence) {
      await this.persistence.importProlog(facts);
      // Restore to memory after import
      await this.restore();
    } else {
      // Parse and add to memory directly
      const factRegex = /happens\(([^)]+)\),\s*"([^"]+)"\)/g;
      let match;
      
      while ((match = factRegex.exec(facts)) !== null) {
        await this.remember(match[1], match[2]);
      }
    }
  }
}