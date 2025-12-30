/**
 * Temporal Engine - DEPRECATED
 * 
 * This class has been replaced by Prolog-based Event Calculus in UnifiedSchemalessEngine.
 * Kept as a stub for backward compatibility only.
 * 
 * @deprecated Use UnifiedSchemalessEngine with Event Calculus instead
 */

export interface Event {
  subject: string;
  verb: string;
  object?: string;
  context?: Record<string, any>;
  timestamp: number;
  date: string;
}

export interface Fluent {
  type: string;
  subject: string;
  value: string;
  initiatedAt: number;
  initiatedBy: Event;
  terminatedAt?: number;
  terminatedBy?: Event;
}

export interface EventRule {
  verbPattern: RegExp | string;
  initiates?: (event: Event) => Fluent[];
  terminates?: (event: Event) => { type: string; subject: string; value?: string }[];
}

/**
 * Stub implementation - all methods are no-ops
 * @deprecated
 */
export class TemporalEngine {
  constructor() {
    console.warn('TemporalEngine is deprecated. Use UnifiedSchemalessEngine with Prolog Event Calculus instead.');
  }
  
  recordEvent(event: Event): void {
    // No-op - Prolog handles this now
  }
  
  currentState(type: string, subject: string): Fluent | null {
    return null;
  }
  
  stateAt(type: string, subject: string, time: number): Fluent | null {
    return null;
  }
  
  whenBecameTrue(type: string, subject: string, value?: string): Date | null {
    return null;
  }
  
  clear(): void {
    // No-op
  }
  
  addRule(rule: EventRule): void {
    // No-op - rules are in Prolog now
  }
  
  getEvents(): Event[] {
    return [];
  }
  
  getFluents(): Map<string, Fluent[]> {
    return new Map();
  }
  
  exportState(): any {
    return { events: [], fluents: [] };
  }
  
  importState(state: any): void {
    // No-op
  }
}