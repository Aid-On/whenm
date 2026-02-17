/**
 * Mock Persistence Plugin for Testing
 * 
 * Provides an in-memory implementation with additional testing features
 */

import type { 
  PersistencePlugin, 
  PersistedEvent, 
  PersistenceQuery, 
  PersistenceStats 
} from './types.js';

/**
 * Mock Persistence Plugin
 * 
 * Features:
 * - In-memory storage
 * - Query simulation
 * - Call tracking for testing
 * - Configurable delays for async testing
 */
export class MockPersistencePlugin implements PersistencePlugin {
  readonly type = 'mock';
  
  private events: PersistedEvent[] = [];
  private callHistory: string[] = [];
  private delay: number;
  private shouldFail: boolean = false;
  private failureMessage: string = 'Mock failure';

  constructor(options: {
    initialEvents?: PersistedEvent[];
    delay?: number;
    shouldFail?: boolean;
    failureMessage?: string;
  } = {}) {
    this.events = options.initialEvents || [];
    this.delay = options.delay || 0;
    this.shouldFail = options.shouldFail || false;
    this.failureMessage = options.failureMessage || 'Mock failure';
  }

  private async simulateDelay(): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
  }

  private checkFailure(): void {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }
  }

  private recordCall(method: string, args?: unknown): void {
    this.callHistory.push(`${method}:${JSON.stringify(args || {})}`);
  }

  async save(event: PersistedEvent): Promise<void> {
    this.recordCall('save', event);
    await this.simulateDelay();
    this.checkFailure();
    
    // Generate ID if not present
    if (!event.id) {
      event.id = `mock-${Date.now()}-${Math.random()}`;
    }
    
    this.events.push({ ...event });
  }

  async saveBatch(events: PersistedEvent[]): Promise<void> {
    this.recordCall('saveBatch', { count: events.length });
    await this.simulateDelay();
    this.checkFailure();
    
    for (const event of events) {
      if (!event.id) {
        event.id = `mock-${Date.now()}-${Math.random()}`;
      }
      this.events.push({ ...event });
    }
  }

  async load(query?: PersistenceQuery): Promise<PersistedEvent[]> {
    this.recordCall('load', query);
    await this.simulateDelay();
    this.checkFailure();

    if (!query) return [...this.events];

    let results = this.filterByTimeRange([...this.events], query);
    results = this.filterByPattern(results, query);
    if (query.filter) results = results.filter(query.filter);
    if (query.offset) results = results.slice(query.offset);
    if (query.limit) results = results.slice(0, query.limit);
    return results;
  }

  private filterByTimeRange(results: PersistedEvent[], query: PersistenceQuery): PersistedEvent[] {
    if (!query.timeRange) return results;
    const { from, to } = query.timeRange;
    const fromTime = from ? new Date(from).getTime() : 0;
    const toTime = to ? new Date(to).getTime() : Date.now();
    return results.filter(event => {
      const eventTime = new Date(event.time).getTime();
      return eventTime >= fromTime && eventTime <= toTime;
    });
  }

  private filterByPattern(results: PersistedEvent[], query: PersistenceQuery): PersistedEvent[] {
    if (!query.pattern) return results;
    return results.filter(event => event.event.includes(query.pattern!));
  }

  async delete(query: PersistenceQuery): Promise<number> {
    this.recordCall('delete', query);
    await this.simulateDelay();
    this.checkFailure();
    
    const toDelete = await this.load(query);
    const deleteIds = new Set(toDelete.map(e => e.id));
    
    const originalLength = this.events.length;
    this.events = this.events.filter(e => !deleteIds.has(e.id));
    
    return originalLength - this.events.length;
  }

  async clear(): Promise<void> {
    this.recordCall('clear');
    await this.simulateDelay();
    this.checkFailure();
    
    this.events = [];
  }

  async stats(): Promise<PersistenceStats> {
    this.recordCall('stats');
    await this.simulateDelay();
    this.checkFailure();
    
    const sorted = [...this.events].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
    
    return {
      totalEvents: this.events.length,
      oldestEvent: sorted[0]?.time,
      newestEvent: sorted[sorted.length - 1]?.time,
      storageType: 'mock',
      metadata: {
        callCount: this.callHistory.length,
        lastCall: this.callHistory[this.callHistory.length - 1]
      }
    };
  }

  async exportProlog(query?: PersistenceQuery): Promise<string> {
    this.recordCall('exportProlog', query);
    await this.simulateDelay();
    this.checkFailure();
    
    const events = await this.load(query);
    return events
      .map(e => `event_at(${e.event}, "${e.time}").`)
      .join('\n');
  }

  async importProlog(facts: string): Promise<void> {
    this.recordCall('importProlog', { length: facts.length });
    await this.simulateDelay();
    this.checkFailure();
    
    // Parse Prolog facts (simple implementation)
    const lines = facts.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const match = line.match(/event_at\((.+?),\s*"(.+?)"\)/);
      if (match) {
        await this.save({
          event: match[1],
          time: match[2]
        });
      }
    }
  }

  // Testing utilities
  
  /**
   * Get all stored events (for testing)
   */
  getEvents(): PersistedEvent[] {
    return [...this.events];
  }

  /**
   * Get call history (for testing)
   */
  getCallHistory(): string[] {
    return [...this.callHistory];
  }

  /**
   * Clear call history (for testing)
   */
  clearCallHistory(): void {
    this.callHistory = [];
  }

  /**
   * Set failure mode (for testing)
   */
  setFailure(shouldFail: boolean, message?: string): void {
    this.shouldFail = shouldFail;
    if (message) {
      this.failureMessage = message;
    }
  }

  /**
   * Set delay (for testing)
   */
  setDelay(delay: number): void {
    this.delay = delay;
  }
}

/**
 * Factory function for mock plugin
 */
export function createMockPersistencePlugin(
  options?: ConstructorParameters<typeof MockPersistencePlugin>[0]
): MockPersistencePlugin {
  return new MockPersistencePlugin(options);
}