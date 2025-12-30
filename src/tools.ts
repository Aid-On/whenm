/**
 * LLM Tools for Event Calculus
 *
 * Tool definitions for LLM to interact with the Prolog knowledge base.
 * Compatible with OpenAI/Groq function calling format.
 */

import type { WhenMEngine } from "./index.js";

// =============================================================================
// Tool Definitions (OpenAI/Groq format)
// =============================================================================

export const WHENM_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "memory_assert",
      description: `Assert a new fact about the user into the knowledge base.
Use Event Calculus events to record facts that may change over time.

Common event types:
- got_job(user, "職業") - User started a job
- quit_job(user, "職業") - User quit a job
- moved_to(user, "場所") - User moved to a location
- met(user, "人名") - User met someone
- married(user, "配偶者") - User got married
- divorced(user, "配偶者") - User got divorced
- started_liking(user, "物事") - User started liking something
- stopped_liking(user, "物事") - User stopped liking something
- started_hobby(user, "趣味") - User started a hobby
- quit_hobby(user, "趣味") - User quit a hobby
- set_name(user, "名前") - Set user's name
- set_age(user, 年齢) - Set user's age

Example: memory_assert("got_job(user, \\"プログラマー\\")", "2020-01-15")`,
      parameters: {
        type: "object",
        properties: {
          event: {
            type: "string",
            description: "Prolog event term (e.g., 'got_job(user, \"プログラマー\")')",
          },
          date: {
            type: "string",
            description: "ISO date when this happened (YYYY-MM-DD). Use today's date if not specified.",
          },
        },
        required: ["event", "date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "memory_query",
      description: `Query the user's knowledge base to retrieve facts.

Common query patterns:
- holds_at(job(user, X), "2024-01-01") - What was user's job on this date?
- holds_at(lives_in(user, X), "2024-01-01") - Where did user live on this date?
- holds_at(likes(user, X), "2024-01-01") - What did user like on this date?
- holds_now(job(user, X)) - What is user's current job?
- holds_now(lives_in(user, X)) - Where does user currently live?

Returns variable bindings as JSON.`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Prolog query (e.g., 'holds_now(job(user, X))')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "memory_list",
      description: "List all facts currently known about the user. Returns all events and what currently holds.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
] as const;

// =============================================================================
// Tool Types
// =============================================================================

export type MemoryAssertArgs = {
  event: string;
  date: string;
};

export type MemoryQueryArgs = {
  query: string;
};

export type MemoryListArgs = Record<string, never>;

export type WhenMToolCall =
  | { name: "memory_assert"; args: MemoryAssertArgs }
  | { name: "memory_query"; args: MemoryQueryArgs }
  | { name: "memory_list"; args: MemoryListArgs };

// =============================================================================
// Tool Executor
// =============================================================================

export interface WhenMToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Execute an EC tool call
 */
export async function executeWhenMTool(
  ec: WhenMEngine,
  toolName: string,
  args: Record<string, unknown>
): Promise<WhenMToolResult> {
  try {
    switch (toolName) {
      case "memory_assert": {
        const { event, date } = args as MemoryAssertArgs;
        if (ec.assertEvent) {
          await ec.assertEvent(event, date);
        }
        return {
          success: true,
          data: { message: `Asserted: happens(${event}, "${date}")` },
        };
      }

      case "memory_query": {
        const { query } = args as MemoryQueryArgs;
        const results = await ec.query(query);
        return {
          success: true,
          data: {
            results,
            count: results.length,
            query,
          },
        };
      }

      case "memory_list": {
        const events = ec.allEvents ? await ec.allEvents() : [];
        const holding = ec.allHolding ? await ec.allHolding() : [];
        return {
          success: true,
          data: {
            events,
            currentlyHolding: holding,
          },
        };
      }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// System Prompt for LLM
// =============================================================================

export const WHENM_SYSTEM_PROMPT = `You have access to a temporal knowledge base using Event Calculus.

## CRITICAL: Event vs Fluent
- **Events** = things that HAPPEN: got_job, moved_to, met, started_hobby, married
- **Fluents** = states that HOLD: job, lives_in, knows, hobby, married_to, has_pet, likes

## Basic Query Patterns
| Question | Query |
|----------|-------|
| 今の職業は？ | holds_now(job(user, X)) |
| 2020年どこに住んでた？ | holds_at(lives_in(user, X), "2020-01-01") |
| 誰を知ってる？ | holds_now(knows(user, X)) |
| 趣味は？ | holds_now(hobby(user, X)) |
| 結婚してる？ | holds_now(married_to(user, X)) |
| ペット飼ってる？ | holds_now(has_pet(user, Pet, Name)) |
| コーヒー好き？ | holds_now(likes(user, "コーヒー")) |

## COMPOUND QUERIES (for "when X happened" questions)
IMPORTANT: happens() MUST come FIRST to bind the date variable!

| Question | Query (happens FIRST!) |
|----------|------------------------|
| 結婚した時の職業は？ | happens(married(user, _), D), holds_at(job(user, X), D) |
| CTOになった時の住所は？ | happens(got_job(user, "CTO"), D), holds_at(lives_in(user, X), D) |
| 宮崎引っ越し時の趣味は？ | happens(moved_to(user, "宮崎"), D), holds_at(hobby(user, X), D) |

WRONG: holds_at(job(user, X), D), happens(married(user, _), D)  ← D is unbound!
RIGHT: happens(married(user, _), D), holds_at(job(user, X), D)  ← D is bound first!

## EVENT DATE COMPARISON
To compare when two events happened:

| Question | Query |
|----------|-------|
| サーフィンは宮崎引っ越し前？ | happens(started_hobby(user, "サーフィン"), D1), happens(moved_to(user, "宮崎"), D2), D1 @< D2 |
| 結婚は東京引っ越し後？ | happens(married(user, _), D1), happens(moved_to(user, "東京"), D2), D1 @> D2 |

## Available Fluents
- job(user, X), lives_in(user, X), knows(user, X), hobby(user, X)
- married_to(user, X), has_pet(user, Pet, Name), likes(user, X), name(user, X)

## Assert Examples
"プログラマーです" → memory_assert("got_job(user, \\"プログラマー\\")", "2025-12-16")
"結婚しました" → memory_assert("married(user, \\"配偶者名\\")", "2025-12-16")
`;

// =============================================================================
// Helper: Get tools with current date context
// =============================================================================

export function getWhenMToolsWithContext(currentDate: string) {
  // Clone and add current date to descriptions
  return WHENM_TOOLS.map((tool) => {
    if (tool.function.name === "memory_assert") {
      return {
        ...tool,
        function: {
          ...tool.function,
          description:
            tool.function.description +
            `\n\nCurrent date: ${currentDate}. Use this as the default date.`,
        },
      };
    }
    return tool;
  });
}
