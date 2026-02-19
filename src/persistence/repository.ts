/**
 * Repository Pattern for WhenM Event Persistence
 * 
 * Provides a clean abstraction over different storage mechanisms
 */

import type {
  PersistencePlugin,
  PersistedEvent,
  PersistenceStats
} from './types.js';

/**
 * Event Repository Interface
 * 
 * Provides high-level operations for event persistence
 */
interface StoreEventParams {
  subject: string;
  verb: string;
  object?: string;
  timestamp?: Date | string;
  metadata?: Record<string, unknown>;
}

export interface EventRepository {
  /**
   * Store a new event
   */
  storeEvent(params: StoreEventParams): Promise<void>;

  /**
   * Find events by subject
   */
  findBySubject(subject: string, limit?: number): Promise<PersistedEvent[]>;

  /**
   * Find events by verb
   */
  findByVerb(verb: string, limit?: number): Promise<PersistedEvent[]>;

  /**
   * Find events in time range
   */
  findByTimeRange(from: Date | string, to: Date | string): Promise<PersistedEvent[]>;

  /**
   * Find recent events
   */
  findRecent(days: number): Promise<PersistedEvent[]>;

  /**
   * Get all events
   */
  getAllEvents(limit?: number): Promise<PersistedEvent[]>;

  /**
   * Clear all events
   */
  clearAll(): Promise<void>;

  /**
   * Get repository statistics
   */
  getStats(): Promise<PersistenceStats>;

  /**
   * Get underlying plugin (for advanced operations)
   */
  getPlugin(): PersistencePlugin;
}

/**
 * Default Event Repository implementation
 */
export class DefaultEventRepository implements EventRepository {
  private plugin: PersistencePlugin;
  constructor(plugin: PersistencePlugin) { this.plugin = plugin; }

  async storeEvent(params: StoreEventParams): Promise<void> {
    const { subject, verb, object, timestamp, metadata } = params;
    const time = timestamp instanceof Date
      ? timestamp.toISOString()
      : timestamp || new Date().toISOString();

    const event = object
      ? `${verb}(${subject}, ${object})`
      : `${verb}(${subject})`;

    await this.plugin.save({
      event,
      time,
      metadata: {
        ...metadata,
        subject,
        verb,
        object
      }
    });
  }

  async findBySubject(subject: string, limit?: number): Promise<PersistedEvent[]> {
    return this.plugin.load({
      pattern: subject,
      limit,
      filter: (event) => {
        const metadata = event.metadata;
        return metadata?.subject === subject || event.event.includes(subject);
      }
    });
  }

  async findByVerb(verb: string, limit?: number): Promise<PersistedEvent[]> {
    return this.plugin.load({
      pattern: verb,
      limit,
      filter: (event) => {
        const metadata = event.metadata;
        return metadata?.verb === verb || event.event.startsWith(verb);
      }
    });
  }

  async findByTimeRange(
    from: Date | string, 
    to: Date | string
  ): Promise<PersistedEvent[]> {
    return this.plugin.load({
      timeRange: { from, to }
    });
  }

  async findRecent(days: number): Promise<PersistedEvent[]> {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    return this.findByTimeRange(from, to);
  }

  async getAllEvents(limit?: number): Promise<PersistedEvent[]> {
    return this.plugin.load({ limit });
  }

  async clearAll(): Promise<void> {
    return this.plugin.clear();
  }

  async getStats(): Promise<PersistenceStats> {
    return this.plugin.stats();
  }

  getPlugin(): PersistencePlugin {
    return this.plugin;
  }
}

/**
 * Factory function to create event repository
 */
export function createEventRepository(plugin: PersistencePlugin): EventRepository {
  return new DefaultEventRepository(plugin);
}