/**
 * WhenM Factory Methods
 *
 * Convenient shortcuts and factory functions for creating WhenM instances
 */

import { WhenM } from './whenm.js';

/**
 * Convenient shortcuts for quick WhenM instance creation
 */
export const whenm = {
  /**
   * Quick Cloudflare Workers AI setup
   * @example
   * const memory = await whenm.cloudflare('account-id', 'api-key', 'email@example.com');
   */
  cloudflare: async (
    accountId: string,
    apiKey: string,
    email: string,
    options?: Record<string, unknown>
  ) => WhenM.cloudflare({ accountId, apiKey, email, ...options }),

  /**
   * Quick Groq setup
   * @example
   * const memory = await whenm.groq(process.env.GROQ_API_KEY);
   */
  groq: async (apiKey: string, options?: Record<string, unknown>) =>
    WhenM.groq(apiKey, options?.model as string | undefined),

  /**
   * Quick Gemini setup
   * @example
   * const memory = await whenm.gemini(process.env.GEMINI_API_KEY);
   */
  gemini: async (apiKey: string, options?: Record<string, unknown>) =>
    WhenM.gemini(apiKey, options?.model as string | undefined),

  /**
   * Auto-detect provider from environment variables
   * @example
   * const memory = await whenm.auto();
   */
  auto: async (options?: Record<string, unknown>) =>
    WhenM.auto(options as Parameters<typeof WhenM.auto>[0])
};
