/**
 * Reasoning Chain v4 - Cloudflare REST API Version
 *
 * Cloudflare Workers AI を REST API 経由で使用
 */

import { createEngine, type WhenMEngine } from "../src/index.js";
import { callCloudflareRest, getCredentialsFromEnv, type Credentials } from "@aid-on/unilmp";
import { z } from "zod";
import { config } from "dotenv";
config({ path: "../../.env" });

// =============================================================================
// 設定
// =============================================================================

const MODEL = process.argv[2] || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

console.log(`Using Cloudflare model: ${MODEL}\n`);

const credentials: Credentials = getCredentialsFromEnv();

// =============================================================================
// スキーマ
// =============================================================================

const QueryPlanSchema = z.object({
  steps: z.array(
    z.object({
      action: z.enum([
        "get_current_job",
        "get_current_location",
        "get_current_hobbies",
        "get_current_spouse",
        "get_job_at_date",
        "get_location_at_date",
        "get_hobbies_at_date",
        "get_marriage_date",
        "get_job_history",
        "get_move_history",
        "get_hobby_history",
        "get_job_when_event",
        "get_location_when_event",
        "get_hobbies_in_period",
        "compare_values",
        "calculate_duration",
        "find_longest",
      ]),
      param_date: z.string().optional(),
      param_event: z.string().optional(),
      param_value: z.string().optional(),
      param_place: z.string().optional(),
      param_var_a: z.string().optional(),
      param_var_b: z.string().optional(),
      param_data_var: z.string().optional(),
      store_as: z.string(),
    })
  ),
  final_answer_template: z.string(),
});

type Step = z.infer<typeof QueryPlanSchema>["steps"][number];

// =============================================================================
// Few-shot例
// =============================================================================

const FEW_SHOT_EXAMPLES = `
## 例1
質問: "今の仕事は何ですか？"
{"steps": [{"action": "get_current_job", "store_as": "job"}], "final_answer_template": "現在の仕事は{job}です。"}

## 例2
質問: "結婚した時に住んでいた場所と、今住んでいる場所は同じですか？"
{"steps": [{"action": "get_location_when_event", "param_event": "married", "store_as": "then_location"}, {"action": "get_current_location", "store_as": "now_location"}, {"action": "compare_values", "param_var_a": "then_location", "param_var_b": "now_location", "store_as": "same"}], "final_answer_template": "結婚時は{then_location}、現在は{now_location}。{same}。"}

## 例3
質問: "最も長く続いた役職は？"
{"steps": [{"action": "get_job_history", "store_as": "jobs"}, {"action": "calculate_duration", "param_data_var": "jobs", "store_as": "durations"}, {"action": "find_longest", "param_data_var": "durations", "store_as": "longest"}], "final_answer_template": "最長は{longest.job}で{longest.days}日間。"}

## 例4
質問: "東京に住んでいた時に始めた趣味は？"
{"steps": [{"action": "get_move_history", "store_as": "moves"}, {"action": "get_hobbies_in_period", "param_place": "東京", "param_data_var": "moves", "store_as": "hobbies"}], "final_answer_template": "東京で始めた趣味は{hobbies}。"}

## 例5
質問: "CTOになった時はどこに住んでいた？"
{"steps": [{"action": "get_location_when_event", "param_event": "got_job", "param_value": "CTO", "store_as": "location"}], "final_answer_template": "CTOになった時は{location}に住んでいました。"}
`;

// =============================================================================
// クエリ実行
// =============================================================================

const QUERY_MAP: Record<string, (ec: WhenMEngine, step: Step, ctx: Record<string, unknown>) => Promise<unknown>> = {
  get_current_job: async (ec) => {
    const r = await ec.query<{ X: string }>('holds_now(job(user, X))');
    return r[0]?.X || null;
  },
  get_current_location: async (ec) => {
    const r = await ec.query<{ X: string }>('holds_now(lives_in(user, X))');
    return r[0]?.X || null;
  },
  get_current_hobbies: async (ec) => {
    const r = await ec.query<{ X: string }>('holds_now(hobby(user, X))');
    return r.map(x => x.X);
  },
  get_job_history: async (ec) => {
    const r = await ec.query<{ Job: string; Date: string }>('happens(got_job(user, Job), Date)');
    return r.sort((a, b) => a.Date.localeCompare(b.Date));
  },
  get_move_history: async (ec) => {
    const r = await ec.query<{ Place: string; Date: string }>('happens(moved_to(user, Place), Date)');
    return r.sort((a, b) => a.Date.localeCompare(b.Date));
  },
  get_location_when_event: async (ec, step) => {
    const event = step.param_event;
    const value = step.param_value;
    let query: string;
    if (event === "married") {
      query = 'happens(married(user, _), D), holds_at(lives_in(user, X), D)';
    } else if (event === "got_job" && value) {
      query = `happens(got_job(user, "${value}"), D), holds_at(lives_in(user, X), D)`;
    } else {
      return null;
    }
    const r = await ec.query<{ X: string }>(query);
    return r[0]?.X || null;
  },
  get_hobbies_in_period: async (ec, step, ctx) => {
    const place = step.param_place;
    const moves = ctx[step.param_data_var || "moves"] as Array<{ Place: string; Date: string }>;
    if (!moves || !place) return [];

    let start: string | null = null;
    let end: string | null = null;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].Place === place) {
        start = moves[i].Date;
        end = moves[i + 1]?.Date || new Date().toISOString().split("T")[0];
        break;
      }
    }
    if (!start) return [];

    const r = await ec.query<{ H: string }>(`happens(started_hobby(user, H), D), D @>= "${start}", D @< "${end}"`);
    return r.map(x => x.H);
  },
  compare_values: async (_ec, step, ctx) => {
    const a = ctx[step.param_var_a || ""];
    const b = ctx[step.param_var_b || ""];
    return a === b ? "同じです" : "異なります";
  },
  calculate_duration: async (_ec, step, ctx) => {
    const data = ctx[step.param_data_var || ""] as Array<{ Job?: string; Date: string }>;
    if (!data) return [];
    const currentDate = new Date().toISOString().split("T")[0];
    return data.map((d, i) => {
      const end = data[i + 1]?.Date || currentDate;
      const days = Math.floor((new Date(end).getTime() - new Date(d.Date).getTime()) / (1000 * 60 * 60 * 24));
      return { job: d.Job, start: d.Date, end, days };
    });
  },
  find_longest: async (_ec, step, ctx) => {
    const data = ctx[step.param_data_var || ""] as Array<{ job: string; days: number }>;
    if (!data || data.length === 0) return null;
    return data.reduce((max, d) => d.days > max.days ? d : max, data[0]);
  },
};

// =============================================================================
// プラン生成 (Cloudflare REST API)
// =============================================================================

async function generatePlan(question: string, currentDate: string) {
  const prompt = `質問に回答するための実行プランをJSONで生成してください。
今日: ${currentDate}

利用可能なアクション:
- get_current_job: 現在の職業
- get_current_location: 現在の住所
- get_job_history: 職歴全体
- get_move_history: 引越し履歴
- get_location_when_event: イベント時の住所 (param_event, param_value)
- get_hobbies_in_period: 特定場所での趣味 (param_place, param_data_var)
- compare_values: 比較 (param_var_a, param_var_b)
- calculate_duration: 期間計算 (param_data_var)
- find_longest: 最長特定 (param_data_var)

${FEW_SHOT_EXAMPLES}

質問: "${question}"

JSONのみを出力してください。説明は不要です。`;

  const result = await callCloudflareRest(
    MODEL,
    [{ role: "user", content: prompt }],
    credentials
  );

  const response = result.result.response;

  // Cloudflare may return JSON directly as object or as string
  let parsed: unknown;
  if (typeof response === 'object' && response !== null) {
    parsed = response;
  } else if (typeof response === 'string') {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to extract JSON from response: ${response}`);
    }
    parsed = JSON.parse(jsonMatch[0]);
  } else {
    throw new Error(`Unexpected response type: ${typeof response}`);
  }

  return QueryPlanSchema.parse(parsed);
}

// =============================================================================
// プラン実行
// =============================================================================

async function executePlan(ec: WhenMEngine, plan: z.infer<typeof QueryPlanSchema>) {
  const context: Record<string, unknown> = {};

  console.log("\n📋 プラン:");
  for (const step of plan.steps) {
    const params = [
      step.param_event && `event=${step.param_event}`,
      step.param_value && `value=${step.param_value}`,
      step.param_place && `place=${step.param_place}`,
      step.param_var_a && `a=${step.param_var_a}`,
      step.param_var_b && `b=${step.param_var_b}`,
      step.param_data_var && `data=${step.param_data_var}`,
    ].filter(Boolean).join(", ");
    console.log(`   ${step.store_as}: ${step.action}${params ? ` (${params})` : ""}`);
  }

  console.log("\n🔄 実行:");
  for (const step of plan.steps) {
    const executor = QUERY_MAP[step.action];
    if (!executor) {
      console.log(`   ⚠️ Unknown: ${step.action}`);
      context[step.store_as] = null;
      continue;
    }

    try {
      const result = await executor(ec, step, context);
      context[step.store_as] = result;
      const display = JSON.stringify(result);
      console.log(`   ✓ ${step.store_as} = ${display.length > 60 ? display.slice(0, 60) + "..." : display}`);
    } catch (e) {
      console.log(`   ✗ ${step.store_as}: ${e}`);
      context[step.store_as] = null;
    }
  }

  // テンプレート展開
  let answer = plan.final_answer_template;
  for (const [key, value] of Object.entries(context)) {
    const displayValue = value === null ? "不明" :
      Array.isArray(value) ? (value.length > 0 ? value.join("、") : "なし") :
      typeof value === "object" ? JSON.stringify(value) : String(value);

    answer = answer.replace(new RegExp(`\\{${key}\\}`, "g"), displayValue);
    answer = answer.replace(new RegExp(`\\{${key}\\.([^}]+)\\}`, "g"), (_, prop) => {
      if (typeof value === "object" && value !== null) {
        return String((value as Record<string, unknown>)[prop] ?? "不明");
      }
      return "不明";
    });
  }

  return { context, answer };
}

// =============================================================================
// メイン
// =============================================================================

async function main() {
  const currentDate = "2025-01-15";

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     推論チェーン v4 - Cloudflare REST API                    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const ec = await createEngine({ currentDate });

  const events = [
    { event: 'moved_to(user, "大阪")', date: "2015-04-01" },
    { event: 'got_job(user, "インターン")', date: "2016-04-01" },
    { event: 'got_job(user, "ジュニアエンジニア")', date: "2017-04-01" },
    { event: 'moved_to(user, "東京")', date: "2018-04-01" },
    { event: 'got_job(user, "シニアエンジニア")', date: "2019-04-01" },
    { event: 'started_hobby(user, "ランニング")', date: "2019-06-01" },
    { event: 'married(user, "鈴木")', date: "2021-06-01" },
    { event: 'got_job(user, "テックリード")', date: "2022-04-01" },
    { event: 'moved_to(user, "横浜")', date: "2022-08-01" },
    { event: 'got_job(user, "CTO")', date: "2024-01-01" },
  ];

  for (const e of events) {
    await ec.assertEvent(e.event, e.date);
  }

  const questions = [
    "今の仕事は何ですか？",
    "結婚した時に住んでいた場所と、今住んでいる場所は同じですか？",
    "キャリアの中で最も長く続いた役職は何ですか？",
    "東京に住んでいた時に始めた趣味は何ですか？",
    "CTOになった時はどこに住んでいましたか？",
  ];

  for (const q of questions) {
    console.log("\n" + "═".repeat(64));
    console.log(`\n🔍 質問: "${q}"`);

    try {
      const startTime = Date.now();
      const plan = await generatePlan(q, currentDate);
      const planTime = Date.now() - startTime;

      const { answer } = await executePlan(ec, plan);
      const totalTime = Date.now() - startTime;

      console.log(`\n💬 回答: ${answer}`);
      console.log(`   ⏱️  プラン生成: ${planTime}ms, 合計: ${totalTime}ms`);
    } catch (e) {
      console.log(`\n❌ エラー: ${e}`);
    }
  }

  console.log("\n" + "═".repeat(64));
  console.log("\n✅ 完了");
}

main().catch(console.error);
