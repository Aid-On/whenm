/**
 * Prolog-Native Persistence Plugin
 * 
 * Preserves Prolog term structure during persistence
 */

import type { PersistencePlugin, PersistedEvent, PersistenceQuery, PersistenceStats } from './types.js';

/**
 * Prolog term representation
 */
interface PrologTerm {
  functor: string;
  args: Array<string | number | PrologTerm>;
}

/**
 * Parse Prolog term string into structured format
 */
function parsePrologTerm(term: string): PrologTerm | string {
  term = term.trim();
  
  // Simple atom
  if (!term.includes('(')) {
    return term;
  }
  
  // Compound term
  const match = term.match(/^([a-z_][a-zA-Z0-9_]*)\((.*)\)$/);
  if (!match) {
    return term; // Fallback to string
  }
  
  const [, functor, argsStr] = match;
  const args: Array<string | number | PrologTerm> = [];
  
  // Simple argument parsing (needs improvement for nested terms)
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    
    if (char === '(' ) depth++;
    else if (char === ')') depth--;
    
    if (char === ',' && depth === 0) {
      args.push(parseSingleArg(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) {
    args.push(parseSingleArg(current.trim()));
  }
  
  return { functor, args };
}

function parseSingleArg(arg: string): string | number | PrologTerm {
  // Number
  if (/^-?\d+(\.\d+)?$/.test(arg)) {
    return parseFloat(arg);
  }
  
  // Quoted string
  if (arg.startsWith('"') && arg.endsWith('"')) {
    return arg.slice(1, -1);
  }
  
  // Nested term
  if (arg.includes('(')) {
    return parsePrologTerm(arg);
  }
  
  // Atom
  return arg;
}

/**
 * Convert structured term back to Prolog string
 */
function termToString(term: PrologTerm | string | number): string {
  if (typeof term === 'string') {
    return /^[a-z][a-zA-Z0-9_]*$/.test(term) ? term : `"${term}"`;
  }
  
  if (typeof term === 'number') {
    return term.toString();
  }
  
  if (typeof term === 'object' && 'functor' in term) {
    const args = term.args.map(arg => termToString(arg)).join(', ');
    return `${term.functor}(${args})`;
  }
  
  return String(term);
}

/**
 * Enhanced event with Prolog structure
 */
interface PrologEvent extends PersistedEvent {
  term?: PrologTerm | string;  // Structured representation
  predicate?: string;           // Main predicate (happens, initiates, etc.)
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
    
    // Check for duplicates
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
    
    // Parse the event structure
    if (typeof event.event === 'string') {
      // Parse as Prolog term
      enhanced.term = parsePrologTerm(event.event);
      
      // Extract functor for indexing
      if (typeof enhanced.term === 'object' && 'functor' in enhanced.term) {
        enhanced.predicate = enhanced.term.functor;
      }
    }
    
    return enhanced;
  }
  
  private updateIndices(event: PrologEvent): void {
    // Index by time
    if (!this.indices.byTime.has(event.time)) {
      this.indices.byTime.set(event.time, []);
    }
    this.indices.byTime.get(event.time)!.push(event);
    
    // Index by predicate
    if (event.predicate) {
      if (!this.indices.byPredicate.has(event.predicate)) {
        this.indices.byPredicate.set(event.predicate, []);
      }
      this.indices.byPredicate.get(event.predicate)!.push(event);
    }
    
    // Index by functor (if compound term)
    if (event.term && typeof event.term === 'object' && 'functor' in event.term) {
      const functor = event.term.functor;
      if (!this.indices.byFunctor.has(functor)) {
        this.indices.byFunctor.set(functor, []);
      }
      this.indices.byFunctor.get(functor)!.push(event);
    }
  }
  
  async saveBatch(events: PersistedEvent[]): Promise<void> {
    for (const event of events) {
      await this.save(event);
    }
  }
  
  async load(query?: PersistenceQuery): Promise<PersistedEvent[]> {
    let results = [...this.facts];
    
    if (query) {
      // Use indices for efficient filtering
      if (query.timeRange) {
        results = results.filter(e => {
          const inRange = (!query.timeRange!.from || e.time >= String(query.timeRange!.from)) &&
                         (!query.timeRange!.to || e.time <= String(query.timeRange!.to));
          return inRange;
        });
      }
      
      if (query.pattern) {
        // Pattern can be a predicate name or functor
        const byPredicate = this.indices.byPredicate.get(query.pattern) || [];
        const byFunctor = this.indices.byFunctor.get(query.pattern) || [];
        const patternMatches = new Set([...byPredicate, ...byFunctor]);
        
        if (patternMatches.size > 0) {
          results = results.filter(e => patternMatches.has(e as PrologEvent));
        } else {
          // Fallback to string matching
          results = results.filter(e => 
            e.event.toLowerCase().includes(query.pattern!.toLowerCase())
          );
        }
      }
      
      if (query.filter) {
        results = results.filter(query.filter);
      }
      
      if (query.offset) {
        results = results.slice(query.offset);
      }
      
      if (query.limit) {
        results = results.slice(0, query.limit);
      }
    }
    
    return results;
  }
  
  async delete(query: PersistenceQuery): Promise<number> {
    const toDelete = await this.load(query);
    const deleteSet = new Set(toDelete);
    
    const beforeCount = this.facts.length;
    this.facts = this.facts.filter(f => !deleteSet.has(f));
    
    // Rebuild indices
    this.rebuildIndices();
    
    return beforeCount - this.facts.length;
  }
  
  private rebuildIndices(): void {
    this.indices.byTime.clear();
    this.indices.byPredicate.clear();
    this.indices.byFunctor.clear();
    
    for (const fact of this.facts) {
      this.updateIndices(fact as PrologEvent);
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
    
    for (const fact of this.facts as PrologEvent[]) {
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
    const events = await this.load(query);
    
    // Group by predicate for better organization
    const grouped = new Map<string, string[]>();
    
    for (const event of events as PrologEvent[]) {
      const predicate = event.predicate || 'happens';
      if (!grouped.has(predicate)) {
        grouped.set(predicate, []);
      }
      
      // Properly format as Prolog fact
      const term = event.term ? termToString(event.term) : event.event;
      grouped.get(predicate)!.push(`${predicate}(${term}, "${event.time}").`);
    }
    
    // Output organized by predicate
    let output = '';
    for (const [predicate, facts] of grouped) {
      output += `% ${predicate} facts\n`;
      output += facts.join('\n');
      output += '\n\n';
    }
    
    return output.trim();
  }
  
  async importProlog(facts: string): Promise<void> {
    // Parse each line as a Prolog fact
    const lines = facts.split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('%')
    );
    
    for (const line of lines) {
      // Match: predicate(term, "time").
      const match = line.match(/^([a-z_][a-zA-Z0-9_]*)\((.+),\s*"([^"]+)"\)\s*\.$/);
      if (match) {
        const [, predicate, termStr, time] = match;
        
        await this.save({
          event: termStr,
          time,
          metadata: { predicate }
        });
      }
    }
  }
  
  /**
   * Query using Prolog-style patterns
   */
  async queryProlog(pattern: string): Promise<PrologEvent[]> {
    // Parse pattern like "happens(joined(alice, _), T)"
    const match = pattern.match(/^([a-z_][a-zA-Z0-9_]*)\((.+)\)$/);
    if (!match) {
      return [];
    }
    
    const [, predicate, args] = match;
    
    // Use indices for efficient lookup
    let candidates = this.indices.byPredicate.get(predicate) || [];
    
    // Further filter by pattern matching
    // This is simplified - real implementation would need unification
    return candidates.filter(event => {
      // Pattern matching logic here
      return true; // Simplified
    });
  }
}

/**
 * Factory function
 */
export function createPrologNativePersistence(): PersistencePlugin {
  return new PrologNativePersistence();
}