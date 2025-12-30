# WhenM

[English](README.md) | [日本語](README.ja.md)

[![CI](https://github.com/Aid-On/whenm/actions/workflows/ci.yml/badge.svg)](https://github.com/Aid-On/whenm/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@aid-on/whenm.svg)](https://www.npmjs.com/package/@aid-on/whenm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **いつ**起きたかを理解する時間認識メモリシステム - 何が起きたかだけでなく

## WhenMとは？

WhenMは、AIアプリケーションに時間、状態変化、因果関係を理解する能力を与える**スキーマレス時間認識メモリシステム**です。従来のデータベースやRAGシステムとは異なり、WhenMは事実が時間とともに変化することをネイティブに理解します。

### RAGとの主な違い

| 側面 | RAG | WhenM |
|--------|-----|-------|
| **時間理解** | ❌ なし | ✅ ネイティブな時間推論 |
| **状態変化** | ❌ 追跡不可 | ✅ すべての遷移を追跡 |
| **矛盾** | ❌ すべてのバージョンを返す | ✅ タイムラインで解決 |
| **スキーマ** | ⚠️ 事前定義 | ✅ 完全にスキーマレス |
| **クエリ** | "Xとは何？" | "時刻YでのXは何？" |

## クイックスタート

```typescript
import { WhenM } from '@aid-on/whenm';

// Cloudflare AIで初期化
const memory = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL
});


// イベントを記憶 - あらゆる言語、あらゆるドメイン
await memory.remember("Alice joined as engineer", "2020-01-15");
await memory.remember("Alice became team lead", "2022-06-01");
await memory.remember("ピカチュウが10万ボルトを覚えた", "2023-01-01");

// 時間的な質問をする
await memory.ask("What was Alice's role in 2021?");
// → "engineer"

await memory.ask("アリスの現在の役職は？");
// → "team lead"

await memory.ask("ピカチュウはいつ10万ボルトを覚えた？");
// → "2023年1月1日"

await memory.ask("What did Pikachu learn?");
// → "Thunderbolt (100,000 volts)"
```

## ⚠️ 重要：正しいメソッドを使用してください

**複雑な時間推論には必ず `ask()` メソッドを使用してください：**
```typescript
// ✅ 正しい - Event Calculus + Prolog推論を使用
await memory.ask("アリスの2021年の役職は？");

// ⚠️ 非推奨 - 単純なフィルタリング、時間推論なし
await memory.query().subject("Alice").execute();  // 複雑なクエリには使用しない
await memory.nl("アリスは何をした？");           // 複雑なクエリには使用しない
```

`query()` と `nl()` メソッドは非推奨で、警告が表示されます。これらは強力なEvent Calculus推論エンジンを使用せず、単純なJavaScriptフィルタリングを使用します。

## 主な機能

### 🌍 真のスキーマレス
スキーマ、設定、エンティティ定義は不要。WhenMはLLM統合を通じて、あらゆる言語のあらゆる概念を理解します。

```typescript
// ゲームドメイン
await memory.remember("Mario collected a fire flower", "2024-01-01");

// 料理ドメイン  
await memory.remember("Added salt to the soup", "2024-02-01");

// ビジネスドメイン
await memory.remember("田中さんが部長になった", "2024-03-01");

// すべてセットアップなしで動作！
```

### ⏰ 時間推論
形式的なEvent Calculusに基づいて構築され、時間と状態変化に関する自然言語クエリに対して数学的に健全な時間論理を提供します。

### 🌐 あらゆる言語、あらゆるドメイン
クエリ改良レイヤーが複数の言語とドメインを自動的に処理します。

```typescript
// 日本語ゲーミング
await memory.remember("ピカチュウが10万ボルトを覚えた");

// スペイン語の日常生活
await memory.remember("El gato subió al árbol");

// 絵文字付き英語
await memory.remember("🚀 launched to Mars");
```

## インストール

```bash
npm install @aid-on/whenm
```

## 使用方法

### 基本セットアップ

```typescript
import { WhenM } from '@aid-on/whenm';

// シンプルな文字列形式 (provider:apikey)
const memory = await WhenM.create('groq:your-api-key');

// モデル指定付き
const memory = await WhenM.create('groq:your-api-key:llama-3.3-70b-versatile');

// 統一設定オブジェクト
const memory = await WhenM.create({
  provider: 'groq',
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile'
});

// プロバイダー固有のヘルパー
const memory = await WhenM.groq(process.env.GROQ_API_KEY);
const memory = await WhenM.gemini(process.env.GEMINI_API_KEY);
const memory = await WhenM.cloudflare({
  apiKey: process.env.CLOUDFLARE_API_KEY,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  email: process.env.CLOUDFLARE_EMAIL
});
```

### イベントの記録

```typescript
// シンプルなイベント
await memory.remember("Project started", "2024-01-01");

// 複雑な状態変化
await memory.remember("Bob promoted to manager", "2024-06-01");

// 多言語
await memory.remember("実験が成功した", "2024-07-01");
```

### クエリ

```typescript
// 自然言語クエリ
await memory.ask("What happened in January?");
await memory.ask("Who became manager this year?");
await memory.ask("プロジェクトの現在の状態は？");

// 構造化クエリ
const events = await memory
  .query()
  .subject("Alice")
  .between("2024-01-01", "2024-12-31")
  .execute();

// タイムライン分析
const timeline = memory.timeline("Project-X");
const statusInMarch = await timeline.at("2024-03-15");
const recentChanges = await timeline.recent(30); // 過去30日
```

## 高度な機能

### クエリ改良レイヤー

WhenMには、言語間でクエリを標準化する洗練された改良レイヤーが含まれています：

```typescript
// これらすべてがシームレスに動作：
await memory.ask("What is Alice's role?");
await memory.ask("アリスの役職は？");
await memory.ask("¿Cuál es el rol de Alice?");
```

### クエリ改良の有効化

より良い多言語サポートのために：

```typescript
const memory = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  enableRefiner: true  // 多言語クエリ改良を有効化
});
```

### 永続化（プラグインシステム） - 🧪 実験的

> ⚠️ **注意**: 永続化機能は実験的であり、本番環境で完全にテストされていません。注意して使用してください。

WhenMは永続的なストレージのためのプラグ可能な永続化レイヤーを提供します：

#### メモリ永続化（デフォルト）
```typescript
// デフォルト - イベントはメモリにのみ保存
const memory = await WhenM.cloudflare(config);
```

#### D1データベース永続化
```typescript
// 永続的なストレージ用のCloudflare D1
const memory = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  persistenceType: 'd1',
  persistenceOptions: {
    database: env.DB,           // D1データベースバインディング
    tableName: 'whenm_events',  // オプション: カスタムテーブル名
    namespace: 'my-app'         // オプション: マルチテナンシー用の名前空間
  }
});

// 現在の状態を保存
await memory.persist();

// データベースから復元
await memory.restore();

// フィルター付きで復元
await memory.restore({
  timeRange: { from: '2024-01-01', to: '2024-12-31' },
  limit: 1000
});

// 永続化統計をチェック
const stats = await memory.persistenceStats();
console.log(`永続化された総イベント数: ${stats.totalEvents}`);
```

#### カスタム永続化プラグイン
```typescript
// 独自の永続化を実装
class MyCustomPersistence {
  async save(event) { /* ... */ }
  async load(query) { /* ... */ }
  async stats() { /* ... */ }
  // ... その他の必要なメソッド
}

const memory = await WhenM.cloudflare({
  // ... 設定
  persistenceType: 'custom',
  persistenceOptions: new MyCustomPersistence()
});
```

#### 永続化API
```typescript
// コア永続化メソッド
await memory.persist();                    // すべてのイベントをストレージに保存
await memory.restore();                    // ストレージからすべてのイベントをロード
await memory.restore({ limit: 100 });      // クエリフィルター付きでロード
const stats = await memory.persistenceStats(); // ストレージ統計を取得

// Prolog形式のエクスポート/インポート
const prolog = await memory.exportProlog();
await memory.importProlog(prolog);
```

## アーキテクチャ

WhenMは3つの強力な技術を組み合わせています：

1. **Event Calculus** - 時間に関する推論のための形式的時間論理
2. **Trealla Prolog** - 高性能論理推論エンジン（WASM）
3. **LLM統合** - スキーマなしの自然言語理解

### データフロー：動作原理

システムは5段階で情報を処理します：

```
入力 → 言語正規化 → 意味分解 → 時間論理 → 応答
```

#### 例：イベントの記録

**入力：**
```typescript
await memory.remember("太郎がマネージャーになった", "2024-03-01");
```

**ステージ1：言語正規化**
```json
{
  "original": "太郎がマネージャーになった",
  "language": "ja",
  "refined": "Taro became manager",
  "entities": ["Taro"]
}
```

**ステージ2：意味分析（LLM）**
```json
{
  "subject": "taro",
  "verb": "became",
  "object": "manager",
  "temporalType": "STATE_UPDATE",
  "affectedFluent": {
    "domain": "role",      // 動的に決定
    "value": "manager",
    "isExclusive": true    // 一度に1つの役職のみ
  }
}
```

**ステージ3：Prolog事実の生成**
```prolog
event_fact("evt_1234", "taro", "became", "manager").
happens("evt_1234", 1709251200000).
initiates("evt_1234", role("taro", "manager")).
is_exclusive_domain(role).
```

#### 例：情報のクエリ

**入力：**
```typescript
await memory.ask("What is Taro's current role?");
```

**Prologクエリ：**
```prolog
current_state("taro", role, Value)
```

**Event Calculus処理：**
- 最新の `initiates("evt_1234", role("taro", "manager"))` を見つける
- より新しい役職変更が存在しないことを確認（クリッピングチェック）
- 返す: `Value = "manager"`

### 真のスキーマレス設計

従来のシステムは事前定義されたスキーマが必要：
```typescript
// ❌ ハードコードされたアプローチ
if (verb === "became") domain = "role";
if (verb === "learned") domain = "skill";
```

WhenMは任意の概念を動的に理解：
```typescript
// ✅ 動的な理解
"ピカチュウが10万ボルトを覚えた" → {domain: "skill", value: "thunderbolt", isExclusive: false}
"Robot battery at 80%" → {domain: "battery", value: "80", isExclusive: true}
"Alien transformed into energy" → {domain: "form", value: "energy", isExclusive: true}
```

LLMが意味、ドメイン、排他性ルールを動的に決定し、コード変更なしに新しい概念を処理できます。

## パフォーマンス

- **挿入速度**: 25,000+ イベント/秒
- **クエリ速度**: 典型的なクエリで1-30ms  
- **メモリ**: エッジに最適化（Cloudflare Workersで動作）
- **言語**: あらゆる人間の言語をサポート

## ユースケース

### 🏢 従業員パフォーマンス＆キャリア追跡
```typescript
const hr = await WhenM.cloudflare(config);

// 完全なコンテキストでキャリアの進展を追跡
await hr.remember("Sarah joined as Junior Developer", "2021-01-15");
await hr.remember("Sarah completed React certification", "2021-06-20");
await hr.remember("Sarah led the payment module project", "2021-09-01");
await hr.remember("Sarah promoted to Senior Developer", "2022-01-15");
await hr.remember("Sarah became Tech Lead", "2023-06-01");

// 時間的パフォーマンスクエリ
const review = await hr.ask("What achievements led to Sarah's promotion to Senior?");
// → "Completed React certification and successfully led payment module project"

// 従業員間の成長を比較
const sarahGrowth = await hr.timeline("Sarah").compare("2021-01-15", "2024-01-15");
const johnGrowth = await hr.timeline("John").compare("2021-01-15", "2024-01-15");
// → 客観的なキャリア進展の比較

// ハイパフォーマーを見つける
const fastGrowth = await hr.query()
  .verb(["promoted", "awarded", "recognized"])
  .last(12, 'months')
  .distinct('subject');
// → 最近の成果を持つ従業員のリスト
```

### 🏥 患者の医療履歴＆治療の変遷
```typescript
const medical = await WhenM.cloudflare(config);

// 複雑な医療タイムライン
await medical.remember("Patient diagnosed with hypertension", "2020-03-15");
await medical.remember("Started lisinopril 10mg daily", "2020-03-20");
await medical.remember("Blood pressure improved to 130/80", "2020-06-15");
await medical.remember("Developed dry cough side effect", "2020-09-01");
await medical.remember("Switched to losartan 50mg", "2020-09-05");
await medical.remember("血圧が正常値に安定", "2021-01-15"); // 多言語サポート

// 治療決定のための重要な時間クエリ
const currentMeds = await medical.timeline("Patient").now();
// → 現在の薬と状態

const medicationHistory = await medical.ask("Why was the medication changed in September 2020?");
// → "Lisinopril caused dry cough side effect, switched to losartan"

// 時間経過による治療効果の追跡
const bpHistory = await medical.query()
  .subject("Patient")
  .verb(["measured", "recorded"])
  .object("blood pressure")
  .last(6, 'months')
  .orderBy('time', 'asc')
  .execute();
// → 治療評価のための血圧トレンド
```

### 🤖 AIエージェントメモリ＆学習システム
```typescript
const agent = await WhenM.cloudflare(config);

// エージェントは時間とともに学習し適応
await agent.remember("User prefers TypeScript over JavaScript", "2024-01-01");
await agent.remember("User works in Tokyo timezone", "2024-01-05");
await agent.remember("User dislikes verbose explanations", "2024-01-10");
await agent.remember("Failed to solve bug with approach A", "2024-02-01");
await agent.remember("Successfully solved bug with approach B", "2024-02-01");

// 時間メモリに基づくコンテキスト認識応答
const preferences = await agent.timeline("User").states();
// → すべての現在のユーザー設定と学習パターン

const debugging = await agent.ask("What debugging approach should I try?");
// → "Use approach B, as approach A previously failed"

// インタラクションパターンから学習
const interactions = await agent.query()
  .verb(["failed", "succeeded", "errored"])
  .last(30, 'days')
  .execute();
// → 改善のための成功/失敗パターンの分析
```

### 📊 リアルタイムインシデント管理＆RCA
```typescript
const ops = await WhenM.cloudflare(config);

// インシデントタイムラインを追跡
await ops.remember("CPU usage spiked to 95%", "2024-03-15 14:30");
await ops.remember("Database connection pool exhausted", "2024-03-15 14:31");
await ops.remember("API response time degraded to 5s", "2024-03-15 14:32");
await ops.remember("Deployed hotfix PR #1234", "2024-03-15 14:45");
await ops.remember("System recovered", "2024-03-15 14:50");

// 時間推論による根本原因分析
const rca = await ops.ask("What caused the API degradation?");
// → "CPU spike led to connection pool exhaustion, causing API degradation"

// インシデント全体でのパターン検出
const patterns = await ops.query()
  .verb(["spiked", "exhausted", "degraded"])
  .last(90, 'days')
  .execute();
// → 繰り返し発生する問題を特定

// 自動インシデント相関
const correlation = await ops.timeline("System")
  .between("2024-03-15 14:00", "2024-03-15 15:00");
// → ポストモーテムのための完全なインシデントタイムライン
```

### 💰 金融監査証跡＆コンプライアンス
```typescript
const audit = await WhenM.cloudflare(config);

// 完全な監査証跡を維持
await audit.remember("Account opened by John", "2023-01-15");
await audit.remember("KYC verification completed", "2023-01-16");
await audit.remember("$50,000 deposited from Chase Bank", "2023-02-01");
await audit.remember("Flagged for unusual activity", "2023-03-15");
await audit.remember("Manual review cleared", "2023-03-16");
await audit.remember("Account upgraded to Premium", "2023-06-01");

// コンプライアンスクエリ
const kycStatus = await audit.ask("Was KYC completed before the first transaction?");
// → "Yes, KYC completed on Jan 16, first transaction on Feb 1"

// 疑わしい活動の追跡
const flagged = await audit.query()
  .verb(["flagged", "suspended", "investigated"])
  .between("2023-01-01", "2023-12-31")
  .execute();
// → 規制報告のためのすべてのコンプライアンスイベント

// 法的調査のための任意時点でのアカウント状態
const snapshot = await audit.timeline("Account")
  .at("2023-03-15");
// → フラグが立った時の正確なアカウント状態
```

### 🎮 ゲーム状態＆プレイヤー進展
```typescript
const game = await WhenM.cloudflare(config);

// 豊富なプレイヤー履歴
await game.remember("Player discovered hidden dungeon", "2024-01-01 10:00");
await game.remember("Player defeated Dragon Boss", "2024-01-01 11:30");
await game.remember("Player earned 'Dragon Slayer' title", "2024-01-01 11:31");
await game.remember("Player joined guild 'Knights'", "2024-01-02");
await game.remember("ギルド戦で勝利した", "2024-01-03"); // 多言語

// 履歴に基づくパーソナライズされたゲームプレイ
const achievements = await game.timeline("Player").states();
// → すべてのタイトル、スキル、進展

// 時間条件に基づくクエスト適格性
const eligible = await game.ask("Can player start the 'Ancient Evil' quest?");
// → "Yes, player has defeated Dragon Boss and joined a guild"

// 時間ベースのスコアリングによるリーダーボード
const weeklyChamps = await game.query()
  .verb(["defeated", "completed", "won"])
  .last(7, 'days')
  .distinct('subject');
// → 今週最もアクティブなプレイヤー
```

### 🏭 IoTセンサーネットワーク＆予測保全
```typescript
const iot = await WhenM.cloudflare(config);

// 継続的なセンサーモニタリング
await iot.remember("Machine-A vibration increased to 0.8mm/s", "2024-03-01");
await iot.remember("Machine-A temperature at 75°C", "2024-03-02");
await iot.remember("Machine-A bearing noise detected", "2024-03-03");
await iot.remember("Machine-A scheduled maintenance", "2024-03-05");
await iot.remember("Machine-A bearing replaced", "2024-03-05");

// 予測保全クエリ
const warning = await iot.ask("What signs preceded the bearing failure?");
// → "Vibration increased, temperature rose, then noise detected"

// フリート全体でのパターン認識
const maintenance = await iot.query()
  .verb(["increased", "detected", "failed"])
  .last(30, 'days')
  .execute();
// → 同様のパターンを示す機械を特定

// 最適な保全スケジューリング
const machineState = await iot.timeline("Machine-A")
  .compare("2024-02-01", "2024-03-01");
// → 保全計画のための劣化率
```

## APIリファレンス

### コアメソッド

#### `memory.remember(event: string, date?: string | Date)`
特定の時刻にイベントを記録します。

#### `memory.ask(question: string)`
時間推論を使用して質問に答えます。

#### `memory.query()`
構造化検索のためのクエリビルダーを返します。


### クエリビルダーAPI

構造化クエリのための完全なフルエントインターフェース：

```typescript
// 基本的なクエリメソッド
memory.query()
  .where({ subject: "Alice", verb: "learned" })  // 複数条件でフィルター
  .subject("Alice")                              // エンティティでフィルター（文字列または配列）
  .verb(["learned", "studied"])                  // アクションでフィルター（文字列または配列）
  .object("Python")                               // ターゲット/オブジェクトでフィルター
  .between("2024-01-01", "2024-12-31")          // 時間範囲フィルター
  .on("2024-06-15")                              // 特定の日付
  .last(30, 'days')                              // 最近の期間（days/weeks/months/years）
  .orderBy('time', 'desc')                       // ソート（time/subject/verb/object, asc/desc）
  .limit(10)                                      // 結果を制限
  .offset(20)                                     // 結果をスキップ（ページネーション）
  .page(2, 10)                                    // ページ番号とサイズ
  .execute()                                      // → Promise<Event[]>

// 集計メソッド
.count()                  // → Promise<number> - マッチするイベントをカウント
.exists()                 // → Promise<boolean> - マッチするものが存在するかチェック
.first()                  // → Promise<Event | null> - 最初のマッチを取得
.distinct('subject')      // → Promise<string[]> - ユニークな値を取得

// チェーンの例
const recentLearning = await memory.query()
  .subject(["Alice", "Bob"])
  .verb("learned")
  .last(90, 'days')
  .orderBy('time', 'desc')
  .limit(5)
  .execute();
```


## 要件

- Node.js 18+
- LLMプロバイダーAPIクレデンシャル（必須 - 以下のいずれか）：
  - Cloudflare AI（アカウントID、APIキー、メール）
  - Groq APIキー
  - Google Gemini APIキー

## 環境変数

```bash
# Cloudflare AI
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_EMAIL=your_email

# または Groq
GROQ_API_KEY=your_groq_key

# または Gemini
GEMINI_API_KEY=your_gemini_key
```

## テスト

```bash
# ユニットテストのみ実行（高速）
npm run test:unit

# 統合テストのみ実行（APIキーが必要またはモックを使用）
npm run test:integration

# すべてのテストを実行
npm run test:all

# カバレッジ付きでテストを実行
npm run test:coverage

# 開発用ウォッチモード
npm run test:watch
```

## ロードマップ

### 今後の機能
- **Timeline API**: 完全な状態追跡と時間スナップショット
  - `timeline.at(time)` - 任意時点での完全な状態
  - `timeline.states()` - 現在の状態追跡
  - `timeline.compare()` - 状態変化分析
- **高度な永続化**: 追加のストレージバックエンド
- **パフォーマンス最適化**: より高速なProlog統合
- **拡張言語サポート**: より多くのLLMプロバイダー

## ライセンス

MIT © Aid-On

## クレジット

WhenMは巨人の肩の上に立っています：

### コア技術
- **[Trealla Prolog](https://github.com/trealla-prolog/trealla)** - 論理推論基盤を提供するWebAssembly駆動のPrologエンジン
- **[Event Calculus](https://en.wikipedia.org/wiki/Event_calculus)** - 厳密な時間ベースの推論のための形式的時間論理フレームワーク
- **[@aid-on/unillm](https://www.npmjs.com/package/@aid-on/unillm)** - シームレスなマルチプロバイダーサポートを可能にする統一LLMインターフェース

### 特別な感謝
- 優れたWASM実装を提供してくれたTrealla Prologチーム
- 数十年にわたる時間論理の進歩を遂げたEvent Calculusリサーチコミュニティ
- 継続的なサポートとイノベーションを提供してくれたAid-Onチーム