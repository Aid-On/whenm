/**
 * Sliding Window implementation for efficient temporal memory management
 * 
 * Handles millions of events by only loading relevant time windows
 * into Prolog working memory
 */

import type { WhenMEngine } from './index.js';
import { PrologParser } from './prolog-parser.js';
import { getFluentForVerb } from './schema.js';

export interface WindowConfig {
  /** Maximum events to keep in memory at once */
  maxEvents?: number;
  
  /** Time window to keep active (e.g., 30 days) */
  windowDays?: number;
  
  /** Entities to prioritize in the window */
  focusEntities?: string[];
  
  /** Archive strategy */
  archive?: {
    type: 'memory' | 'd1' | 'kv';
    config?: any;
  };
}

export interface EventArchive {
  event: string;
  time: string;
  entities: string[];
  fluents: string[];
}

export class SlidingWindow {
  private windowConfig: Required<WindowConfig>;
  private eventArchive: EventArchive[] = [];
  private activeEvents: Set<string> = new Set();
  private entityIndex: Map<string, EventArchive[]> = new Map();
  private fluentIndex: Map<string, EventArchive[]> = new Map();
  
  constructor(
    private engine: WhenMEngine,
    config: WindowConfig = {}
  ) {
    this.windowConfig = {
      maxEvents: config.maxEvents ?? 10000,
      windowDays: config.windowDays ?? 30,
      focusEntities: config.focusEntities ?? [],
      archive: config.archive ?? { type: 'memory' }
    };
  }
  
  /**
   * Archive an event for future retrieval
   */
  async archiveEvent(event: string, time: string): Promise<void> {
    // Extract entities and fluents from event
    const entities = this.extractEntities(event);
    const fluents = this.extractFluents(event);
    
    const archived: EventArchive = {
      event,
      time,
      entities,
      fluents
    };
    
    // Add to in-memory archive
    this.eventArchive.push(archived);
    
    // Update indices
    for (const entity of entities) {
      if (!this.entityIndex.has(entity)) {
        this.entityIndex.set(entity, []);
      }
      this.entityIndex.get(entity)!.push(archived);
    }
    
    for (const fluent of fluents) {
      if (!this.fluentIndex.has(fluent)) {
        this.fluentIndex.set(fluent, []);
      }
      this.fluentIndex.get(fluent)!.push(archived);
    }
    
    // Check if we need to evict old events
    if (this.eventArchive.length > this.windowConfig.maxEvents) {
      await this.evictOldEvents();
    }
  }
  
  /**
   * Load relevant events for a query
   */
  async loadRelevantEvents(
    queryDate: string,
    entities?: string[],
    timeRange?: { from: string; to: string }
  ): Promise<void> {
    // Clear current active events
    await this.clearActiveEvents();
    
    // Determine time window
    const windowStart = timeRange?.from ?? this.calculateWindowStart(queryDate);
    const windowEnd = timeRange?.to ?? queryDate;
    
    // Collect relevant events
    const relevantEvents: EventArchive[] = [];
    
    if (entities && entities.length > 0) {
      // Load events for specific entities
      for (const entity of entities) {
        const entityEvents = this.entityIndex.get(entity) ?? [];
        relevantEvents.push(
          ...entityEvents.filter(e => 
            e.time >= windowStart && e.time <= windowEnd
          )
        );
      }
    } else {
      // Load all events in time window
      relevantEvents.push(
        ...this.eventArchive.filter(e => 
          e.time >= windowStart && e.time <= windowEnd
        )
      );
    }
    
    // Sort by time and limit to maxEvents
    relevantEvents.sort((a, b) => a.time.localeCompare(b.time));
    const eventsToLoad = relevantEvents.slice(0, this.windowConfig.maxEvents);
    
    // Load into Prolog
    const facts: string[] = [];
    for (const event of eventsToLoad) {
      facts.push(`happens(${event.event}, "${event.time}").`);
      this.activeEvents.add(`${event.event}@${event.time}`);
    }
    
    if (facts.length > 0) {
      await this.engine.loadFacts(facts.join('\n'));
    }
  }
  
  /**
   * Get statistics about the window
   */
  getStats(): {
    totalArchived: number;
    activeEvents: number;
    entities: number;
    fluents: number;
    oldestEvent?: string;
    newestEvent?: string;
  } {
    return {
      totalArchived: this.eventArchive.length,
      activeEvents: this.activeEvents.size,
      entities: this.entityIndex.size,
      fluents: this.fluentIndex.size,
      oldestEvent: this.eventArchive[0]?.time,
      newestEvent: this.eventArchive[this.eventArchive.length - 1]?.time
    };
  }
  
  /**
   * Search archived events without loading them all
   */
  async searchArchive(
    query: {
      entities?: string[];
      fluents?: string[];
      timeRange?: { from: string; to: string };
      pattern?: string;
    }
  ): Promise<EventArchive[]> {
    let results = [...this.eventArchive];
    
    // Filter by entities
    if (query.entities && query.entities.length > 0) {
      const entitySet = new Set(query.entities);
      results = results.filter(e => 
        e.entities.some(ent => entitySet.has(ent))
      );
    }
    
    // Filter by fluents
    if (query.fluents && query.fluents.length > 0) {
      const fluentSet = new Set(query.fluents);
      results = results.filter(e => 
        e.fluents.some(f => fluentSet.has(f))
      );
    }
    
    // Filter by time range
    if (query.timeRange) {
      results = results.filter(e => 
        e.time >= query.timeRange!.from && 
        e.time <= query.timeRange!.to
      );
    }
    
    // Filter by pattern
    if (query.pattern) {
      const regex = new RegExp(query.pattern, 'i');
      results = results.filter(e => regex.test(e.event));
    }
    
    return results;
  }
  
  // Private helper methods
  
  private extractEntities(event: string): string[] {
    const entities: string[] = [];
    
    // Match patterns like: verb(entity) or verb(entity1, entity2)
    const match = event.match(/^\w+\(([^)]+)\)/);
    if (match) {
      const args = match[1].split(',').map(a => a.trim().replace(/['"]/g, ''));
      // First arg is usually the subject/entity
      if (args[0]) entities.push(args[0]);
      // Sometimes second arg is also an entity (e.g., employs(company, alice))
      if (args[1] && !args[1].includes(' ')) {
        entities.push(args[1]);
      }
    }
    
    return entities;
  }
  
  private extractFluents(event: string): string[] {
    const fluents: string[] = [];
    
    // The verb itself often becomes a fluent
    const verbMatch = event.match(/^(\w+)\(/);
    if (verbMatch) {
      const verb = verbMatch[1];
      
      // Use central schema for verb-to-fluent mapping
      const fluent = getFluentForVerb(verb) || verb;
      fluents.push(fluent);
    }
    
    return fluents;
  }
  
  private calculateWindowStart(queryDate: string): string {
    const date = new Date(queryDate);
    date.setDate(date.getDate() - this.windowConfig.windowDays);
    return date.toISOString().split('T')[0];
  }
  
  private async clearActiveEvents(): Promise<void> {
    // In production, we'd retract facts from Prolog
    // For now, we track what's active
    this.activeEvents.clear();
  }
  
  private async evictOldEvents(): Promise<void> {
    const cutoffSize = Math.floor(this.windowConfig.maxEvents * 0.8);
    
    if (this.windowConfig.archive.type === 'd1') {
      // TODO: Implement D1 persistence
      console.log('D1 archiving not yet implemented');
    } else if (this.windowConfig.archive.type === 'kv') {
      // TODO: Implement KV persistence
      console.log('KV archiving not yet implemented');
    }
    
    // Keep only recent events in memory
    this.eventArchive = this.eventArchive.slice(-cutoffSize);
    
    // Rebuild indices
    this.rebuildIndices();
  }
  
  private rebuildIndices(): void {
    this.entityIndex.clear();
    this.fluentIndex.clear();
    
    for (const archived of this.eventArchive) {
      for (const entity of archived.entities) {
        if (!this.entityIndex.has(entity)) {
          this.entityIndex.set(entity, []);
        }
        this.entityIndex.get(entity)!.push(archived);
      }
      
      for (const fluent of archived.fluents) {
        if (!this.fluentIndex.has(fluent)) {
          this.fluentIndex.set(fluent, []);
        }
        this.fluentIndex.get(fluent)!.push(archived);
      }
    }
  }
}

/**
 * Create a window-managed WhenM instance
 */
export async function createWindowedEngine(
  baseEngine: WhenMEngine,
  config?: WindowConfig
): Promise<{
  engine: WhenMEngine;
  window: SlidingWindow;
}> {
  const window = new SlidingWindow(baseEngine, config);
  
  // Wrap the engine to intercept events
  const wrappedEngine: WhenMEngine = {
    ...baseEngine,
    
    // Wrap assertEvent to archive events
    assertEvent: async (event: string, time: string, metadata?: any) => {
      await window.archiveEvent(event, time);
      return baseEngine.assertEvent(event, time, metadata);
    },
    
    // Wrap assertEvents to archive events
    assertEvents: async (events: Array<{ event: string; time: string; metadata?: any }>) => {
      for (const { event, time } of events) {
        await window.archiveEvent(event, time);
      }
      return baseEngine.assertEvents(events);
    },
    
    // Wrap retractEvent (no need to remove from archive as it's historical)
    retractEvent: async (event: string, time: string) => {
      return baseEngine.retractEvent(event, time);
    },
    
    // Override loadFacts to archive events
    loadFacts: async (facts: string) => {
      const lines = facts.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        // Extract happens/2 facts
        const match = line.match(/happens\(([^,]+),\s*"([^"]+)"\)/);
        if (match) {
          await window.archiveEvent(match[1], match[2]);
        }
      }
      
      // Load into base engine
      return baseEngine.loadFacts(facts);
    },
    
    // Override query to load relevant events first
    query: async (q: string) => {
      // Extract entities from query
      const entities = extractQueryEntities(q);
      
      // Load relevant events
      await window.loadRelevantEvents(
        new Date().toISOString().split('T')[0],
        entities
      );
      
      // Run query
      return baseEngine.query(q);
    }
  };
  
  return { engine: wrappedEngine, window };
}

function extractQueryEntities(query: string): string[] {
  const entities: string[] = [];
  const parser = new PrologParser();
  
  // Try to parse as Prolog query to extract entities properly
  try {
    // Extract quoted strings (these are often entity names in queries)
    const quotedMatches = query.match(/"([^"]+)"/g);
    if (quotedMatches) {
      entities.push(...quotedMatches.map(m => m.replace(/"/g, '')));
    }
    
    // Extract atoms from Prolog predicates
    // Match patterns like: predicate(Entity, ...) or predicate("entity", ...)
    const predicateMatches = query.matchAll(/\b\w+\s*\(([^)]+)\)/g);
    for (const match of predicateMatches) {
      const args = match[1].split(',').map(arg => arg.trim());
      for (const arg of args) {
        // If it's a variable (starts with uppercase), skip
        if (/^[A-Z]/.test(arg)) continue;
        
        // If it's quoted, extract the content
        if (arg.startsWith('"') && arg.endsWith('"')) {
          entities.push(arg.slice(1, -1));
        }
        // If it's an unquoted atom (lowercase start), it might be an entity
        else if (/^[a-z]\w*$/.test(arg)) {
          entities.push(arg);
        }
      }
    }
  } catch (e) {
    // Fallback: just extract any quoted strings and lowercase atoms
    console.warn('Failed to parse query for entities, using fallback:', e);
  }
  
  return [...new Set(entities)];
}