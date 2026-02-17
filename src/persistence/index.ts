/**
 * Persistence Plugin System
 *
 * Provides pluggable persistence for WhenM temporal memory
 */

export * from './types.js';
export * from './memory.js';
export * from './d1.js';

import type { PersistencePlugin, D1Config, PersistedEvent } from './types.js';
import { createMemoryPersistence } from './memory.js';
import { createD1Persistence } from './d1.js';

/**
 * Create a persistence plugin based on configuration
 */
export function createPersistence(config?: {
  type?: 'memory' | 'd1' | 'kv' | 'custom';
  d1?: D1Config;
  custom?: PersistencePlugin;
}): PersistencePlugin {
  if (!config || !config.type || config.type === 'memory') {
    return createMemoryPersistence();
  }

  if (config.type === 'd1' && config.d1) {
    return createD1Persistence(config.d1);
  }

  if (config.type === 'custom' && config.custom) {
    return config.custom;
  }

  // KV persistence not yet implemented, fallback to memory
  return createMemoryPersistence();
}

/**
 * Middleware to wrap an engine with persistence
 */
export function withPersistence<T extends { remember: (...args: unknown[]) => Promise<unknown>; query: (...args: unknown[]) => Promise<unknown> }>(
  engine: T,
  persistence: PersistencePlugin
): T & {
  persist: () => Promise<void>;
  restore: (query?: unknown) => Promise<void>;
  persistenceStats: () => Promise<Record<string, unknown>>;
} {
  const pendingEvents: PersistedEvent[] = [];
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  const schedulePersist = (): void => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(async () => {
      if (pendingEvents.length > 0) {
        await persistence.saveBatch(pendingEvents);
        pendingEvents.length = 0;
      }
    }, 100);
  };

  const originalRemember = engine.remember.bind(engine);
  const wrappedRemember = async (text: string, date?: string | Date): Promise<unknown> => {
    const result = await originalRemember(text, date);

    let time: string;
    if (!date) {
      time = new Date().toISOString().split('T')[0];
    } else if (typeof date === 'string') {
      time = date;
    } else {
      time = date.toISOString().split('T')[0];
    }

    pendingEvents.push({ event: text as string, time });
    schedulePersist();

    return result;
  };

  return {
    ...engine,
    remember: wrappedRemember as T['remember'],

    async persist(): Promise<void> {
      if (pendingEvents.length > 0) {
        await persistence.saveBatch(pendingEvents);
        pendingEvents.length = 0;
      }
    },

    async restore(query?: unknown): Promise<void> {
      const events = await persistence.load(query as Parameters<PersistencePlugin['load']>[0]);
      for (const event of events) {
        await originalRemember(event.event, event.time);
      }
    },

    async persistenceStats(): Promise<Record<string, unknown>> {
      const stats = await persistence.stats();
      return { ...stats };
    }
  };
}
