/**
 * Query Refinement Layer - Fully Schemaless Version
 * 
 * Uses LLM to dynamically understand and refine queries in any language
 * without hardcoded patterns or schemas
 */

import type { UnifiedLLMProvider } from '../providers/llm-provider.js';

export interface RefinedQuery {
  original: string;
  language: string;
  refined: string;
  entities?: string[];
  temporal?: string;
  intent?: string;
  metadata?: unknown;
}

export class QueryRefinementLayer {
  private cache = new Map<string, RefinedQuery>();
  private llm?: UnifiedLLMProvider;
  constructor(llm?: UnifiedLLMProvider) { this.llm = llm; }
  
  /**
   * Refine any query to standardized structure using LLM
   * Completely schemaless - learns from context
   */
  async refine(text: string): Promise<RefinedQuery> {
    // Check cache
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }
    
    // If no LLM, return as-is
    if (!this.llm) {
      return {
        original: text,
        language: 'unknown',
        refined: text
      };
    }
    
    // Use LLM to understand and refine the query
    const prompt = `
You are a multilingual query refinement system. Your task is to understand queries in ANY language about ANY topic and convert them to a standardized English structure.

Input: "${text}"

Instructions:
1. Detect the language (could be any language: Japanese, English, Spanish, Swahili, etc.)
2. Understand the semantic meaning without assuming any schema
3. Extract key information:
   - Who/what is involved (entities)
   - What action/state is being described (verbs/states)
   - When it happened (temporal information)
   - Any additional context
4. Create a refined English version that preserves ALL semantic meaning
5. Do NOT assume any specific domain (could be about people, projects, games, cooking, anything)

Important:
- Translate everything to English for unified processing
- For well-known entities (e.g., Pikachu), use the commonly accepted English name
- For unknown entities, transliterate or keep as-is with English explanation
- Translate all objects, skills, items, etc. to English
- Use consistent terminology - always use the same English term for the same concept:
  - CEO, Chief Executive Officer, 最高経営責任者 → "CEO"
  - CTO, Chief Technology Officer, 最高技術責任者 → "CTO"
  - manager, マネージャー → "manager"
  - 10万ボルト, サンダーボルト → "Thunderbolt"
- Example: "ピカチュウが10万ボルトを覚えた" → "Pikachu learned Thunderbolt"
- Example: "田中さんがマネージャーになった" → "Tanaka became manager"
- Example: "Alice became Chief Executive Officer" → "Alice became CEO"
- IMPORTANT: Do NOT add articles (a, an, the) that weren't in the original
- Preserve temporal expressions but convert to English
- This is SCHEMALESS - don't assume roles, positions, or any fixed structure

Return JSON:
{
  "original": "original text",
  "language": "detected language code or name",
  "refined": "refined English query preserving all meaning",
  "entities": ["extracted entities if any"],
  "temporal": "time reference if any",
  "intent": "what the query is asking for",
  "metadata": { any additional context }
}

Return ONLY the JSON, no explanation.`;

    try {
      let response = await this.llm.complete(prompt);
      
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
      
      const refined = JSON.parse(response);
      
      // Cache the result
      this.cache.set(text, refined);
      
      return refined;
    } catch {
      // Refinement failed, use fallback
      
      // Fallback: return original with basic structure
      const fallback: RefinedQuery = {
        original: text,
        language: this.detectBasicLanguage(text),
        refined: text
      };
      
      this.cache.set(text, fallback);
      return fallback;
    }
  }
  
  /**
   * Basic language detection as fallback
   * (not comprehensive, just a helper)
   */
  private detectBasicLanguage(text: string): string {
    // This is just a fallback - the LLM does the real detection
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
      return 'ja';
    }
    if (/[а-яА-Я]/.test(text)) {
      return 'ru';
    }
    if (/[א-ת]/.test(text)) {
      return 'he';
    }
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'ar';
    }
    return 'unknown';
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache size (for monitoring)
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}