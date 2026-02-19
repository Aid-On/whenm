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

interface D1Database {
  exec(sql: string): Promise<unknown>;
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
}

interface D1PreparedStatement {
  bind(...params: (string | number | null)[]): D1PreparedStatement;
  run(): Promise<{ meta?: { changes?: number } }>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
  first(): Promise<Record<string, unknown> | null>;
}

export class D1Persistence implements PersistencePlugin {
  readonly type = 'cloudflare-d1';
  private db: D1Database;
  private tableName: string;
  private namespace: string;

  constructor(config: D1Config) {
    this.db = config.database as D1Database;
    this.tableName = config.tableName || 'whenm_events';
    this.namespace = config.namespace || 'default';
  }

  async initialize(): Promise<void> {
    try {
      await this.db.exec(D1_SCHEMA.replace(/whenm_events/g, this.tableName));
    } catch {
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
    const statements = events.map(event => {
      const id = event.id || `d1_${this.namespace}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const metadata = event.metadata ? JSON.stringify(event.metadata) : null;

      return this.db.prepare(
        `INSERT OR REPLACE INTO ${this.tableName} (id, event, time, metadata)
         VALUES (?, ?, ?, ?)`
      ).bind(id, event.event, event.time, metadata);
    });

    const batchSize = 100;
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      await this.db.batch(batch);
    }
  }

  async load(query?: PersistenceQuery): Promise<PersistedEvent[]> {
    const { sql, params } = this.buildLoadQuery(query);
    const result = await this.db.prepare(sql).bind(...params).all();

    const events = (result.results || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      event: row.event as string,
      time: row.time as string,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined
    }));

    if (query?.filter) {
      return events.filter(query.filter);
    }

    return events;
  }

  private buildLoadQuery(query?: PersistenceQuery): { sql: string; params: (string | number)[] } {
    const baseSql = `SELECT id, event, time, metadata FROM ${this.tableName} WHERE 1=1`;
    if (!query) {
      return { sql: baseSql + ' ORDER BY time ASC', params: [] };
    }
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    this.addTimeRangeClauses(query, clauses, params);
    this.addPatternClause(query, clauses, params);
    let sql = baseSql + clauses.join('') + ' ORDER BY time ASC';
    sql = this.addPaginationClauses(sql, query, params);
    return { sql, params };
  }

  private addTimeRangeClauses(query: PersistenceQuery, clauses: string[], params: (string | number)[]): void {
    if (query.timeRange?.from) {
      clauses.push(' AND time >= ?');
      const from = query.timeRange.from;
      params.push(typeof from === 'string' ? from : from.toISOString());
    }
    if (query.timeRange?.to) {
      clauses.push(' AND time <= ?');
      const to = query.timeRange.to;
      params.push(typeof to === 'string' ? to : to.toISOString());
    }
  }

  private addPatternClause(query: PersistenceQuery, clauses: string[], params: (string | number)[]): void {
    if (query.pattern) {
      clauses.push(' AND event LIKE ?');
      params.push(`%${query.pattern}%`);
    }
  }

  private addPaginationClauses(sql: string, query: PersistenceQuery, params: (string | number)[]): string {
    if (!query.limit) return sql;
    params.push(query.limit);
    if (query.offset) {
      params.push(query.offset);
      return sql + ' LIMIT ? OFFSET ?';
    }
    return sql + ' LIMIT ?';
  }

  async delete(query: PersistenceQuery): Promise<number> {
    const toDelete = await this.load(query);

    if (toDelete.length === 0) {
      return 0;
    }

    const ids = toDelete.map(e => e.id).filter((id): id is string => id !== undefined);
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
      totalEvents: (countResult?.count as number) || 0,
      oldestEvent: timeResult?.oldest as string | undefined,
      newestEvent: timeResult?.newest as string | undefined,
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
    const events: PersistedEvent[] = [];
    const factRegex = /happens\(([^)]+)\),\s*"([^"]+)"\)/g;

    for (const match of facts.matchAll(factRegex)) {
      events.push({
        event: match[1],
        time: match[2]
      });
    }

    if (events.length > 0) {
      await this.saveBatch(events);
    }
  }

  async destroy(): Promise<void> {
    // D1 doesn't need explicit cleanup
  }
}

/**
 * Factory function for D1 persistence
 */
export function createD1Persistence(config: D1Config): PersistencePlugin {
  const plugin = new D1Persistence(config);

  // Auto-initialize on creation (errors handled internally)
  plugin.initialize().catch(() => {
    // Initialization failed but plugin can still be used if table already exists
  });

  return plugin;
}
