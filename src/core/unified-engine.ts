/**
 * Unified Schemaless Engine for WhenM
 *
 * Core engine that combines Prolog reasoning with LLM capabilities
 */

import type { WhenMEngine } from '../index.js';
import type { UnifiedLLMProvider } from '../providers/llm-provider.js';
import { DynamicRuleLearner } from '../processors/rule-learner.js';
import { QueryRefinementLayer } from '../processors/query-refiner.js';
import { createPersistence, type PersistencePlugin } from '../persistence/index.js';
import { EventCalculusProcessor, type EventCalculusStructure } from '../processors/event-calculus-processor.js';
import { SchemalessQueryParser } from '../processors/schemaless-query-parser.js';
import {
  persistEvents,
  restoreEvents,
  getPersistenceStats,
  exportProlog,
  importProlog,
  type EventLogEntry
} from './unified-engine-persistence.js';
import { processQueryResults } from './unified-engine-query.js';

interface EngineOptions {
  autoLearn?: boolean;
  debug?: boolean;
  useUnixTime?: boolean;
  enableRefiner?: boolean;
  persistenceType?: 'memory' | 'd1' | 'custom';
  persistenceOptions?: unknown;
  useCompromise?: boolean;
}

/**
 * Unified Schemaless Engine
 */
export class UnifiedSchemalessEngine {
  private learner: DynamicRuleLearner;
  private refiner: QueryRefinementLayer;
  private persistence?: PersistencePlugin;
  public _eventLog: EventLogEntry[] = [];
  private ecProcessor: EventCalculusProcessor;
  private ecEvents: EventCalculusStructure[] = [];
  private queryParser: SchemalessQueryParser;

  constructor(
    private engine: WhenMEngine,
    private llm: UnifiedLLMProvider,
    private options: EngineOptions = {}
  ) {
    this.learner = new DynamicRuleLearner(engine, this.llm);
    this.refiner = new QueryRefinementLayer(this.llm);
    this.ecProcessor = new EventCalculusProcessor(this.llm);
    this.queryParser = new SchemalessQueryParser(this.llm);

    if (this.options.persistenceType) {
      this.persistence = this.initPersistence();
    }
  }

  private initPersistence(): PersistencePlugin {
    const { persistenceType, persistenceOptions } = this.options;
    if (persistenceType === 'd1' && persistenceOptions) {
      return createPersistence({ type: 'd1', d1: persistenceOptions as Parameters<typeof createPersistence>[0] extends { d1?: infer T } ? T : never });
    }
    if (persistenceType === 'custom' && persistenceOptions) {
      return createPersistence({ type: 'custom', custom: persistenceOptions as PersistencePlugin });
    }
    return createPersistence({ type: 'memory' });
  }

  async initialize(): Promise<void> {
    if (!this.engine.loadFacts) return;
    const rules = [
      'holds_at(Fluent, T) :- initiates(EventID, Fluent), happens(EventID, T1), T1 =< T, \\+ clipped(T1, Fluent, T).',
      'clipped(T1, Fluent, T2) :- terminates(EventID, Fluent), happens(EventID, T), T1 < T, T < T2.',
      'clipped(T1, Fluent1, T2) :- Fluent1 =.. [Domain, Subject, OldValue], initiates(EventID, Fluent2), Fluent2 =.. [Domain, Subject, NewValue], happens(EventID, T), is_exclusive_domain(Domain), OldValue \\= NewValue, T1 < T, T < T2.',
      'current_state(Subject, Domain, Value) :- get_time(Now), Fluent =.. [Domain, Subject, Value], holds_at(Fluent, Now).',
      'all_current_states(Subject, States) :- get_time(Now), findall([Domain, Value], (Fluent =.. [Domain, Subject, Value], holds_at(Fluent, Now)), States).'
    ].join('\n');
    try { await this.engine.loadFacts(rules); } catch { /* Prolog init error */ }
  }

  /**
   * Remember natural language events (core function)
   */
  async remember(text: string, date?: string | Date): Promise<void> {
    const timestamp = this.toTimestamp(date);
    const dateStr = this.toDateString(date);

    const processedText = await this.refineText(text);
    const ecStructure = await this.ecProcessor.structureForEventCalculus(processedText, dateStr);
    this.ecEvents.push(ecStructure);

    const eventId = `evt_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;
    const prologFacts = this.ecProcessor.generatePrologFacts(ecStructure, eventId);

    for (const fact of prologFacts) {
      if (this.engine.assertEvent) {
        await this.engine.assertEvent(fact, dateStr);
      }
    }

    const parsed = await this.llm.parseEvent(processedText);
    const events = Array.isArray(parsed) ? parsed : [parsed];

    for (const event of events) {
      const { subject, verb, object, context } = event;

      if (this.options.autoLearn) {
        await this.learner.learnVerb(verb, text);
      }

      this._eventLog.push({
        event: { subject, verb, object, context },
        text: processedText,
        timestamp,
        date: dateStr
      });

      if (this.engine.remember) {
        const eventStr = object ? `${subject} ${verb} ${object}` : `${subject} ${verb}`;
        await this.engine.remember(eventStr, { timestamp, date: dateStr, ...context });
      }
    }
  }

  private async refineText(text: string): Promise<string> {
    if (this.options.enableRefiner === false) {
      return text;
    }
    try {
      const refined = await this.refiner.refine(text);
      return refined.refined || text;
    } catch {
      return text;
    }
  }

  /**
   * Ask questions in natural language
   */
  async ask(question: string, _date?: string | Date): Promise<string> {
    const parsed = await this.queryParser.parseQueryDynamic(question);

    const prologResult = await this.tryPrologQuery(parsed, question);
    if (prologResult !== null) {
      return prologResult;
    }

    const allEvents = this.ecEvents.map(e => ({ ...e, date: e.timestamp }));
    return this.llm.formatResponse(allEvents, question);
  }

  private async tryPrologQuery(
    parsed: { temporalScope: string; targetDomain?: string; subject?: string },
    question: string
  ): Promise<string | null> {
    if (parsed.temporalScope !== 'CURRENT' || !parsed.targetDomain || !parsed.subject) {
      return null;
    }
    if (!this.engine.query) {
      return null;
    }

    const subject = parsed.subject.toLowerCase();
    const domain = parsed.targetDomain.toLowerCase();
    const prologQuery = `findall(Val, current_state("${subject}", ${domain}, Val), Results)`;

    try {
      const results = await this.engine.query(prologQuery);
      const processedResults = await processQueryResults(results);

      if (processedResults.length > 0) {
        const first = processedResults[0] as { Results?: string[] };
        if (first?.Results && first.Results.length > 0) {
          return this.queryParser.formatFactAsResponse(question, domain, subject, first.Results);
        }
      }
    } catch {
      // Prolog error - fall through to LLM
    }
    return null;
  }

  private toTimestamp(date?: string | Date): number {
    if (!date) return Date.now();
    if (typeof date === 'string') {
      const parsed = Date.parse(date);
      return isNaN(parsed) ? Date.now() : parsed;
    }
    return date.getTime();
  }

  private toDateString(date?: string | Date): string {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }
    return date.toISOString();
  }

  getEngine(): WhenMEngine {
    return this.engine;
  }

  getLLM(): UnifiedLLMProvider {
    return this.llm;
  }

  getLearner(): DynamicRuleLearner {
    return this.learner;
  }

  async nl(text: string): Promise<string> {
    return this.ask(text);
  }

  async getEvents(): Promise<unknown[]> {
    return this._eventLog;
  }

  getEventLog(): unknown[] {
    return this._eventLog;
  }

  async allEvents(): Promise<unknown[]> {
    return this._eventLog;
  }

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

  async persist(): Promise<void> {
    await persistEvents(this.persistence, this._eventLog, this.options);
  }

  async restore(query?: unknown): Promise<void> {
    await restoreEvents(
      this.persistence,
      query,
      (text, date) => this.remember(text, date),
      this.options
    );
  }

  async getPersistenceStats(): Promise<Record<string, unknown>> {
    return getPersistenceStats(this.persistence);
  }

  async exportProlog(query?: unknown): Promise<string> {
    return exportProlog(this.persistence, this._eventLog, query);
  }

  async importProlog(facts: string): Promise<void> {
    return importProlog(
      this.persistence,
      facts,
      () => this.restore(),
      (text, date) => this.remember(text, date)
    );
  }
}
