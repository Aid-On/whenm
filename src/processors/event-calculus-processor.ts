/**
 * Event Calculus Processor
 * LLM makes semantic judgments, Prolog performs temporal calculations
 */

import type { UnifiedLLMProvider } from '../providers/llm-provider.js';

export type TemporalType = 'INITIATES' | 'TERMINATES' | 'HAPPENS' | 'STATE_UPDATE';

export interface FluentDomain {
  domain: string;  // Fully dynamic - no hardcoded values
  value: string;
  isExclusive?: boolean;  // True if only one value allowed at a time
}

export interface EventCalculusStructure {
  subject: string;
  verb: string;
  object?: string;
  temporalType: TemporalType;
  affectedFluent?: FluentDomain;
  timestamp: string;
}

export class EventCalculusProcessor {
  private llm: UnifiedLLMProvider;
  constructor(llm: UnifiedLLMProvider) { this.llm = llm; }

  /**
   * Generate Event Calculus structure using LLM semantic judgment
   */
  async structureForEventCalculus(text: string, timestamp: string): Promise<EventCalculusStructure> {
    const prompt = `
Analyze this event and determine its temporal semantics for Event Calculus.

Event: "${text}"
Timestamp: "${timestamp}"

Return JSON with:
{
  "subject": "entity name (normalized lowercase)",
  "verb": "original verb",
  "object": "object/target if any",
  "temporalType": "INITIATES|TERMINATES|HAPPENS|STATE_UPDATE",
  "affectedFluent": {
    "domain": "abstract category (any lowercase singular noun)",
    "value": "the specific value",
    "isExclusive": boolean (true if domain allows only ONE value)
  }
}

Temporal Type Guidelines:
- INITIATES: Starts a new state (started, began, learned, joined, became, moved to)
- TERMINATES: Ends a state (quit, stopped, forgot, lost, left, resigned, graduated)
- HAPPENS: Point event with no duration (met, saw, completed, achieved)
- STATE_UPDATE: Replaces previous state (promoted to, moved to, changed to)

Examples:
- "John started playing guitar" → temporalType: "INITIATES", affectedFluent: {domain: "hobby", value: "guitar", isExclusive: false}
- "John quit his job at Google" → temporalType: "TERMINATES", affectedFluent: {domain: "employment", value: "google", isExclusive: true}
- "John moved to Tokyo" → temporalType: "STATE_UPDATE", affectedFluent: {domain: "location", value: "tokyo", isExclusive: true}
- "John forgot how to swim" → temporalType: "TERMINATES", affectedFluent: {domain: "skill", value: "swimming", isExclusive: false}
- "John became CTO" → temporalType: "STATE_UPDATE", affectedFluent: {domain: "role", value: "cto", isExclusive: true}
- "John feels happy" → temporalType: "STATE_UPDATE", affectedFluent: {domain: "mood", value: "happy", isExclusive: true}
- "John picked up a sword" → temporalType: "INITIATES", affectedFluent: {domain: "inventory", value: "sword", isExclusive: false}

Important:
- Normalize subjects and values to lowercase
- Identify the semantic meaning, not specific words
- For STATE_UPDATE, the system will auto-terminate previous states in the same domain

Return only JSON:`;

    let response = await this.llm.complete(prompt);
    
    try {
      // Clean up response - remove markdown code blocks if present
      if (response.includes('```')) {
        // Extract JSON from markdown code block
        const match = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          response = match[1];
        }
      }
      
      // Also trim any leading/trailing whitespace
      response = response.trim();
      
      const structured = JSON.parse(response);
      return {
        ...structured,
        timestamp
      };
    } catch {
      // Fallback
      return {
        subject: 'unknown',
        verb: text,
        temporalType: 'HAPPENS',
        timestamp
      };
    }
  }

  /**
   * Generate Event Calculus facts for Prolog
   */
  generatePrologFacts(event: EventCalculusStructure, eventId: string): string[] {
    const facts: string[] = [];
    const timestamp = Date.parse(event.timestamp);
    
    // Basic event recording
    facts.push(`event_fact("${eventId}", "${event.subject}", "${event.verb}", "${event.object || 'nil'}").`);
    facts.push(`happens("${eventId}", ${timestamp}).`);
    
    // Fluent operations
    if (event.affectedFluent) {
      const { domain, value, isExclusive } = event.affectedFluent;
      const fluent = `${domain}("${event.subject}", "${value}")`;
      
      // Dynamic exclusive domain registration
      if (isExclusive && domain) {
        facts.push(`is_exclusive_domain(${domain}).`);
      }
      
      switch (event.temporalType) {
        case 'INITIATES':
          facts.push(`initiates("${eventId}", ${fluent}).`);
          break;
          
        case 'TERMINATES':
          facts.push(`terminates("${eventId}", ${fluent}).`);
          break;
          
        case 'STATE_UPDATE':
          // STATE_UPDATE is treated as INITIATES, exclusivity handled by Prolog rules
          facts.push(`initiates("${eventId}", ${fluent}).`);
          break;
          
        case 'HAPPENS':
          // Point events have no state change
          break;
      }
    }
    
    return facts;
  }

  /**
   * Generate current state for Prolog queries
   */
  generateStateQuery(subject: string, domain: string, time?: number): string {
    const t = time || Date.now();
    return `holds_at(${domain}("${subject.toLowerCase()}", Value), ${t})`;
  }

  /**
   * Query to get all states at a specific time
   */
  generateSnapshotQuery(subject: string, time?: number): string {
    const t = time || Date.now();
    return `findall([Domain, Value], holds_at(Domain("${subject.toLowerCase()}", Value), ${t}), States)`;
  }
}