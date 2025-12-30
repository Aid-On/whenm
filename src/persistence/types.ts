/**
 * Persistence Plugin System for WhenM
 * 
 * Provides a pluggable persistence layer for temporal events
 * without enforcing any specific schema or storage mechanism
 */

/**
 * Core event structure for persistence
 */
export interface PersistedEvent {
  id?: string;
  event: string;        // Raw Prolog-style event: "joined(alice, engineer)"
  time: string;         // ISO date or timestamp
  metadata?: Record<string, any>;  // Optional metadata
}

/**
 * Query options for retrieving events
 */
export interface PersistenceQuery {
  /** Time range filter */
  timeRange?: {
    from?: string | Date;
    to?: string | Date;
  };
  /** Pattern matching on event string */
  pattern?: string;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Custom filter function */
  filter?: (event: PersistedEvent) => boolean;
}

/**
 * Statistics about the persistence store
 */
export interface PersistenceStats {
  totalEvents: number;
  oldestEvent?: string;
  newestEvent?: string;
  storageType: string;
  metadata?: Record<string, any>;
}

/**
 * Core persistence plugin interface
 * 
 * Implementations can use any storage mechanism:
 * - In-memory arrays
 * - Cloudflare D1
 * - Cloudflare KV
 * - Durable Objects
 * - External databases
 */
export interface PersistencePlugin {
  /** Plugin identifier */
  readonly type: string;
  
  /** Save a single event */
  save(event: PersistedEvent): Promise<void>;
  
  /** Save multiple events in batch */
  saveBatch(events: PersistedEvent[]): Promise<void>;
  
  /** Load events matching query */
  load(query?: PersistenceQuery): Promise<PersistedEvent[]>;
  
  /** Delete specific events */
  delete(query: PersistenceQuery): Promise<number>;
  
  /** Clear all events */
  clear(): Promise<void>;
  
  /** Get storage statistics */
  stats(): Promise<PersistenceStats>;
  
  /** Export as Prolog facts */
  exportProlog(query?: PersistenceQuery): Promise<string>;
  
  /** Import from Prolog facts */
  importProlog(facts: string): Promise<void>;
  
  /** Optional: Initialize storage (create tables, etc.) */
  initialize?(): Promise<void>;
  
  /** Optional: Close connections, cleanup */
  destroy?(): Promise<void>;
}

/**
 * Factory function type for creating persistence plugins
 */
export type PersistenceFactory<T = any> = (config: T) => PersistencePlugin;

/**
 * Registry of available persistence plugins
 */
export interface PersistenceRegistry {
  memory: PersistenceFactory;
  d1?: PersistenceFactory<D1Config>;
  kv?: PersistenceFactory<KVConfig>;
  durable?: PersistenceFactory<DurableConfig>;
}

/**
 * Configuration for D1 persistence
 */
export interface D1Config {
  database: any;  // D1Database type from Cloudflare
  tableName?: string;
  namespace?: string;
}

/**
 * Configuration for KV persistence  
 */
export interface KVConfig {
  namespace: any;  // KVNamespace from Cloudflare
  prefix?: string;
  ttl?: number;  // Time to live in seconds
}

/**
 * Configuration for Durable Objects persistence
 */
export interface DurableConfig {
  namespace: any;  // DurableObjectNamespace
  objectName?: string;
}