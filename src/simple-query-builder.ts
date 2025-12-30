/**
 * Simple Query Builder for WhenM
 * 
 * Simplified implementation that actually works
 */

export interface SimpleEvent {
  event: string;
  timestamp: number;
  date?: string;
  subject?: string;
  verb?: string;
  object?: string;
}

/**
 * Simple Query Builder
 */
export class SimpleQueryBuilder {
  private events: SimpleEvent[] = [];
  private filters: any = {};
  private sorting?: { field: string; direction: 'asc' | 'desc' };
  private limitCount?: number;
  private offsetCount?: number;

  constructor(private engine: any) {
    // Events will be loaded when execute() is called
  }

  /**
   * Filter by subject
   */
  subject(name: string | string[]): this {
    this.filters.subject = name;
    return this;
  }

  /**
   * Filter by verb
   */
  verb(action: string | string[]): this {
    this.filters.verb = action;
    return this;
  }

  /**
   * Filter by object
   */
  object(obj: string | string[]): this {
    this.filters.object = obj;
    return this;
  }

  /**
   * Filter by multiple conditions
   */
  where(conditions: any): this {
    Object.assign(this.filters, conditions);
    return this;
  }

  /**
   * Filter by time range
   */
  between(from: string | Date, to: string | Date): this {
    this.filters.timeRange = { from, to };
    return this;
  }

  /**
   * Filter by specific date
   */
  on(date: string | Date): this {
    this.filters.date = date;
    return this;
  }

  /**
   * Get events from last N days/weeks/months/years
   */
  last(amount: number, unit: 'days' | 'weeks' | 'months' | 'years'): this {
    const now = new Date();
    const from = new Date();
    
    switch (unit) {
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
    
    this.filters.timeRange = { from: from.toISOString(), to: now.toISOString() };
    return this;
  }

  /**
   * Sort results
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sorting = { field, direction };
    return this;
  }

  /**
   * Limit results
   */
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  /**
   * Skip results
   */
  offset(count: number): this {
    this.offsetCount = count;
    return this;
  }

  /**
   * Page results
   */
  page(pageNum: number, pageSize: number): this {
    this.offsetCount = (pageNum - 1) * pageSize;
    this.limitCount = pageSize;
    return this;
  }

  /**
   * Execute query and return results
   */
  async execute(): Promise<SimpleEvent[]> {
    // Get all events from engine's event log
    let allEvents: any[] = [];
    
    // Access the internal event log directly
    if (this.engine._eventLog) {
      allEvents = [...this.engine._eventLog];
    } else if (this.engine.eventLog) {
      allEvents = [...this.engine.eventLog];
    } else if (this.engine.getEventLog) {
      allEvents = await this.engine.getEventLog();
    } else if (this.engine.getEvents) {
      allEvents = await this.engine.getEvents();
    } else if (this.engine.allEvents) {
      allEvents = await this.engine.allEvents();
    }

    // Start with all events
    let results = [...allEvents];
    
    // Apply filters - just simple text matching
    if (this.filters.subject) {
      const subjects = Array.isArray(this.filters.subject) ? this.filters.subject : [this.filters.subject];
      results = results.filter(e => {
        const eventText = (e.event || e.text || '').toLowerCase();
        return subjects.some((s: string) => eventText.includes(s.toLowerCase()));
      });
    }
    
    if (this.filters.verb) {
      const verbs = Array.isArray(this.filters.verb) ? this.filters.verb : [this.filters.verb];
      results = results.filter(e => {
        const eventText = (e.event || e.text || '').toLowerCase();
        return verbs.some((v: string) => eventText.includes(v.toLowerCase()));
      });
    }
    
    if (this.filters.object) {
      const objects = Array.isArray(this.filters.object) ? this.filters.object : [this.filters.object];
      results = results.filter(e => {
        const eventText = (e.event || e.text || '').toLowerCase();
        return objects.some((o: string) => eventText.includes(o.toLowerCase()));
      });
    }
    
    // Apply time range filter
    if (this.filters.timeRange) {
      const from = new Date(this.filters.timeRange.from).getTime();
      const to = new Date(this.filters.timeRange.to).getTime();
      results = results.filter(e => {
        const time = e.timestamp || new Date(e.date || 0).getTime();
        return time >= from && time <= to;
      });
    }
    
    // Apply sorting
    if (this.sorting) {
      results.sort((a, b) => {
        let aVal: any = a[this.sorting!.field as keyof SimpleEvent];
        let bVal: any = b[this.sorting!.field as keyof SimpleEvent];
        
        if (this.sorting!.field === 'time') {
          aVal = a.timestamp || 0;
          bVal = b.timestamp || 0;
        }
        
        if (this.sorting!.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    // Apply offset and limit
    if (this.offsetCount !== undefined) {
      results = results.slice(this.offsetCount);
    }
    if (this.limitCount !== undefined) {
      results = results.slice(0, this.limitCount);
    }
    
    // Return raw events without transformation
    return results.map(e => ({
      event: e.event || e.text || '',
      timestamp: e.timestamp || new Date(e.date || Date.now()).getTime(),
      date: e.date,
      subject: e.subject,
      verb: e.verb,
      object: e.object,
      text: e.text || e.event
    }));
  }

  /**
   * Count matching events
   */
  async count(): Promise<number> {
    const events = await this.execute();
    return events.length;
  }

  /**
   * Check if any events match
   */
  async exists(): Promise<boolean> {
    const events = await this.execute();
    return events.length > 0;
  }

  /**
   * Get first matching event
   */
  async first(): Promise<SimpleEvent | null> {
    const events = await this.limit(1).execute();
    return events[0] || null;
  }

  /**
   * Get distinct values
   */
  async distinct(field: string): Promise<string[]> {
    const events = await this.execute();
    const values = new Set<string>();
    
    for (const event of events) {
      const value = (event as any)[field];
      if (value) {
        values.add(value);
      }
    }
    
    return Array.from(values);
  }

  // No parsing - keep it schemaless!
}

/**
 * Simple Timeline implementation
 */
export class SimpleTimeline {
  constructor(
    private entity: string,
    private engine: any
  ) {}

  /**
   * Get state at specific time
   */
  async at(date: string | Date): Promise<any> {
    const builder = new SimpleQueryBuilder(this.engine);
    const events = await builder
      .subject(this.entity)
      .execute();
    
    const targetTime = new Date(date).getTime();
    const relevantEvents = events.filter(e => {
      const eventTime = e.timestamp || new Date(e.date || Date.now()).getTime();
      return eventTime <= targetTime;
    });
    
    // Just collect all events chronologically
    const states: any = {
      events: relevantEvents
    };
    
    return {
      time: date instanceof Date ? date.toISOString() : date,
      states
    };
  }

  /**
   * Get recent events
   */
  async recent(days: number): Promise<SimpleEvent[]> {
    const builder = new SimpleQueryBuilder(this.engine);
    return builder
      .subject(this.entity)
      .last(days, 'days')
      .orderBy('time', 'desc')
      .execute();
  }

  /**
   * Get current state
   */
  async now(): Promise<any> {
    return this.at(new Date());
  }

  /**
   * Compare states between two times
   */
  async compare(from: string | Date, to: string | Date): Promise<any> {
    const fromState = await this.at(from);
    const toState = await this.at(to);
    
    return {
      from: fromState,
      to: toState
    };
  }

  /**
   * Get all states
   */
  async states(): Promise<SimpleEvent[]> {
    const builder = new SimpleQueryBuilder(this.engine);
    return builder
      .subject(this.entity)
      .orderBy('time', 'asc')
      .execute();
  }
}

// Factory functions
export function createQueryBuilder(engine: any): SimpleQueryBuilder {
  return new SimpleQueryBuilder(engine);
}

export function createTimeline(entity: string, engine: any): SimpleTimeline {
  return new SimpleTimeline(entity, engine);
}