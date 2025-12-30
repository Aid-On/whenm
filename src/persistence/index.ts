/**
 * Persistence Plugin System
 * 
 * Provides pluggable persistence for WhenM temporal memory
 */

export * from './types.js';
export * from './memory.js';
export * from './d1.js';

import type { PersistencePlugin, D1Config } from './types.js';
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
  // Default to memory persistence
  if (!config || !config.type || config.type === 'memory') {
    return createMemoryPersistence();
  }
  
  // D1 persistence
  if (config.type === 'd1' && config.d1) {
    return createD1Persistence(config.d1);
  }
  
  // Custom persistence
  if (config.type === 'custom' && config.custom) {
    return config.custom;
  }
  
  // KV persistence (not yet implemented)
  if (config.type === 'kv') {
    console.warn('KV persistence not yet implemented, falling back to memory');
    return createMemoryPersistence();
  }
  
  // Fallback to memory
  console.warn(`Unknown persistence type: ${config.type}, falling back to memory`);
  return createMemoryPersistence();
}

/**
 * Middleware to wrap an engine with persistence
 */
export function withPersistence<T extends { remember: Function; query: Function }>(
  engine: T,
  persistence: PersistencePlugin
): T & { 
  persist: () => Promise<void>;
  restore: (query?: any) => Promise<void>;
  persistenceStats: () => Promise<any>;
} {
  // Queue for batch operations
  const pendingEvents: any[] = [];
  let persistTimer: any = null;
  
  // Auto-persist after delay
  const schedulePersist = () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(async () => {
      if (pendingEvents.length > 0) {
        await persistence.saveBatch(pendingEvents);
        pendingEvents.length = 0;
      }
    }, 100); // Persist after 100ms of inactivity
  };
  
  // Wrap remember to auto-persist
  const originalRemember = engine.remember.bind(engine);
  const wrappedRemember = async (text: string, date?: string | Date) => {
    // Call original
    const result = await originalRemember(text, date);
    
    // Extract event data (simplified - in real implementation, parse properly)
    const time = date 
      ? (typeof date === 'string' ? date : date.toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];
    
    // Queue for persistence
    pendingEvents.push({
      event: text,
      time
    });
    
    // Schedule batch persist
    schedulePersist();
    
    return result;
  };
  
  // Create enhanced engine
  return {
    ...engine,
    remember: wrappedRemember,
    
    async persist(): Promise<void> {
      // Force persist any pending events
      if (pendingEvents.length > 0) {
        await persistence.saveBatch(pendingEvents);
        pendingEvents.length = 0;
      }
    },
    
    async restore(query?: any): Promise<void> {
      // Load events from persistence
      const events = await persistence.load(query);
      
      // Replay events into engine
      for (const event of events) {
        await originalRemember(event.event, event.time);
      }
    },
    
    async persistenceStats(): Promise<any> {
      return persistence.stats();
    }
  };
}