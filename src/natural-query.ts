/**
 * Natural Language Query Interface for WhenM
 * 
 * Seamlessly convert natural language queries into structured queries
 * while maintaining the power of the modern query builder
 */

import { QueryBuilder } from './query-builder.js';
import type { WhenMEngine } from './index.js';
import type { UnifiedLLMProvider } from './llm-provider.js';
import { QueryIntentParser, type NaturalQueryIntent } from './query-intent-parser.js';
import { QueryHandlers } from './query-handlers.js';

// Re-export for convenience
export type { NaturalQueryIntent };

/**
 * Natural Language Query Processor
 * 
 * @example
 * ```typescript
 * // Simple natural language queries
 * await memory.nl("Show me what Alice did last month");
 * await memory.nl("How many times did Bob learn something new?");
 * await memory.nl("Compare Alice's state between January and December");
 * 
 * // Complex queries with context
 * await memory.nl("List all promotions in 2024 sorted by date");
 * await memory.nl("Who learned Python in the last 6 months?");
 * ```
 */
export class NaturalLanguageQuery {
  private parser: QueryIntentParser;
  private handlers: QueryHandlers;
  
  constructor(
    private engine: WhenMEngine,
    private llm: UnifiedLLMProvider
  ) {
    this.parser = new QueryIntentParser(llm);
    this.handlers = new QueryHandlers(engine);
  }

  /**
   * Process natural language query
   */
  async query(text: string): Promise<any> {
    // Check for special query types that need direct handling
    const lowerText = text.toLowerCase();
    
    // Direct question type handlers
    if (this.isDirectQuestion(lowerText)) {
      return this.handleDirectQuestion(text);
    }
    
    // Parse intent using LLM or rules
    const intent = await this.parser.parseIntent(text);
    
    // Route to appropriate handler based on intent action
    switch (intent.action) {
      case 'aggregate':
        return this.handlers.handleAggregateIntent(intent);
      case 'timeline':
        return this.handlers.handleTimelineIntent(intent);
      case 'when':
        return this.handlers.handleWhenIntent(intent);
      case 'search':
        return this.handlers.handleSearchIntent(intent);
      case 'compare':
        return this.handlers.handleCompareIntent(intent);
      default:
        return this.handlers.handleQueryIntent(intent);
    }
  }

  /**
   * Check if query is a direct question type
   */
  private isDirectQuestion(query: string): boolean {
    const patterns = [
      /^what\s+(?:did|has|have|does|is|are)/i,
      /^when\s+did/i,
      /^who\s+(?:has|have|is|are|did|does)/i,
      /^how\s+many/i,
      /^why\s+(?:did|has|have|does|is|are)/i,
      /^where\s+(?:did|has|have|does|is|are)/i
    ];
    
    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Handle direct question format (What, When, Who, How many, etc.)
   */
  private async handleDirectQuestion(query: string): Promise<any> {
    const lowerQuery = query.toLowerCase();
    
    // Parse question type
    const questionType = this.getQuestionType(lowerQuery);
    
    switch (questionType) {
      case 'WHAT':
        return this.handleWhatQuestion(query);
      case 'WHEN':
        return this.handleWhenQuestion(query);
      case 'WHO':
        return this.handleWhoQuestion(query);
      case 'HOW_MANY':
        return this.handleHowManyQuestion(query);
      default:
        // Fallback to intent parsing
        const intent = await this.parser.parseIntent(query);
        return this.handlers.handleQueryIntent(intent);
    }
  }

  /**
   * Get question type from query
   */
  private getQuestionType(query: string): string {
    if (query.startsWith('what')) return 'WHAT';
    if (query.startsWith('when')) return 'WHEN';
    if (query.startsWith('who')) return 'WHO';
    if (query.startsWith('how many')) return 'HOW_MANY';
    return 'UNKNOWN';
  }

  /**
   * Handle WHAT questions
   */
  private async handleWhatQuestion(query: string): Promise<any> {
    // Extract subject from question
    const subjectMatch = query.match(/what\s+(?:did|has|have|does)\s+(\w+)/i);
    if (!subjectMatch) return [];
    
    const subject = subjectMatch[1];
    
    // Check for specific actions
    const verbMatch = query.match(/(\w+ed|\w+ing)\b/gi);
    const verbs = verbMatch ? verbMatch.map(v => v.toLowerCase()) : [];
    
    // Get all events from engine
    const allEvents = await this.engine.getEvents();
    if (!allEvents) return [];
    
    // Filter by subject
    let results = allEvents.filter(e => 
      e.event && e.event.subject && 
      e.event.subject.toLowerCase() === subject.toLowerCase()
    );
    
    // Filter by verbs if specified
    if (verbs.length > 0) {
      results = results.filter(e => 
        e.event && e.event.verb && 
        verbs.some(v => e.event.verb.toLowerCase().includes(v.replace(/ed$|ing$/, '')))
      );
    }
    
    return results.map(r => ({
      subject: r.event.subject,
      verb: r.event.verb,
      object: r.event.object,
      time: r.date || r.timestamp
    }));
  }

  /**
   * Handle WHEN questions
   */
  private async handleWhenQuestion(query: string): Promise<any> {
    // Extract subject and action from question
    const match = query.match(/when\s+did\s+(\w+)\s+(.+?)(\?|$)/i);
    if (!match) return [];
    
    const subject = match[1];
    const action = match[2].trim().toLowerCase();
    
    // Parse the action to extract verb and object
    const actionParts = action.split(/\s+/);
    const verb = actionParts[0];
    const object = actionParts.slice(1).join(' ');
    
    // Get all events
    const allEvents = await this.engine.getEvents();
    if (!allEvents) return [];
    
    // Filter events
    const results = allEvents.filter(e => {
      if (!e.event) return false;
      
      const matchSubject = e.event.subject?.toLowerCase() === subject.toLowerCase();
      const matchVerb = e.event.verb?.toLowerCase().includes(verb);
      const matchObject = !object || 
        (e.event.object && e.event.object.toLowerCase().includes(object));
      
      return matchSubject && matchVerb && matchObject;
    });
    
    // Return times
    return results.map(r => ({
      event: `${r.event.subject} ${r.event.verb} ${r.event.object || ''}`.trim(),
      time: r.date || r.timestamp
    }));
  }

  /**
   * Handle WHO questions  
   */
  private async handleWhoQuestion(query: string): Promise<any> {
    const lowerQuery = query.toLowerCase();
    
    // Removed special handling - let LLM understand all patterns uniformly
    // No hardcoded patterns for 'joined as' or verb matching
    
    // Extract action from question
    const actionMatch = lowerQuery.match(/who\s+(?:has|have|is|are|did|does)?\s*(.+?)(\?|$)/);
    if (!actionMatch) return [];
    
    const action = actionMatch[1].trim();
    
    // Get all events
    const allEvents = await this.engine.getEvents();
    if (!allEvents) return [];
    
    // Parse action to find verb and object
    const actionParts = action.split(/\s+/);
    const verb = actionParts[0];
    const object = actionParts.slice(1).join(' ');
    
    // Filter events
    const results = allEvents.filter(e => {
      if (!e.event) return false;
      
      const eventStr = `${e.event.verb} ${e.event.object || ''}`.toLowerCase();
      
      // Check if event matches the action
      const matchVerb = e.event.verb?.toLowerCase().includes(verb);
      const matchObject = !object || eventStr.includes(object);
      
      return matchVerb && matchObject;
    });
    
    // Return unique subjects
    const subjects = [...new Set(results.map(r => r.event.subject))];
    return subjects;
  }

  /**
   * Handle HOW MANY questions
   */
  private async handleHowManyQuestion(query: string): Promise<any> {
    const lowerQuery = query.toLowerCase();
    
    // Extract what to count
    const match = lowerQuery.match(/how many\s+(.+?)(?:\s+(?:did|has|have|are|were))?\s*(.+?)(\?|$)/);
    if (!match) return { count: 0 };
    
    const target = match[1].trim(); // e.g., "people", "times", "events"
    const action = match[2]?.trim() || '';
    
    // Get all events
    const allEvents = await this.engine.getEvents();
    if (!allEvents) return { count: 0 };
    
    // Extract keywords from action - more generic approach
    const keywords = this.parser.extractKeywords(action);
    
    // Filter based on keywords using AND logic
    let results = allEvents;
    
    if (keywords.length > 0) {
      results = allEvents.filter(e => {
        if (!e.event) return false;
        const eventStr = `${e.event.subject} ${e.event.verb} ${e.event.object || ''}`.toLowerCase();
        
        // ALL keywords must match (AND logic)
        return keywords.every(keyword => eventStr.includes(keyword));
      });
    }
    
    // Count based on target type
    if (target.includes('people') || target.includes('person')) {
      // Count unique subjects
      const uniqueSubjects = new Set(results.map(r => r.event?.subject).filter(Boolean));
      return { count: uniqueSubjects.size, subjects: Array.from(uniqueSubjects) };
    } else if (target.includes('time')) {
      // Count occurrences
      return { count: results.length };
    } else {
      // Default count
      return { count: results.length };
    }
  }

  /**
   * Process multiple queries in sequence
   */
  async processMultiple(queries: string[]): Promise<any[]> {
    const results = [];
    for (const query of queries) {
      results.push(await this.query(query));
    }
    return results;
  }

  /**
   * Get suggested queries based on current data
   */
  async getSuggestions(): Promise<string[]> {
    const events = await this.engine.getEvents();
    if (!events || events.length === 0) {
      return [
        "What events happened today?",
        "Show me the timeline",
        "Who did what recently?"
      ];
    }

    // Extract unique subjects and verbs
    const subjects = new Set<string>();
    const verbs = new Set<string>();
    
    events.forEach((e: any) => {
      if (e.event?.subject) subjects.add(e.event.subject);
      if (e.event?.verb) verbs.add(e.event.verb);
    });

    const suggestions: string[] = [];
    
    // Generate suggestions based on data
    if (subjects.size > 0) {
      const firstSubject = Array.from(subjects)[0];
      suggestions.push(`What did ${firstSubject} do?`);
      suggestions.push(`Show me ${firstSubject}'s timeline`);
    }
    
    if (verbs.size > 0) {
      const firstVerb = Array.from(verbs)[0];
      suggestions.push(`Who ${firstVerb} recently?`);
      suggestions.push(`How many people ${firstVerb}?`);
    }

    suggestions.push("Show me events from last week");
    suggestions.push("Compare this month with last month");

    return suggestions.slice(0, 5);
  }
}

/**
 * Chainable Natural Language Query Interface
 * 
 * Provides a fluent interface for natural language queries
 */
export class NaturalLanguageQueryChain {
  private queries: string[] = [];
  private results: any[] = [];
  
  constructor(
    private processor: NaturalLanguageQuery,
    initialQuery?: string
  ) {
    if (initialQuery) {
      this.queries.push(initialQuery);
    }
  }

  /**
   * Add another query to the chain
   */
  and(query: string): this {
    this.queries.push(query);
    return this;
  }

  /**
   * Filter results by a condition
   */
  where(condition: string): this {
    this.queries.push(`Filter where ${condition}`);
    return this;
  }

  /**
   * Sort results
   */
  sortBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.queries.push(`Sort by ${field} ${direction}`);
    return this;
  }

  /**
   * Limit results
   */
  take(n: number): this {
    this.queries.push(`Take first ${n}`);
    return this;
  }

  /**
   * Execute all queries in the chain
   */
  async execute(): Promise<any[]> {
    this.results = await this.processor.processMultiple(this.queries);
    return this.results;
  }

  /**
   * Get the last result
   */
  getLastResult(): any {
    return this.results[this.results.length - 1];
  }

  /**
   * Get all results
   */
  getAllResults(): any[] {
    return this.results;
  }
}

/**
 * Create a natural language query processor
 */
export function createNaturalQuery(
  engine: WhenMEngine,
  llm: UnifiedLLMProvider
): NaturalLanguageQuery {
  return new NaturalLanguageQuery(engine, llm);
}

/**
 * Create a chainable natural language query
 */
export function createNaturalQueryChain(
  processor: NaturalLanguageQuery,
  initialQuery?: string
): NaturalLanguageQueryChain {
  return new NaturalLanguageQueryChain(processor, initialQuery);
}