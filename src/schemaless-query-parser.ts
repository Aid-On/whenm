/**
 * Schemaless Query Parser
 * LLM determines domains dynamically without hardcoding
 */

import type { UnifiedLLMProvider } from './llm-provider.js';

export type TemporalScope = 'CURRENT' | 'PAST' | 'FUTURE' | 'SPECIFIC_TIME' | 'RANGE';

export interface SchemalessQuery {
  subject?: string;
  targetDomain?: string;  // Dynamically determined: location, role, mood, inventory, etc.
  temporalScope: TemporalScope;
  specificTime?: string;
  queryType?: string;
  rawQuestion: string;
}

export class SchemalessQueryParser {
  constructor(private llm: UnifiedLLMProvider) {}

  /**
   * Parse question to extract domain and temporal scope dynamically
   */
  async parseQueryDynamic(question: string): Promise<SchemalessQuery> {
    const prompt = `
You are a semantic parser. Analyze the user's question to identify:
1. subject: The entity being asked about (person, thing, etc.)
2. targetDomain: The attribute/property being queried (normalized atom name)
3. temporalScope: When the question refers to

IMPORTANT: For targetDomain, use lowercase singular nouns that represent states/properties.

Examples:
Q: "Where does John live?" → subject: "john", targetDomain: "location", temporalScope: "CURRENT"
Q: "What is his current role?" → subject: null, targetDomain: "role", temporalScope: "CURRENT"
Q: "太郎の趣味は何ですか？" → subject: "taro", targetDomain: "hobby", temporalScope: "CURRENT"
Q: "What was her job in 2015?" → subject: null, targetDomain: "role", temporalScope: "SPECIFIC_TIME", specificTime: "2015"
Q: "Is he married?" → subject: null, targetDomain: "marital_status", temporalScope: "CURRENT"
Q: "What car does she drive?" → subject: null, targetDomain: "vehicle", temporalScope: "CURRENT"
Q: "How is his mood today?" → subject: null, targetDomain: "mood", temporalScope: "CURRENT"
Q: "What devices does he own?" → subject: null, targetDomain: "inventory", temporalScope: "CURRENT"
Q: "Where was he born?" → subject: null, targetDomain: "birthplace", temporalScope: "PAST"
Q: "What skills has she learned?" → subject: null, targetDomain: "skill", temporalScope: "CURRENT"
Q: "Who are his friends?" → subject: null, targetDomain: "relationship", temporalScope: "CURRENT"

Domain mapping hints (but discover new ones as needed):
- Location questions → "location"
- Job/position/role → "role"
- Hobbies/interests → "hobby"
- Skills/knowledge → "skill"
- Ownership/possessions → "inventory"
- Relationships → "relationship"
- Employment → "employment"
- Education → "education"
- Mood/feeling → "mood"
- Health → "health"
- Birth-related → "birthplace" (special case, always PAST)

Temporal scope:
- CURRENT: asking about now/present
- PAST: asking about before/history
- SPECIFIC_TIME: asking about a specific date/year
- RANGE: asking about a period
- FUTURE: asking about plans/predictions

Question: "${question}"

Return JSON only:`;

    const response = await this.llm.complete(prompt);
    
    try {
      const parsed = JSON.parse(response);
      return {
        ...parsed,
        rawQuestion: question
      };
    } catch (e) {
      // Fallback for parse errors
      return {
        temporalScope: 'CURRENT',
        rawQuestion: question
      };
    }
  }

  /**
   * Generate natural language response from facts
   */
  async formatFactAsResponse(
    question: string,
    domain: string,
    subject: string,
    values: string[]
  ): Promise<string> {
    if (values.length === 0) {
      return `No ${domain} information found for ${subject}.`;
    }

    const factStr = values.length === 1 
      ? `Current ${domain} of ${subject}: ${values[0]}`
      : `Current ${domain}s of ${subject}: ${values.join(', ')}`;

    const prompt = `
Given this fact, answer the user's question naturally in the same language.
Fact: ${factStr}
Question: ${question}
Answer (concise and natural):`;

    return this.llm.complete(prompt);
  }
}