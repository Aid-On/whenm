/**
 * LLM Provider for WhenM
 * 
 * Handles all LLM interactions for the temporal memory system
 */

import { generate } from '@aid-on/unillm';
import { NLPParser } from '../processors/nlp-parser.js';

/**
 * LLMプロバイダーインターフェース（拡張版）
 */
export interface UnifiedLLMProvider {
  /**
   * 自然言語から構造化イベント情報を抽出
   * 複合イベントの場合は配列を返す
   */
  parseEvent(text: string): Promise<{
    subject: string;
    verb: string;
    object?: string;
    context?: Record<string, any>;
  } | Array<{
    subject: string;
    verb: string;
    object?: string;
    context?: Record<string, any>;
  }>>;
  
  /**
   * 動詞から因果関係ルールを生成
   */
  generateRules(verb: string, context: string): Promise<{
    initiates?: Array<{ fluent: string; pattern?: string }>;
    terminates?: Array<{ fluent: string; pattern?: string }>;
    type: 'state_change' | 'instantaneous' | 'continuous';
  }>;
  
  /**
   * 質問を構造化クエリに変換
   */
  parseQuestion(question: string): Promise<{
    queryType: 'what' | 'when' | 'where' | 'who' | 'why' | 'how' | 'is';
    subject?: string;
    predicate?: string;
    object?: string;
    time?: string;
  }>;
  
  /**
   * 回答を自然言語で生成
   */
  formatResponse(data: any, question: string): Promise<string>;
  
  /**
   * Generic completion for advanced use
   */
  complete(prompt: string): Promise<string>;
}

/**
 * Unified configuration for LLM providers
 */
export interface UniLLMConfig {
  provider: 'cloudflare' | 'groq' | 'gemini' | 'mock';
  apiKey?: string;      // Universal API key field
  model?: string;        // Model name/ID
  accountId?: string;    // For Cloudflare (unified at top level)
  email?: string;        // For Cloudflare (unified at top level)
}

/**
 * UniLLM-based LLM Provider
 */
export class UniLLMProvider implements UnifiedLLMProvider {
  private model: any;
  private config: UniLLMConfig;
  
  constructor(config: UniLLMConfig | string) {
    // Support simple string constructor for quick setup
    if (typeof config === 'string') {
      // Format: "provider:api-key" or "provider:api-key:model"
      const [provider, apiKey, model] = config.split(':');
      this.config = {
        provider: provider as any,
        apiKey,
        model
      };
    } else {
      this.config = config;
    }
  }
  
  private async getModel() {
    if (this.model) return this.model;
    
    // Mock provider for testing
    if (this.config.provider === 'mock') {
      return {
        generate: async () => ({ text: '{"subject":"Alice","verb":"learned","object":"Python"}' })
      };
    }
    
    // Real provider model
    this.model = {
      provider: this.config.provider,
      config: this.config
    };
    
    return this.model;
  }
  
  async complete(prompt: string): Promise<string> {
    // Mock mode - return mock responses without calling API
    if (this.config.provider === 'mock') {
      // Return contextual mock responses based on prompt content
      if (prompt.includes('Extract structured event')) {
        return '{"subject":"Alice","verb":"learned","object":"Python"}';
      }
      if (prompt.includes('Generate rules')) {
        return '{"type":"state_change","initiates":[{"fluent":"learned_state"}]}';
      }
      if (prompt.includes('Parse this question')) {
        return '{"queryType":"what","subject":"Alice","predicate":"status"}';
      }
      if (prompt.includes('Format response')) {
        return 'Alice is currently in Tokyo.';
      }
      return '{"result":"mock"}';
    }
    
    // Import dynamically to avoid circular dependency
    const { generate } = await import('@aid-on/unillm');
    
    // Build unified credentials object
    const credentials: any = {};
    
    switch (this.config.provider) {
      case 'cloudflare':
        credentials.cloudflareAccountId = this.config.accountId;
        credentials.cloudflareEmail = this.config.email;
        credentials.cloudflareApiKey = this.config.apiKey;
        break;
      case 'groq':
        credentials.groqApiKey = this.config.apiKey;
        break;
      case 'gemini':
        credentials.geminiApiKey = this.config.apiKey;
        break;
    }
    
    // Unified model specification
    const modelSpec = `${this.config.provider}:${this.config.model || this.getDefaultModel()}`;
    
    const result = await generate(
      modelSpec as any,
      [{ role: 'user', content: prompt }],
      credentials
    );
    
    return result.text || '{}';
  }
  
  private getDefaultModel(): string {
    const defaults = {
      cloudflare: '@cf/openai/gpt-oss-120b',
      groq: 'llama-3.3-70b-versatile',
      gemini: 'gemini-pro',
      mock: 'mock'
    };
    return defaults[this.config.provider] || 'default';
  }
  
  async parseEvent(text: string): Promise<any> {
    // Ensure text is defined
    if (!text) {
      return {
        subject: 'unknown',
        verb: 'unknown',
        object: null
      };
    }
    
    // Mock mode for testing
    if (this.config.provider === 'mock') {
      // Simple generic event parsing without any hardcoded patterns
      const words = text.split(' ');
      return {
        subject: words[0],
        verb: words[1] || 'did',
        object: words.slice(2).join(' ') || undefined
      };
    }
    
    const prompt = `Extract structured event from this text. Return JSON.
Text: "${text}"

Rules:
1. The main person mentioned is always the subject
2. For "X had a child born" or "X に子供が生まれた", X is the subject, verb is "had_child", object is the child type
3. For marriage "X married Y" or "XがYと結婚した", X is subject, verb is "married", object is Y
4. Keep the main actor as subject throughout

Examples:
- "太郎に長男が生まれた" -> {"subject":"太郎","verb":"had_child","object":"son"}
- "太郎が花子と結婚した" -> {"subject":"太郎","verb":"married","object":"花子"}
- "Alice learned Python" -> {"subject":"Alice","verb":"learned","object":"Python"}

Extract and return JSON only:`;

    const response = await this.complete(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      // Fallback to simple parsing
      const words = text.split(' ');
      return {
        subject: words[0],
        verb: words[1] || 'did',
        object: words.slice(2).join(' ')
      };
    }
  }
  
  async generateRules(verb: string, context: string): Promise<any> {
    // Mock mode
    if (this.config.provider === 'mock') {
      // Return generic rule for testing - no hardcoded verbs
      return {
        type: 'instantaneous',
        initiates: [{ fluent: verb + '_state' }]
      };
    }
    
    const prompt = `Generate Event Calculus rules for verb "${verb}" in context: "${context}"
Return JSON with structure:
{
  "type": "state_change|instantaneous|continuous",
  "initiates": [{"fluent": "name", "pattern": "optional_pattern"}],
  "terminates": [{"fluent": "name", "pattern": "optional_pattern"}]
}`;

    const response = await this.complete(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        type: 'instantaneous',
        initiates: [{ fluent: verb + '_state' }]
      };
    }
  }
  
  async parseQuestion(question: string): Promise<any> {
    // Ensure question is defined
    if (!question) {
      return {
        queryType: 'what',
        subject: null,
        predicate: null
      };
    }
    
    // Mock mode - use NLPParser for better extraction
    if (this.config.provider === 'mock') {
      const queryType = NLPParser.detectQuestionType(question);
      const subject = NLPParser.extractQuestionSubject(question);
      const keywords = NLPParser.extractKeywords(question);
      
      // Extract predicate and object based on keywords
      let predicate = null;
      let object = null;
      
      const lower = question.toLowerCase();
      
      if (queryType === 'what') {
        if (lower.includes('position') || lower.includes('role')) {
          predicate = 'be';
          object = 'current position';
        }
      } else if (queryType === 'when') {
        // No hardcoded verb list - let LLM handle semantic understanding
        // Simply use first keyword as potential predicate
        if (keywords.length > 0) {
          predicate = keywords[0];
        }
        
        // Extract object after the verb
        if (predicate) {
          const afterVerb = question.match(new RegExp(`(?:${predicate}|${predicate}ed|${predicate}s)\\s+(.+?)(?:\\?|$)`, 'i'));
          if (afterVerb) {
            object = afterVerb[1].trim();
          }
        }
      }
      
      return {
        queryType: queryType as any,
        subject,
        predicate,
        object
      };
    }
    
    const prompt = `Parse this question into structured query. The question might be in any language.
"${question}"

Important:
- Identify the query type based on what the question is asking for
- Extract the MAIN person/entity being asked about as subject
- For "X's wife's name" questions, X is the subject, not "X's wife"
- For "太郎の妻" questions, subject is "太郎", we're asking about a relation

Examples:
- "What is Taro's wife's name?" -> {"queryType":"what","subject":"Taro","predicate":"married","object":null}
- "太郎の妻の名前は?" -> {"queryType":"what","subject":"太郎","predicate":"married","object":null}
- "How many children does Taro have?" -> {"queryType":"how","subject":"Taro","predicate":"have","object":"children"}

Return ONLY valid JSON:
{
  "queryType": "what|when|who|how|why|where|is",
  "subject": "main entity name or null",
  "predicate": "action/verb in base form or null",
  "object": "object or null",
  "time": "time reference or null"
}`;

    const response = await this.complete(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      // Better fallback based on question structure
      const lower = question.toLowerCase();
      const queryType = lower.startsWith('when') ? 'when' :
                       lower.startsWith('what') ? 'what' :
                       lower.startsWith('who') ? 'who' :
                       lower.startsWith('how') ? 'how' :
                       lower.startsWith('why') ? 'why' :
                       lower.startsWith('where') ? 'where' :
                       lower.includes('いつ') ? 'when' :  // Japanese "when"
                       lower.includes('何') ? 'what' :     // Japanese "what"  
                       lower.includes('誰') ? 'who' :      // Japanese "who"
                       'what';
      
      return {
        queryType,
        subject: null,
        predicate: null
      };
    }
  }
  
  async formatResponse(data: any, question: string): Promise<string> {
    if (this.config.provider === 'mock') {
      // Generate a meaningful response based on the data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return 'I don\'t have any information about that.';
      }
      
      // If data contains results, format them
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        if (first.verb === 'is' && first.object) {
          return `${first.subject} is ${first.object}.`;
        } else if (first.verb && first.object && first.date) {
          return `${first.subject} ${first.verb} ${first.object} on ${first.date}.`;
        } else if (first.verb && first.object) {
          return `${first.subject} ${first.verb} ${first.object}.`;
        }
      }
      
      // Default response
      return 'Alice learned Python';
    }
    
    const prompt = `You have this data to answer the question.
Question: "${question}"
Data: ${JSON.stringify(data)}

Instructions:
1. If asking for age and you have birth date, calculate age from the birth date
2. If asking for wife/spouse and you have "married" event, the object is the spouse name
3. If asking for number of children and you have birth events, count them
4. Answer in the same language as the question
5. Be specific and direct with the answer
6. For "during X period" questions, check temporal overlap:
   - Find the start and end dates of the period X
   - Find events that occurred within those dates
   - Example: "during SF stay" means between moving to SF and leaving SF
7. For "at the time of X" questions, find the state at that specific time:
   - Look for the most recent relevant event before or at time X
   - Example: "role when founded startup" means the role active when startup was founded

Examples:
- If data shows {subject: "Taro", verb: "born", date: "1990-05-15"} and question asks age in 2025, calculate: 2025 - 1990 = 35 years old
- If data shows {subject: "Taro", verb: "married", object: "Hanako"}, then Hanako is the wife
- If data has multiple events with "son born" or "daughter born", count them as children
- If asking "what happened during stay in X", find events between "moved to X" and "left X" dates
- If asking "what role when Y happened", find the most recent role change before Y's date

Answer:`;

    return await this.complete(prompt);
  }
}