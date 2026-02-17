/**
 * LLM Provider for WhenM
 *
 * Handles all LLM interactions for the temporal memory system
 */

import {
  mockComplete,
  mockParseEvent,
  mockGenerateRules,
  mockParseQuestion,
  mockFormatResponse,
  fallbackParseQuestion
} from './mock-llm-provider.js';

interface ParsedEvent {
  subject: string;
  verb: string;
  object?: string;
  context?: Record<string, unknown>;
}

interface GeneratedRules {
  initiates?: Array<{ fluent: string; pattern?: string }>;
  terminates?: Array<{ fluent: string; pattern?: string }>;
  type: 'state_change' | 'instantaneous' | 'continuous';
}

interface ParsedQuestion {
  queryType: 'what' | 'when' | 'where' | 'who' | 'why' | 'how' | 'is';
  subject?: string;
  predicate?: string;
  object?: string;
  time?: string;
}

/**
 * LLM provider interface (extended)
 */
export interface UnifiedLLMProvider {
  parseEvent(text: string): Promise<ParsedEvent | ParsedEvent[]>;
  generateRules(verb: string, context: string): Promise<GeneratedRules>;
  parseQuestion(question: string): Promise<ParsedQuestion>;
  formatResponse(data: unknown, question: string): Promise<string>;
  complete(prompt: string): Promise<string>;
}

/**
 * Unified configuration for LLM providers
 */
export interface UniLLMConfig {
  provider: 'cloudflare' | 'groq' | 'gemini' | 'mock';
  apiKey?: string;
  model?: string;
  accountId?: string;
  email?: string;
}

/**
 * UniLLM-based LLM Provider
 */
export class UniLLMProvider implements UnifiedLLMProvider {
  private model: unknown;
  private config: UniLLMConfig;

  constructor(config: UniLLMConfig | string) {
    if (typeof config === 'string') {
      const [provider, apiKey, model] = config.split(':');
      this.config = {
        provider: provider as UniLLMConfig['provider'],
        apiKey,
        model
      };
    } else {
      this.config = config;
    }
  }

  private async getModel(): Promise<unknown> {
    if (this.model) return this.model;

    if (this.config.provider === 'mock') {
      return { generate: async () => ({ text: '{"subject":"Alice","verb":"learned","object":"Python"}' }) };
    }

    this.model = { provider: this.config.provider, config: this.config };
    return this.model;
  }

  async complete(prompt: string): Promise<string> {
    if (this.config.provider === 'mock') {
      return mockComplete(prompt);
    }

    const { generate } = await import('@aid-on/unillm');
    const credentials = this.buildCredentials();
    const modelSpec = `${this.config.provider}:${this.config.model || this.getDefaultModel()}`;

    const result = await generate(
      modelSpec as Parameters<typeof generate>[0],
      [{ role: 'user', content: prompt }],
      credentials
    );

    return result.text || '{}';
  }

  private buildCredentials(): Record<string, string> {
    const credentials: Record<string, string> = {};

    switch (this.config.provider) {
      case 'cloudflare':
        if (this.config.accountId) credentials.cloudflareAccountId = this.config.accountId;
        if (this.config.email) credentials.cloudflareEmail = this.config.email;
        if (this.config.apiKey) credentials.cloudflareApiKey = this.config.apiKey;
        break;
      case 'groq':
        if (this.config.apiKey) credentials.groqApiKey = this.config.apiKey;
        break;
      case 'gemini':
        if (this.config.apiKey) credentials.geminiApiKey = this.config.apiKey;
        break;
    }

    return credentials;
  }

  private getDefaultModel(): string {
    const defaults: Record<string, string> = {
      cloudflare: '@cf/openai/gpt-oss-120b',
      groq: 'llama-3.3-70b-versatile',
      gemini: 'gemini-pro',
      mock: 'mock'
    };
    return defaults[this.config.provider] || 'default';
  }

  async parseEvent(text: string): Promise<ParsedEvent | ParsedEvent[]> {
    if (!text) {
      return { subject: 'unknown', verb: 'unknown', object: undefined };
    }

    if (this.config.provider === 'mock') {
      return mockParseEvent(text);
    }

    const prompt = this.buildParseEventPrompt(text);
    const response = await this.complete(prompt);

    try {
      return JSON.parse(response);
    } catch {
      const words = text.split(' ');
      return { subject: words[0], verb: words[1] || 'did', object: words.slice(2).join(' ') };
    }
  }

  private buildParseEventPrompt(text: string): string {
    return `Extract structured event from this text. Return JSON.
Text: "${text}"

Rules:
1. The main person mentioned is always the subject
2. For "X had a child born" or "X \u306B\u5B50\u4F9B\u304C\u751F\u307E\u308C\u305F", X is the subject, verb is "had_child", object is the child type
3. For marriage "X married Y" or "X\u304CY\u3068\u7D50\u5A5A\u3057\u305F", X is subject, verb is "married", object is Y
4. Keep the main actor as subject throughout

Extract and return JSON only:`;
  }

  async generateRules(verb: string, context: string): Promise<GeneratedRules> {
    if (this.config.provider === 'mock') {
      return mockGenerateRules(verb);
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
      return { type: 'instantaneous', initiates: [{ fluent: verb + '_state' }] };
    }
  }

  async parseQuestion(question: string): Promise<ParsedQuestion> {
    if (!question) {
      return { queryType: 'what', subject: undefined, predicate: undefined };
    }

    if (this.config.provider === 'mock') {
      const result = mockParseQuestion(question);
      return result as ParsedQuestion;
    }

    const prompt = this.buildParseQuestionPrompt(question);
    const response = await this.complete(prompt);

    try {
      return JSON.parse(response);
    } catch {
      return fallbackParseQuestion(question) as ParsedQuestion;
    }
  }

  private buildParseQuestionPrompt(question: string): string {
    return `Parse this question into structured query. The question might be in any language.
"${question}"

Important:
- Identify the query type based on what the question is asking for
- Extract the MAIN person/entity being asked about as subject

Return ONLY valid JSON:
{
  "queryType": "what|when|who|how|why|where|is",
  "subject": "main entity name or null",
  "predicate": "action/verb in base form or null",
  "object": "object or null",
  "time": "time reference or null"
}`;
  }

  async formatResponse(data: unknown, question: string): Promise<string> {
    if (this.config.provider === 'mock') {
      return mockFormatResponse(data, question);
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

Answer:`;

    return this.complete(prompt);
  }
}
