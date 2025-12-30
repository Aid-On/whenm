/**
 * Modern Query Builder for WhenM
 * 
 * Provides a fluent, chainable API for querying temporal data
 * Inspired by Prisma, Drizzle, and modern query builders
 */

import type { WhenMEngine } from './index.js';

export interface EventFilter {
  subject?: string | string[];
  verb?: string | string[];
  object?: string | string[];
  timeRange?: {
    from?: string | Date;
    to?: string | Date;
  };
}

export interface QueryOptions {
  orderBy?: {
    field: 'time' | 'subject' | 'verb' | 'object';
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface Event {
  subject: string;
  verb: string;
  object?: string;
  time: string;
  date?: string;
  metadata?: any;
}

export interface TimelineSnapshot {
  time: string;
  states: Record<string, any>;
}

/**
 * Fluent Query Builder for WhenM
 * 
 * @example
 * ```typescript
 * const events = await memory
 *   .query()
 *   .where({ subject: "Alice" })
 *   .between("2024-01-01", "2024-12-31")
 *   .orderBy("time", "desc")
 *   .limit(10)
 *   .execute();
 * ```
 */
export class QueryBuilder {
  private filters: EventFilter = {};
  private options: QueryOptions = {};
  private engine: WhenMEngine;

  constructor(engine: WhenMEngine) {
    this.engine = engine;
  }

  /**
   * Filter events by conditions
   */
  where(conditions: Partial<Event>): this {
    if (conditions.subject) {
      this.filters.subject = conditions.subject;
    }
    if (conditions.verb) {
      this.filters.verb = conditions.verb;
    }
    if (conditions.object) {
      this.filters.object = conditions.object;
    }
    return this;
  }

  /**
   * Filter by subject (entity)
   */
  subject(name: string | string[]): this {
    this.filters.subject = name;
    return this;
  }

  /**
   * Filter by verb (action)
   */
  verb(action: string | string[]): this {
    this.filters.verb = action;
    return this;
  }

  /**
   * Filter by time range
   */
  between(from: string | Date, to: string | Date): this {
    this.filters.timeRange = {
      from: from instanceof Date ? from.toISOString().slice(0, 10) : from,
      to: to instanceof Date ? to.toISOString().slice(0, 10) : to
    };
    return this;
  }

  /**
   * Filter by recent time period
   */
  last(amount: number, unit: 'days' | 'weeks' | 'months' | 'years'): this {
    const now = new Date();
    const from = new Date();
    
    switch(unit) {
      case 'days':
        from.setDate(now.getDate() - amount);
        break;
      case 'weeks':
        from.setDate(now.getDate() - (amount * 7));
        break;
      case 'months':
        from.setMonth(now.getMonth() - amount);
        break;
      case 'years':
        from.setFullYear(now.getFullYear() - amount);
        break;
    }
    
    return this.between(from, now);
  }

  /**
   * Filter by specific date
   */
  on(date: string | Date): this {
    const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : date;
    return this.between(dateStr, dateStr);
  }

  /**
   * Order results
   */
  orderBy(field: 'time' | 'subject' | 'verb' | 'object', direction: 'asc' | 'desc' = 'asc'): this {
    this.options.orderBy = { field, direction };
    return this;
  }

  /**
   * Limit number of results
   */
  limit(count: number): this {
    this.options.limit = count;
    return this;
  }

  /**
   * Skip results (for pagination)
   */
  offset(skip: number): this {
    this.options.offset = skip;
    return this;
  }

  /**
   * Paginate results
   */
  page(pageNumber: number, pageSize: number = 10): this {
    return this.limit(pageSize).offset((pageNumber - 1) * pageSize);
  }

  /**
   * Execute the query
   */
  async execute(): Promise<Event[]> {
    const prologQuery = this.buildPrologQuery();
    const results = await this.engine.query(prologQuery);
    
    // Parse and format results
    let events = this.parseResults(results);
    
    // Apply sorting
    if (this.options.orderBy) {
      events = this.sortEvents(events);
    }
    
    // Apply pagination
    if (this.options.offset || this.options.limit) {
      const start = this.options.offset || 0;
      const end = this.options.limit ? start + this.options.limit : undefined;
      events = events.slice(start, end);
    }
    
    return events;
  }

  /**
   * Get count of matching events
   */
  async count(): Promise<number> {
    const events = await this.execute();
    return events.length;
  }

  /**
   * Check if any events match
   */
  async exists(): Promise<boolean> {
    const events = await this.limit(1).execute();
    return events.length > 0;
  }

  /**
   * Get first matching event
   */
  async first(): Promise<Event | null> {
    const events = await this.limit(1).execute();
    return events[0] || null;
  }

  /**
   * Get distinct values for a field
   */
  async distinct(field: 'subject' | 'verb' | 'object'): Promise<string[]> {
    const events = await this.execute();
    const values = new Set<string>();
    
    for (const event of events) {
      const value = event[field];
      if (value) {
        values.add(value);
      }
    }
    
    return Array.from(values);
  }

  /**
   * Build Prolog query from filters
   */
  private buildPrologQuery(): string {
    let conditions: string[] = [];
    
    // Base query
    let eventPattern = 'event(';
    
    // Add subject filter
    if (this.filters.subject) {
      if (Array.isArray(this.filters.subject)) {
        // Multiple subjects not directly supported in single query
        eventPattern += 'Subject';
      } else {
        eventPattern += `"${this.filters.subject}"`;
      }
    } else {
      eventPattern += 'Subject';
    }
    
    eventPattern += ', ';
    
    // Add verb filter
    if (this.filters.verb) {
      if (Array.isArray(this.filters.verb)) {
        eventPattern += 'Verb';
      } else {
        eventPattern += `"${this.filters.verb}"`;
      }
    } else {
      eventPattern += 'Verb';
    }
    
    eventPattern += ', ';
    
    // Add object filter
    if (this.filters.object) {
      if (Array.isArray(this.filters.object)) {
        eventPattern += 'Object';
      } else {
        eventPattern += `"${this.filters.object}"`;
      }
    } else {
      eventPattern += 'Object';
    }
    
    eventPattern += ')';
    
    // Build main query
    let query = `happens(${eventPattern}, Time)`;
    
    // Add time range conditions
    if (this.filters.timeRange?.from) {
      conditions.push(`Time @>= "${this.filters.timeRange.from}"`);
    }
    if (this.filters.timeRange?.to) {
      conditions.push(`Time @=< "${this.filters.timeRange.to}"`);
    }
    
    // Add array filters as conditions
    if (Array.isArray(this.filters.subject)) {
      const subjectConditions = this.filters.subject
        .map(s => `Subject = "${s}"`)
        .join('; ');
      conditions.push(`(${subjectConditions})`);
    }
    
    if (Array.isArray(this.filters.verb)) {
      const verbConditions = this.filters.verb
        .map(v => `Verb = "${v}"`)
        .join('; ');
      conditions.push(`(${verbConditions})`);
    }
    
    if (Array.isArray(this.filters.object)) {
      const objectConditions = this.filters.object
        .map(o => `Object = "${o}"`)
        .join('; ');
      conditions.push(`(${objectConditions})`);
    }
    
    if (conditions.length > 0) {
      query += ', ' + conditions.join(', ');
    }
    
    return query;
  }

  /**
   * Parse Prolog results into Event objects
   */
  private parseResults(results: any[]): Event[] {
    return results.map(result => ({
      // If we filtered by a specific subject, use that value
      subject: result.Subject || (typeof this.filters.subject === 'string' ? this.filters.subject : ''),
      // If we filtered by a specific verb, use that value
      verb: result.Verb || (typeof this.filters.verb === 'string' ? this.filters.verb : ''),
      object: result.Object,
      time: result.Time || ''
    }));
  }

  /**
   * Sort events by field
   */
  private sortEvents(events: Event[]): Event[] {
    const { field, direction } = this.options.orderBy!;
    
    return [...events].sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      
      if (direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }
}

/**
 * Timeline API for entity-focused queries
 * 
 * @example
 * ```typescript
 * const timeline = memory.timeline("Alice");
 * const snapshot = await timeline.at("2023-06-15");
 * const changes = await timeline.between("2023-01-01", "2024-01-01");
 * ```
 */
export class Timeline {
  private entity: string;
  private engine: WhenMEngine;

  constructor(entity: string, engine: WhenMEngine) {
    this.entity = entity;
    this.engine = engine;
  }

  /**
   * Get snapshot of entity state at specific time
   */
  async at(time: string | Date): Promise<TimelineSnapshot> {
    const timeStr = time instanceof Date ? time.toISOString() : time;
    const targetTime = time instanceof Date ? time : new Date(time);
    
    // Fallback: use in-memory event log if available
    // This is more reliable than Prolog queries for now
    const events = await this.allEvents();
    const states: Record<string, any> = {};
    
    // Process events chronologically up to target time
    for (const event of events) {
      const eventTime = new Date(event.date || event.metadata?.timestamp || 0);
      if (eventTime <= targetTime) {
        // Simple state tracking based on verb patterns
        if (event.verb?.toLowerCase().includes('became') || 
            event.verb?.toLowerCase().includes('promoted') ||
            event.verb?.toLowerCase().includes('joined')) {
          states['role'] = event.object;
        }
        if (event.verb?.toLowerCase().includes('learned') ||
            event.verb?.toLowerCase().includes('acquired')) {
          if (!states['skills']) states['skills'] = [];
          if (event.object && !states['skills'].includes(event.object)) {
            states['skills'].push(event.object);
          }
        }
        if (event.verb?.toLowerCase().includes('moved')) {
          states['location'] = event.object;
        }
      }
    }
    
    return { time: timeStr, states };
  }

  /**
   * Get current state
   */
  async now(): Promise<TimelineSnapshot> {
    return this.at(new Date());
  }

  /**
   * Get changes between two times
   */
  async between(from: string | Date, to: string | Date): Promise<Event[]> {
    return new QueryBuilder(this.engine)
      .subject(this.entity)
      .between(from, to)
      .orderBy('time', 'asc')
      .execute();
  }

  /**
   * Get recent changes
   */
  async recent(days: number = 30): Promise<Event[]> {
    return new QueryBuilder(this.engine)
      .subject(this.entity)
      .last(days, 'days')
      .orderBy('time', 'desc')
      .execute();
  }

  /**
   * Compare two time points
   */
  async compare(time1: string | Date, time2: string | Date): Promise<{
    added: Record<string, any>;
    removed: Record<string, any>;
    changed: Record<string, any>;
  }> {
    const snapshot1 = await this.at(time1);
    const snapshot2 = await this.at(time2);
    
    const added: Record<string, any> = {};
    const removed: Record<string, any> = {};
    const changed: Record<string, any> = {};
    
    // Find added and changed
    for (const [key, value] of Object.entries(snapshot2.states)) {
      if (!(key in snapshot1.states)) {
        added[key] = value;
      } else if (snapshot1.states[key] !== value) {
        changed[key] = { from: snapshot1.states[key], to: value };
      }
    }
    
    // Find removed
    for (const [key, value] of Object.entries(snapshot1.states)) {
      if (!(key in snapshot2.states)) {
        removed[key] = value;
      }
    }
    
    return { added, removed, changed };
  }

  /**
   * Get all events for this entity
   */
  async allEvents(): Promise<Event[]> {
    return new QueryBuilder(this.engine)
      .subject(this.entity)
      .orderBy('time', 'asc')
      .execute();
  }

  /**
   * Alias for allEvents - complete history
   */
  async history(): Promise<Event[]> {
    return this.allEvents();
  }

  /**
   * Get all state changes for this entity
   */
  async changes(): Promise<Event[]> {
    return this.allEvents();
  }

  /**
   * Get events since a specific time
   */
  async since(time: string | Date): Promise<Event[]> {
    const now = new Date().toISOString();
    return this.between(time, now);
  }

  /**
   * Get events until a specific time
   */
  async until(time: string | Date): Promise<Event[]> {
    const events = await this.allEvents();
    const timeStr = time instanceof Date ? time.toISOString() : time;
    return events.filter(e => (e.date || e.metadata?.timestamp || '') <= timeStr);
  }

  /**
   * Get current states
   */
  async states(): Promise<Record<string, any>> {
    const snapshot = await this.now();
    return snapshot.states;
  }

  /**
   * Check if entity has a specific state
   */
  async hasState(domain: string, value?: any): Promise<boolean> {
    const states = await this.states();
    if (value === undefined) {
      return domain in states;
    }
    return states[domain] === value;
  }

  /**
   * Get state value at specific time
   */
  async stateAt(domain: string, time: string | Date): Promise<any> {
    const snapshot = await this.at(time);
    return snapshot.states[domain];
  }

  /**
   * Get first event for this entity
   */
  async first(): Promise<Event | null> {
    const events = await this.allEvents();
    return events.length > 0 ? events[0] : null;
  }

  /**
   * Get last event for this entity
   */
  async last(): Promise<Event | null> {
    const events = await this.allEvents();
    return events.length > 0 ? events[events.length - 1] : null;
  }

  /**
   * Count events for this entity
   */
  async count(): Promise<number> {
    return new QueryBuilder(this.engine)
      .subject(this.entity)
      .count();
  }
}

/**
 * Export the query builder factory
 */
export function createQueryBuilder(engine: WhenMEngine): QueryBuilder {
  return new QueryBuilder(engine);
}

/**
 * Export the timeline factory
 */
export function createTimeline(entity: string, engine: WhenMEngine): Timeline {
  return new Timeline(entity, engine);
}