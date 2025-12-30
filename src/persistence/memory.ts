/**
 * In-Memory Persistence Plugin
 * 
 * Default persistence implementation using memory storage
 * Fast but ephemeral - data is lost on restart
 */

import type { 
  PersistencePlugin, 
  PersistedEvent, 
  PersistenceQuery, 
  PersistenceStats 
} from './types.js';

export class MemoryPersistence implements PersistencePlugin {
  readonly type = 'memory';
  private events: PersistedEvent[] = [];
  private nextId = 1;
  
  async save(event: PersistedEvent): Promise<void> {
    // Assign ID if not present
    if (!event.id) {
      event.id = `mem_${this.nextId++}`;
    }
    
    // Check for duplicates
    const existingIndex = this.events.findIndex(
      e => e.event === event.event && e.time === event.time
    );
    
    if (existingIndex >= 0) {
      // Update existing event
      this.events[existingIndex] = event;
    } else {
      // Add new event
      this.events.push(event);
    }
    
    // Keep events sorted by time
    this.events.sort((a, b) => a.time.localeCompare(b.time));
  }
  
  async saveBatch(events: PersistedEvent[]): Promise<void> {
    for (const event of events) {
      await this.save(event);
    }
  }
  
  async load(query?: PersistenceQuery): Promise<PersistedEvent[]> {
    let results = [...this.events];
    
    if (query) {
      // Apply time range filter
      if (query.timeRange) {
        const from = query.timeRange.from 
          ? (typeof query.timeRange.from === 'string' 
              ? query.timeRange.from 
              : query.timeRange.from.toISOString())
          : '';
        const to = query.timeRange.to
          ? (typeof query.timeRange.to === 'string'
              ? query.timeRange.to
              : query.timeRange.to.toISOString())
          : '9999-12-31';
        
        results = results.filter(e => e.time >= from && e.time <= to);
      }
      
      // Apply pattern filter
      if (query.pattern) {
        const pattern = query.pattern.toLowerCase();
        results = results.filter(e => 
          e.event.toLowerCase().includes(pattern)
        );
      }
      
      // Apply custom filter
      if (query.filter) {
        results = results.filter(query.filter);
      }
      
      // Apply offset
      if (query.offset) {
        results = results.slice(query.offset);
      }
      
      // Apply limit
      if (query.limit) {
        results = results.slice(0, query.limit);
      }
    }
    
    return results;
  }
  
  async delete(query: PersistenceQuery): Promise<number> {
    const toDelete = await this.load(query);
    const deleteIds = new Set(toDelete.map(e => e.id));
    
    const beforeCount = this.events.length;
    this.events = this.events.filter(e => !deleteIds.has(e.id));
    
    return beforeCount - this.events.length;
  }
  
  async clear(): Promise<void> {
    this.events = [];
    this.nextId = 1;
  }
  
  async stats(): Promise<PersistenceStats> {
    return {
      totalEvents: this.events.length,
      oldestEvent: this.events[0]?.time,
      newestEvent: this.events[this.events.length - 1]?.time,
      storageType: 'memory',
      metadata: {
        memoryUsage: JSON.stringify(this.events).length
      }
    };
  }
  
  async exportProlog(query?: PersistenceQuery): Promise<string> {
    const events = await this.load(query);
    return events
      .map(e => `happens(${e.event}, "${e.time}").`)
      .join('\n');
  }
  
  async importProlog(facts: string): Promise<void> {
    // Parse Prolog facts
    const factRegex = /happens\(([^)]+)\),\s*"([^"]+)"\)/g;
    let match;
    
    while ((match = factRegex.exec(facts)) !== null) {
      await this.save({
        event: match[1],
        time: match[2]
      });
    }
  }
}

/**
 * Factory function for memory persistence
 */
export function createMemoryPersistence(): PersistencePlugin {
  return new MemoryPersistence();
}