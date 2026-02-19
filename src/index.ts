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
  [key: string]: unknown;
}

export interface WhenMEngine {
  remember(event: string, metadata?: EventMetadata): Promise<void>;
  query(question: string): Promise<unknown>;
  getEvents(options?: { limit?: number; since?: Date; until?: Date }): Promise<unknown[]>;
  reset(): Promise<void>;

  // Extended methods for advanced use
  loadFacts?(facts: string): Promise<void>;
  assertEvent?(event: string, date?: string): Promise<void>;
  allEvents?(): Promise<unknown[]>;
  allHolding?(): Promise<unknown[]>;
}

export interface WhenMEngineOptions {
  debug?: boolean;
  persistence?: unknown;
  useUnixTime?: boolean;
}

// Main API
export { WhenM, default } from "./whenm.js";
export { whenm } from "./whenm-factory.js";

// Removed deprecated query builders and natural language APIs

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
} from './core/engine-factory.js';

// Utilities
export { normalizeDate, toUnixTime, parseDuration } from "./utils/utils.js";
// Trealla Prolog is used internally

// Error handling
export class WhenMError extends Error {
  public readonly code: WhenMErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: WhenMErrorCode,
    details?: unknown
  ) {
    super(message);
    this.name = "WhenMError";
    this.code = code;
    this.details = details;
  }
}

export type WhenMErrorCode =
  | "ENGINE_INIT_FAILED"
  | "QUERY_FAILED"
  | "PERSISTENCE_ERROR"
  | "LLM_ERROR"
  | "PARSE_ERROR";
