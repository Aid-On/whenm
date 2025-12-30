/**
 * Demo: Natural Language Memory API
 *
 * Two ways to record events:
 * 1. record() - structured format: "subject verb object"
 * 2. parse() - free-form natural language (Japanese, English, etc.)
 */

import {
  createEngine,
  createMemory,
  createCloudflareInfer,
  createCloudflareParse,
} from "../src/index.js";
import { callCloudflareRest, getCredentialsFromEnv } from "@aid-on/unilmp";
import { config } from "dotenv";

config({ path: "../../.env" });

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     Natural Language Memory Demo                              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Setup
  const currentDate = "2025-01-15";
  const ec = await createEngine({ currentDate });
  const credentials = getCredentialsFromEnv();
  const llmInfer = createCloudflareInfer(callCloudflareRest, credentials);
  const llmParse = createCloudflareParse(callCloudflareRest, credentials);
  const memory = createMemory(ec, { llmInfer, llmParse, currentDate, debug: true });

  // =========================================================================
  // Part 1: Structured format (record)
  // =========================================================================
  console.log("━".repeat(60));
  console.log("📝 Part 1: record() - Structured format\n");

  await memory.record("user learned Python", "2024-01-15");
  await memory.record("user joined chess_club", "2024-02-01");

  // =========================================================================
  // Part 2: Free-form natural language (parse)
  // =========================================================================
  console.log("\n" + "━".repeat(60));
  console.log("🌐 Part 2: parse() - Free-form natural language\n");

  const naturalTexts = [
    "去年の6月にエンジニアになった",
    "I quit the chess club last December",
    "先月AWSの資格を取得した",
  ];

  for (const text of naturalTexts) {
    console.log(`\n   Input: "${text}"`);
    try {
      const events = await memory.parse(text);
      console.log(`   Parsed ${events.length} event(s)`);
      for (const e of events) {
        console.log(`     → ${e.verb}(${e.subject}, ${e.object || ""}) @ ${e.date}`);
      }
    } catch (e) {
      console.log(`   ✗ Error: ${e}`);
    }
  }

  // =========================================================================
  // Query results
  // =========================================================================
  console.log("\n" + "═".repeat(60));
  console.log("📊 What holds now:\n");

  const queries = [
    { desc: "Skills", q: 'holds_now(knows("user", X))' },
    { desc: "Groups", q: 'holds_now(member_of("user", X))' },
    { desc: "Role", q: 'holds_now(role("user", X))' },
    { desc: "Has", q: 'holds_now(has("user", X))' },
  ];

  for (const { desc, q } of queries) {
    const result = await ec.query(q);
    const values = [...new Set(result.map((r: Record<string, unknown>) => r.X))];
    console.log(`   ${desc}: ${values.length > 0 ? values.join(", ") : "(none)"}`);
  }

  console.log("\n✅ Done");
}

main().catch(console.error);
