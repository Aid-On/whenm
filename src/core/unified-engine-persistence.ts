/**
 * Persistence operations for UnifiedSchemalessEngine
 *
 * Extracted from unified-engine.ts for maintainability
 */

import type { PersistencePlugin } from '../persistence/index.js';

export interface PersistenceOptions {
  debug?: boolean;
}

export interface EventLogEntry {
  event: unknown;
  timestamp: number;
  date: string;
  text?: string;
}

/**
 * Persist events to configured storage
 */
export async function persistEvents(
  persistence: PersistencePlugin | undefined,
  eventLog: EventLogEntry[],
  _options: PersistenceOptions
): Promise<void> {
  if (!persistence) {
    return;
  }

  const events = eventLog.map(e => ({
    event: typeof e.event === 'string' ? e.event : JSON.stringify(e.event),
    time: e.date,
    metadata: { timestamp: e.timestamp }
  }));

  await persistence.saveBatch(events);
}

/**
 * Restore events from configured storage
 */
export async function restoreEvents(
  persistence: PersistencePlugin | undefined,
  query: unknown,
  rememberFn: (text: string, date?: string | Date) => Promise<void>,
  _options: PersistenceOptions
): Promise<void> {
  if (!persistence) {
    return;
  }

  const events = await persistence.load(query as Parameters<PersistencePlugin['load']>[0]);

  for (const event of events) {
    let parsedEvent = event.event;
    if (typeof parsedEvent === 'string' && parsedEvent.startsWith('{')) {
      try {
        parsedEvent = JSON.parse(parsedEvent);
      } catch {
        // Keep as string if not JSON
      }
    }

    await rememberFn(parsedEvent, event.time);
  }
}

/**
 * Get persistence statistics
 */
export async function getPersistenceStats(
  persistence: PersistencePlugin | undefined
): Promise<Record<string, unknown>> {
  if (!persistence) {
    return { enabled: false };
  }

  const stats = await persistence.stats();
  return {
    enabled: true,
    ...stats
  };
}

/**
 * Export events to Prolog format
 */
export async function exportProlog(
  persistence: PersistencePlugin | undefined,
  eventLog: EventLogEntry[],
  query?: unknown
): Promise<string> {
  if (persistence) {
    return persistence.exportProlog(query as Parameters<PersistencePlugin['exportProlog']>[0]);
  }

  return eventLog
    .map(e => `happens(${JSON.stringify(e.event)}, "${e.date}").`)
    .join('\n');
}

/**
 * Import from Prolog format
 */
export async function importProlog(
  persistence: PersistencePlugin | undefined,
  facts: string,
  restoreFn: () => Promise<void>,
  rememberFn: (text: string, date?: string | Date) => Promise<void>
): Promise<void> {
  if (persistence) {
    await persistence.importProlog(facts);
    await restoreFn();
  } else {
    const factRegex = /happens\(([^)]+)\),\s*"([^"]+)"\)/g;

    for (const match of facts.matchAll(factRegex)) {
      await rememberFn(match[1], match[2]);
    }
  }
}
