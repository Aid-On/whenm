/**
 * Cloudflare D1 Persistence Plugin
 * 
 * Persists temporal events to Cloudflare D1 SQL database
 * Provides durable storage with SQL query capabilities
 */

import type { 
  PersistencePlugin, 
  PersistedEvent, 
  PersistenceQuery, 
  PersistenceStats,
  D1Config
} from './types.js';

/**
 * D1 database table schema (schemaless data storage)
 */
const D1_SCHEMA = `
CREATE TABLE IF NOT EXISTS whenm_events (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  time TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(event, time)
);

CREATE INDEX IF NOT EXISTS idx_whenm_time ON whenm_events(time);
CREATE INDEX IF NOT EXISTS idx_whenm_event ON whenm_events(event);
`;

export class D1Persistence implements PersistencePlugin {
  readonly type = 'cloudflare-d1';
  private db: any;  // D1Database type
  private tableName: string;
  private namespace: string;
  
  constructor(config: D1Config) {
    this.db = config.database;
    this.tableName = config.tableName || 'whenm_events';
    this.namespace = config.namespace || 'default';
  }
  
  async initialize(): Promise<void> {
    // Create table if not exists
    try {
      await this.db.exec(D1_SCHEMA.replace(/whenm_events/g, this.tableName));
    } catch (error) {
      console.error('Failed to initialize D1 schema:', error);
      // Continue anyway - table might already exist
    }
  }
  
  async save(event: PersistedEvent): Promise<void> {
    const id = event.id || `d1_${this.namespace}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const metadata = event.metadata ? JSON.stringify(event.metadata) : null;
    
    await this.db.prepare(
      `INSERT OR REPLACE INTO ${this.tableName} (id, event, time, metadata)
       VALUES (?, ?, ?, ?)`
    )
    .bind(id, event.event, event.time, metadata)
    .run();
  }
  
  async saveBatch(events: PersistedEvent[]): Promise<void> {
    // D1 batch operations
    const statements = events.map(event => {
      const id = event.id || `d1_${this.namespace}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const metadata = event.metadata ? JSON.stringify(event.metadata) : null;
      
      return this.db.prepare(
        `INSERT OR REPLACE INTO ${this.tableName} (id, event, time, metadata)
         VALUES (?, ?, ?, ?)`
      ).bind(id, event.event, event.time, metadata);
    });
    
    // Execute batch (D1 supports up to 100 statements per batch)
    const batchSize = 100;
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      await this.db.batch(batch);
    }
  }
  
  async load(query?: PersistenceQuery): Promise<PersistedEvent[]> {
    let sql = `SELECT id, event, time, metadata FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    
    if (query) {
      // Time range filter
      if (query.timeRange) {
        if (query.timeRange.from) {
          sql += ' AND time >= ?';
          params.push(
            typeof query.timeRange.from === 'string' 
              ? query.timeRange.from 
              : query.timeRange.from.toISOString()
          );
        }
        if (query.timeRange.to) {
          sql += ' AND time <= ?';
          params.push(
            typeof query.timeRange.to === 'string'
              ? query.timeRange.to
              : query.timeRange.to.toISOString()
          );
        }
      }
      
      // Pattern filter
      if (query.pattern) {
        sql += ' AND event LIKE ?';
        params.push(`%${query.pattern}%`);
      }
      
      // Order by time
      sql += ' ORDER BY time ASC';
      
      // Limit and offset
      if (query.limit) {
        sql += ' LIMIT ?';
        params.push(query.limit);
        
        if (query.offset) {
          sql += ' OFFSET ?';
          params.push(query.offset);
        }
      }
    } else {
      sql += ' ORDER BY time ASC';
    }
    
    const result = await this.db.prepare(sql).bind(...params).all();
    
    const events = (result.results || []).map((row: any) => ({
      id: row.id,
      event: row.event,
      time: row.time,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
    
    // Apply custom filter if provided
    if (query?.filter) {
      return events.filter(query.filter);
    }
    
    return events;
  }
  
  async delete(query: PersistenceQuery): Promise<number> {
    // Get events to delete
    const toDelete = await this.load(query);
    
    if (toDelete.length === 0) {
      return 0;
    }
    
    // Delete by IDs
    const ids = toDelete.map(e => e.id);
    const placeholders = ids.map(() => '?').join(',');
    
    const result = await this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`
    )
    .bind(...ids)
    .run();
    
    return result.meta?.changes || 0;
  }
  
  async clear(): Promise<void> {
    await this.db.prepare(`DELETE FROM ${this.tableName}`).run();
  }
  
  async stats(): Promise<PersistenceStats> {
    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    ).first();
    
    const timeResult = await this.db.prepare(
      `SELECT MIN(time) as oldest, MAX(time) as newest FROM ${this.tableName}`
    ).first();
    
    return {
      totalEvents: countResult?.count || 0,
      oldestEvent: timeResult?.oldest,
      newestEvent: timeResult?.newest,
      storageType: 'cloudflare-d1',
      metadata: {
        tableName: this.tableName,
        namespace: this.namespace
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
    const events: PersistedEvent[] = [];
    const factRegex = /happens\(([^)]+)\),\s*"([^"]+)"\)/g;
    let match;
    
    while ((match = factRegex.exec(facts)) !== null) {
      events.push({
        event: match[1],
        time: match[2]
      });
    }
    
    // Batch save
    if (events.length > 0) {
      await this.saveBatch(events);
    }
  }
  
  async destroy(): Promise<void> {
    // Optional: clean up connections
    // D1 doesn't need explicit cleanup
  }
}

/**
 * Factory function for D1 persistence
 */
export function createD1Persistence(config: D1Config): PersistencePlugin {
  const plugin = new D1Persistence(config);
  
  // Auto-initialize on creation
  plugin.initialize().catch(error => {
    console.error('D1 initialization failed:', error);
  });
  
  return plugin;
}