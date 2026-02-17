/**
 * Query Intent Parser for Natural Language Processing
 * 
 * Parses natural language queries into structured intents
 */

import type { UnifiedLLMProvider } from '../providers/llm-provider.js';

export interface NaturalQueryIntent {
  action: 'query' | 'aggregate' | 'timeline' | 'compare' | 'search' | 'when';
  entities?: string[];
  timeframe?: {
    type: 'specific' | 'range' | 'relative' | 'comparison';
    from?: string;
    to?: string;
    point?: string;
    duration?: { amount: number; unit: string };
  };
  filters?: {
    verbs?: string[];
    objects?: string[];
    keywords?: string[];
  };
  aggregation?: 'count' | 'distinct' | 'first' | 'last' | 'exists';
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

/**
 * Parses natural language queries into structured intents
 */
export class QueryIntentParser {
  private llm: UnifiedLLMProvider;
  constructor(llm: UnifiedLLMProvider) { this.llm = llm; }

  /**
   * Parse natural language query using LLM
   */
  async parseIntent(query: string): Promise<NaturalQueryIntent> {
    // If LLM is available, use it for better parsing
    if (this.llm) {
      return this.parseWithLLM(query);
    }
    
    // Fallback to rule-based parsing
    return this.parseWithRules(query);
  }

  /**
   * Parse using LLM for better understanding
   */
  private async parseWithLLM(query: string): Promise<NaturalQueryIntent> {
    const prompt = `Parse this natural language query into a structured format:
"${query}"

Return a JSON object with:
{
  "action": "query|aggregate|timeline|compare|search|when",
  "entities": ["names of people/things mentioned"],
  "timeframe": {
    "type": "specific|range|relative",
    "from": "date if range",
    "to": "date if range", 
    "point": "date if specific",
    "duration": { "amount": number, "unit": "hours|days|weeks|months|years" }
  },
  "filters": {
    "verbs": ["action verbs mentioned"],
    "objects": ["objects/things mentioned"],
    "keywords": ["other important words"]
  },
  "aggregation": "count|distinct|first|last|exists",
  "orderBy": { "field": "time|subject", "direction": "asc|desc" },
  "limit": number
}`;

    // Use the complete method to parse intent
    const response = await this.llm.complete(prompt);

    try {
      // Parse the JSON response
      return JSON.parse(response);
    } catch {
      // Fallback to rule-based parsing if LLM fails
      return this.parseWithRules(query);
    }
  }

  /**
   * Rule-based parsing fallback
   */
  private parseWithRules(query: string): NaturalQueryIntent {
    const lowerQuery = query.toLowerCase();
    const action = this.detectAction(lowerQuery);
    const entities = this.extractEntities(query);
    const timeframe = this.extractTimeframe(lowerQuery);
    const keywords = this.extractKeywords(query);

    return {
      action,
      entities: entities.length > 0 ? entities : undefined,
      timeframe,
      filters: { keywords }
    };
  }

  private detectAction(lowerQuery: string): NaturalQueryIntent['action'] {
    if (lowerQuery.includes('when did')) return 'when';
    if (lowerQuery.includes('how many') || lowerQuery.includes('count')) return 'aggregate';
    if (lowerQuery.includes('timeline') || lowerQuery.includes('history')) return 'timeline';
    if (lowerQuery.includes('compare') || lowerQuery.includes('between')) return 'compare';
    if (lowerQuery.includes('search') || lowerQuery.includes('find')) return 'search';
    return 'query';
  }

  private extractEntities(query: string): string[] {
    const namePattern = /\b[A-Z][a-z]+\b/g;
    const questionWords = new Set(['What', 'When', 'Where', 'Who', 'Why', 'How']);
    const matches = query.match(namePattern);
    if (!matches) return [];
    return matches.filter(name => !questionWords.has(name));
  }

  private extractTimeframe(lowerQuery: string): NaturalQueryIntent['timeframe'] | undefined {
    const relative = this.extractRelativeTime(lowerQuery);
    if (relative) return relative;

    const range = this.extractRangeTime(lowerQuery);
    if (range) return range;

    return this.extractSpecificTime(lowerQuery);
  }

  private extractRelativeTime(lowerQuery: string): NaturalQueryIntent['timeframe'] | undefined {
    const match = lowerQuery.match(/(?:last|past)\s+(\d+)\s+(hour|day|week|month|year)s?/i);
    if (!match) return undefined;
    return { type: 'relative', duration: { amount: parseInt(match[1]), unit: match[2] + 's' } };
  }

  private extractRangeTime(lowerQuery: string): NaturalQueryIntent['timeframe'] | undefined {
    const match = lowerQuery.match(/between\s+(\S+)\s+and\s+(\S+)/i);
    if (!match) return undefined;
    return { type: 'range', from: match[1], to: match[2] };
  }

  private extractSpecificTime(lowerQuery: string): NaturalQueryIntent['timeframe'] | undefined {
    const patterns = [
      /(?:on|at)\s+(\d{4}-\d{2}-\d{2})/i,
      /(?:in|during)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i
    ];
    for (const pattern of patterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        return { type: 'specific', point: match[1] || `${match[1]} ${match[2]}` };
      }
    }
    return undefined;
  }

  /**
   * Extract keywords from natural language query
   */
  extractKeywords(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    
    // Common stopwords to filter out
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'shall', 'what',
      'who', 'when', 'where', 'why', 'how', 'which', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);
    
    // Split into words and filter
    const words = lowerQuery
      .split(/\s+/)
      .map(word => word.replace(/[.,!?;:'"]/g, ''))
      .filter(word => word.length > 2 && !stopwords.has(word));
    
    return words;
  }
}