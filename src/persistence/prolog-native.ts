/**
 * Prolog-Native Persistence Plugin
 *
 * Preserves Prolog term structure during persistence
 */

import type { PersistencePlugin, PersistedEvent, PersistenceQuery, PersistenceStats } from './types.js';
import { parsePrologTerm, termToString, type PrologTerm } from './prolog-term-parser.js';

/**
 * Enhanced event with Prolog structure
 */
interface PrologEvent extends PersistedEvent {
  term?: PrologTerm | string;
  predicate?: string;
}

export class PrologNativePersistence implements PersistencePlugin {
  readonly type = 'prolog-native';
  private facts: PrologEvent[] = [];
  private indices = {
    byTime: new Map<string, PrologEvent[]>(),
    byPredicate: new Map<string, PrologEvent[]>(),
    byFunctor: new Map<string, PrologEvent[]>()
  };

  async save(event: PersistedEvent): Promise<void> {
    const prologEvent = this.enhanceEvent(event);

    const existing = this.facts.findIndex(
      f => f.event === prologEvent.event && f.time === prologEvent.time
    );

    if (existing >= 0) {
      this.facts[existing] = prologEvent;
    } else {
      this.facts.push(prologEvent);
      this.updateIndices(prologEvent);
    }
  }

  private enhanceEvent(event: PersistedEvent): PrologEvent {
    const enhanced: PrologEvent = { ...event };

    if (typeof event.event === 'string') {
      enhanced.term = parsePrologTerm(event.event);

      if (typeof enhanced.term === 'object' && 'functor' in enhanced.term) {
        enhanced.predicate = enhanced.term.functor;
      }
    }

    return enhanced;
  }

  private updateIndices(event: PrologEvent): void {
    this.addToIndex(this.indices.byTime, event.time, event);

    if (event.predicate) {
      this.addToIndex(this.indices.byPredicate, event.predicate, event);
    }

    if (event.term && typeof event.term === 'object' && 'functor' in event.term) {
      this.addToIndex(this.indices.byFunctor, event.term.functor, event);
    }
  }

  private addToIndex(index: Map<string, PrologEvent[]>, key: string, event: PrologEvent): void {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(event);
  }

  async saveBatch(events: PersistedEvent[]): Promise<void> {
    for (const event of events) {
      await this.save(event);
    }
  }

  async load(query?: PersistenceQuery): Promise<PersistedEvent[]> {
    if (!query) {
      return [...this.facts];
    }

    let results = [...this.facts];
    results = this.applyTimeFilter(results, query);
    results = this.applyPatternFilter(results, query);

    if (query.filter) {
      results = results.filter(query.filter);
    }
    if (query.offset) {
      results = results.slice(query.offset);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  private applyTimeFilter(results: PrologEvent[], query: PersistenceQuery): PrologEvent[] {
    if (!query.timeRange) return results;

    return results.filter(e => {
      const afterFrom = !query.timeRange!.from || e.time >= String(query.timeRange!.from);
      const beforeTo = !query.timeRange!.to || e.time <= String(query.timeRange!.to);
      return afterFrom && beforeTo;
    });
  }

  private applyPatternFilter(results: PrologEvent[], query: PersistenceQuery): PrologEvent[] {
    if (!query.pattern) return results;

    const byPredicate = this.indices.byPredicate.get(query.pattern) || [];
    const byFunctor = this.indices.byFunctor.get(query.pattern) || [];
    const patternMatches = new Set([...byPredicate, ...byFunctor]);

    if (patternMatches.size > 0) {
      return results.filter(e => patternMatches.has(e));
    }

    return results.filter(e =>
      e.event.toLowerCase().includes(query.pattern!.toLowerCase())
    );
  }

  async delete(query: PersistenceQuery): Promise<number> {
    const toDelete = await this.load(query);
    const deleteSet = new Set(toDelete);

    const beforeCount = this.facts.length;
    this.facts = this.facts.filter(f => !deleteSet.has(f));

    this.rebuildIndices();

    return beforeCount - this.facts.length;
  }

  private rebuildIndices(): void {
    this.indices.byTime.clear();
    this.indices.byPredicate.clear();
    this.indices.byFunctor.clear();

    for (const fact of this.facts) {
      this.updateIndices(fact);
    }
  }

  async clear(): Promise<void> {
    this.facts = [];
    this.indices.byTime.clear();
    this.indices.byPredicate.clear();
    this.indices.byFunctor.clear();
  }

  async stats(): Promise<PersistenceStats> {
    const predicates = new Set<string>();
    const functors = new Set<string>();

    for (const fact of this.facts) {
      if (fact.predicate) predicates.add(fact.predicate);
      if (fact.term && typeof fact.term === 'object' && 'functor' in fact.term) {
        functors.add(fact.term.functor);
      }
    }

    return {
      totalEvents: this.facts.length,
      oldestEvent: this.facts[0]?.time,
      newestEvent: this.facts[this.facts.length - 1]?.time,
      storageType: 'prolog-native',
      metadata: {
        uniquePredicates: predicates.size,
        uniqueFunctors: functors.size,
        timePoints: this.indices.byTime.size
      }
    };
  }

  async exportProlog(query?: PersistenceQuery): Promise<string> {
    const events = await this.load(query) as PrologEvent[];
    const grouped = new Map<string, string[]>();

    for (const event of events) {
      const predicate = event.predicate || 'happens';
      if (!grouped.has(predicate)) {
        grouped.set(predicate, []);
      }

      const term = event.term ? termToString(event.term) : event.event;
      grouped.get(predicate)!.push(`${predicate}(${term}, "${event.time}").`);
    }

    let output = '';
    for (const [predicate, facts] of grouped) {
      output += `% ${predicate} facts\n`;
      output += facts.join('\n');
      output += '\n\n';
    }

    return output.trim();
  }

  async importProlog(facts: string): Promise<void> {
    const lines = facts.split('\n').filter(line =>
      line.trim() && !line.trim().startsWith('%')
    );

    for (const line of lines) {
      const match = line.match(/^([a-z_][a-zA-Z0-9_]*)\((.+),\s*"([^"]+)"\)\s*\.$/);
      if (match) {
        const [, , termStr, time] = match;
        await this.save({ event: termStr, time, metadata: { predicate: match[1] } });
      }
    }
  }

  /**
   * Query using Prolog-style patterns
   */
  async queryProlog(pattern: string): Promise<PrologEvent[]> {
    const match = pattern.match(/^([a-z_][a-zA-Z0-9_]*)\((.+)\)$/);
    if (!match) {
      return [];
    }

    const [, predicate] = match;
    const candidates = this.indices.byPredicate.get(predicate) || [];

    return candidates.filter(() => {
      return true; // Simplified - real implementation would need unification
    });
  }
}

/**
 * Factory function
 */
export function createPrologNativePersistence(): PersistencePlugin {
  return new PrologNativePersistence();
}
