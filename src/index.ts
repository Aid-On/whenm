/**
 * @aid-on/whenm - Temporal Memory for AI
 * 
 * A schemaless, LLM-powered temporal memory system built on Event Calculus
 */

// Core types and interfaces
export interface EventMetadata {
  id?: string;
  timestamp?: number;
  location?: string;
  confidence?: number;
  source?: string;
  tags?: string[];
  [key: string]: any;
}

export interface WhenMEngine {
  remember(event: string, metadata?: EventMetadata): Promise<void>;
  query(question: string): Promise<any>;
  getEvents(options?: { limit?: number; since?: Date; until?: Date }): Promise<any[]>;
  reset(): Promise<void>;
  
  // Extended methods for advanced use
  loadFacts?(facts: string): Promise<void>;
  assertEvent?(event: string, date?: string): Promise<void>;
  allEvents?(): Promise<any[]>;
  allHolding?(): Promise<any[]>;
}

export interface WhenMEngineOptions {
  debug?: boolean;
  persistence?: any;
  useUnixTime?: boolean;
}

// Main API
export { WhenM, whenm, default } from "./whenm.js";

// Query builders  
export { 
  QueryBuilder, 
  Timeline, 
  createQueryBuilder, 
  createTimeline 
} from "./query-builder.js";

// Natural language
export { 
  NaturalLanguageQuery,
  NaturalLanguageQueryChain 
} from "./natural-query.js";

// Engines
export {
  UnifiedSchemalessEngine,
  UniLLMProvider,
  createUnifiedEngine,
  createGroqEngine,
  createGeminiEngine,
  createCloudflareEngine,
  createMockEngine,
  type UnifiedLLMProvider,
  type UniLLMConfig,
  type CreateEngineOptions
} from './final-engine.js';

// Utilities
export { normalizeDate, toUnixTime, parseDuration } from "./utils.js";

// NLP Parser (for advanced use)
export { NLPParser } from "./nlp-parser.js";

// Prolog utilities
export { PrologParser } from "./prolog-parser.js";
export { load as loadTrealla, Prolog } from "trealla";

// Error handling
export class WhenMError extends Error {
  constructor(
    message: string,
    public code: WhenMErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = "WhenMError";
  }
}

export type WhenMErrorCode =
  | "ENGINE_INIT_FAILED"
  | "QUERY_FAILED"
  | "PERSISTENCE_ERROR"
  | "LLM_ERROR"
  | "PARSE_ERROR";