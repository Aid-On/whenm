/**
 * Shared configuration for benchmark scripts
 *
 * All API keys must be provided via environment variables.
 * Never commit hardcoded credentials!
 *
 * Create a .env file in the eclogic package root:
 * ```
 * CLOUDFLARE_ACCOUNT_ID=your_account_id
 * CLOUDFLARE_API_KEY=your_api_key
 * CLOUDFLARE_EMAIL=your_email
 * ```
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

// Load .env from package root
const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

export interface CloudflareConfig {
  accountId: string;
  apiKey: string;
  email: string;
}

export function getCloudflareConfig(): CloudflareConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const email = process.env.CLOUDFLARE_EMAIL;

  if (!accountId || !apiKey || !email) {
    console.error("Missing required environment variables:");
    if (!accountId) console.error("  - CLOUDFLARE_ACCOUNT_ID");
    if (!apiKey) console.error("  - CLOUDFLARE_API_KEY");
    if (!email) console.error("  - CLOUDFLARE_EMAIL");
    console.error("\nSet these environment variables before running the script.");
    process.exit(1);
  }

  return { accountId, apiKey, email };
}

export function getCloudflareAIUrl(accountId: string, model: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
}

export function getCloudflareHeaders(config: CloudflareConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Auth-Email": config.email,
    "X-Auth-Key": config.apiKey,
  };
}
