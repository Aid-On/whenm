# @aid-on/whenm

[![npm version](https://img.shields.io/npm/v/@aid-on/whenm.svg)](https://www.npmjs.com/package/@aid-on/whenm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) | **日本語**

> AIに時間と文脈を真に理解させる時間認識メモリシステム

## WhenMとは？

WhenMは、AIに「何が起きたか」だけでなく「**いつ**起きたか」を理解する能力を与える革新的なメモリシステムです。すべての情報を静的に扱う従来のRAGシステムとは異なり、WhenMは時間的関係、状態変化、事実の進化を理解します。

## 魔法の仕組み：3つの技術が生み出す新しい世界

### 🧩 イノベーションの完璧な融合

WhenMは単なるデータベースやLLMラッパーではありません。本来一緒に働くべき3つの技術を組み合わせた時に起きる革新です：

#### 1. **Event Calculus** - 数学的頭脳
```prolog
holds_at(Fluent, Time) :-
    happens(Event, T1),
    T1 =< Time,
    initiates(Event, Fluent),
    not(clipped(T1, Fluent, Time)).
```
形式的な時間論理により以下を推論：
- 過去のある時点で何が真だったか
- 状態が時間とともにどう変化するか
- 何が何を引き起こすか

#### 2. **Trealla Prolog** - 推論エンジン
```javascript
// WebAssemblyでネイティブに近い速度で動作
await engine.query('holds_at(role(alice, X), "2021-06-01")');
// 数千の事実から瞬時に論理推論
```
- **25,000+ イベント/秒** の挿入速度
- **ミリ秒以下** のクエリ性能
- **どこでも動作** - ブラウザ、エッジ、サーバー

#### 3. **LLM統合** - 理解層
```typescript
// 自然言語入力 → 意味理解 → Prolog事実
await memory.remember("田中さんが昇進した", "2024-01-01");
// LLMが抽出: subject=田中, verb=昇進, type=単一状態
// 生成: initiates(event("田中", "promoted"), role("田中", "manager"))
```
- **スキーマゼロ** - あらゆる概念を理解
- **全言語対応** - 日本語、英語、スペイン語など
- **意味認識** - 「昇進」が役職を変え、「学んだ」が知識を蓄積することを理解

### 🎯 シナジー効果

各技術が重要なギャップを埋めます：

| 課題 | 従来のアプローチ | WhenMの解決策 |
|------|-----------------|---------------|
| 自然言語理解 | ハードコードされたパーサー | LLM意味抽出 |
| 時間推論 | 複雑なSQLクエリ | Event Calculus述語 |
| 状態管理 | 手動追跡 | Prolog推論エンジン |
| スキーマの柔軟性 | 固定された事前定義モデル | 動的LLM理解 |
| 大規模パフォーマンス | 遅い埋め込み検索 | ネイティブProlog推論 |

### 🌟 結果

この独自の組み合わせが生み出すAIメモリシステム：
- **人間のように時間を理解**
- **因果関係を自動推論**
- **設定なしであらゆる概念で動作**
- **最小遅延でエッジスケール実行**
- **論理推論により一貫性維持**

## インストール

```bash
npm install @aid-on/whenm
```

## クイックスタート

### 1. 環境変数の設定

```bash
# Cloudflare Workers AI の場合
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_EMAIL=your_email

# Groq の場合
GROQ_API_KEY=your_groq_api_key

# Google Gemini の場合
GEMINI_API_KEY=your_gemini_api_key
```

### 2. 基本的な使い方

```typescript
import { WhenM } from '@aid-on/whenm';

// お好みのLLMプロバイダで初期化
const memory = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL
});

// タイムスタンプ付きでイベントを記録
await memory.remember("田中さんがソフトウェアエンジニアとして入社した", "2020-01-15");
await memory.remember("田中さんがシニアエンジニアに昇進した", "2022-06-01");
await memory.remember("田中さんがエンジニアリングマネージャーになった", "2024-01-01");

// 時間的状態をクエリ
const role2021 = await memory.ask("2021年の田中さんの役職は？");
console.log(role2021); // "ソフトウェアエンジニア"

const currentRole = await memory.ask("田中さんの現在の役職は？");
console.log(currentRole); // "エンジニアリングマネージャー"

const promotionDate = await memory.ask("田中さんがシニアエンジニアになったのはいつ？");
console.log(promotionDate); // "2022-06-01"
```

## 主要機能

### 🧠 真のスキーマレス
エンティティ、リレーション、イベントタイプの定義不要。LLM統合により自然言語を意味的に理解します。

```typescript
// あらゆる領域、あらゆる言語で動作
await memory.remember("太郎が東京に引っ越した", "2024-01-01");
await memory.remember("プレイヤーがドラゴンを倒した", "2024-02-15");
await memory.remember("A社がB社を買収した", "2024-03-01");
```

### ⏰ 時間推論
形式的なEvent Calculusに基づき、数学的に健全な時間論理を提供。

```typescript
// 任意の時点での状態を理解
await memory.remember("プロジェクト開始", "2024-01-01");
await memory.remember("プロジェクト一時停止", "2024-03-01");
await memory.remember("プロジェクト再開", "2024-06-01");
await memory.remember("プロジェクト完了", "2024-09-01");

await memory.ask("2月のプロジェクトステータスは？");
// "アクティブ" (開始済みだが未停止)

await memory.ask("4月のプロジェクトステータスは？");
// "一時停止中" (停止済みだが未再開)
```

### 🔄 状態進化の追跡
状態遷移を自動的に処理し、相互排他的な状態を理解。

```typescript
// 役職は単一 - 新しい役職が古いものを置き換える
await memory.remember("山田さんがジュニアデベロッパーになった", "2020-01-01");
await memory.remember("山田さんがシニアデベロッパーになった", "2022-01-01");
await memory.remember("山田さんがテックリードになった", "2024-01-01");

// スキルは蓄積される
await memory.remember("山田さんがPythonを学んだ", "2019-01-01");
await memory.remember("山田さんがRustを学んだ", "2021-01-01");
await memory.remember("山田さんがGoを学んだ", "2023-01-01");

await memory.ask("山田さんの現在の役職は？");
// "テックリード" (単一状態)

await memory.ask("山田さんが知っている言語は？");
// "Python、Rust、Go" (蓄積された状態)
```

### 🌍 多言語サポート
あらゆる人間の言語でシームレスに動作。

```typescript
// 日本語
await memory.remember("田中さんがプロジェクトマネージャーになった", "2024-01-01");

// スペイン語
await memory.remember("María se mudó a Barcelona", "2024-02-01");

// フランス語
await memory.remember("Pierre a appris le machine learning", "2024-03-01");
```

## モダンクエリAPI

### 🔍 Fluentクエリビルダー

WhenMは人気のORMにインスパイアされたモダンでチェーン可能なクエリAPIを提供：

```typescript
// フィルタリングとページネーション
const events = await memory
  .query()
  .where({ subject: "田中" })
  .between("2024-01-01", "2024-12-31")
  .orderBy('time', 'desc')
  .limit(10)
  .execute();

// 全エンティティの最近のイベント
const recentActivity = await memory
  .query()
  .last(7, 'days')
  .orderBy('time', 'desc')
  .execute();

// 複数条件でフィルタリング
const learningEvents = await memory
  .query()
  .subject(["田中", "佐藤"])  // 複数の主体
  .verb("学んだ")             // 特定のアクション
  .last(30, 'days')           // 時間範囲
  .execute();

// ページネーションサポート
const page2 = await memory
  .query()
  .page(2, 20)  // 2ページ目、1ページ20件
  .execute();
```

### ⏱️ タイムラインAPI

エンティティに特化した時間クエリの専用API：

```typescript
const timeline = memory.timeline("田中");

// 特定時点の状態を取得
const snapshot = await timeline.at("2023-06-15");
console.log(snapshot.states);
// { role: "シニアエンジニア", location: "東京", skills: ["Python", "React"] }

// 2つの時点を比較
const changes = await timeline.compare("2023-01-01", "2024-01-01");
console.log(changes);
// {
//   added: { skills: ["TypeScript", "Go"] },
//   removed: {},
//   changed: { role: { from: "エンジニア", to: "シニアエンジニア" } }
// }

// 最近の変更を取得
const recent = await timeline.recent(30); // 過去30日

// 期間内の全イベント
const yearEvents = await timeline.between("2023-01-01", "2023-12-31");
```

### 📊 集計クエリ

```typescript
// イベント数をカウント
const eventCount = await memory
  .query()
  .where({ subject: "田中" })
  .count();

// ユニークな値を取得
const allSubjects = await memory.query().distinct('subject');
const allVerbs = await memory.query().distinct('verb');

// 存在チェック
const hasEvents = await memory
  .query()
  .where({ subject: "田中" })
  .exists();

// 最初のマッチするイベント
const firstPromotion = await memory
  .query()
  .verb("昇進")
  .orderBy('time', 'asc')
  .first();
```

### 🔎 検索とフィルタ

```typescript
// キーワードで検索
const promotions = await memory.search("昇進");
const engineerEvents = await memory.search("エンジニア");

// 最近のイベント（ヘルパーメソッド）
const lastWeek = await memory.recent(7);

// 複雑なフィルタリング
const complexQuery = await memory
  .query()
  .where({ verb: "学んだ" })
  .on("2024-01-15")  // 特定の日付
  .execute();
```

## 自然言語クエリ

### 🗣️ ダイレクト自然言語インターフェース

WhenMの真の力は、構造化された構文を必要とせずに、自然言語クエリを直接理解できることにあります：

```typescript
// 直接実行 - クエリをawaitするだけ
await memory.nl("アリスは先月何をしましたか？");
await memory.nl("2024年の全ての昇進を表示");
await memory.nl("過去6ヶ月でPythonを学んだのは誰？");

// またはより細かい制御のために修飾子をチェイン
await memory
  .nl("アリスは何をしたか")
  .during("先月")
  .limit(10);

await memory
  .nl("全てのイベントを表示")
  .about("ボブ")
  .recent(30);

// 美しさ：両方のスタイルがシームレスに動作！
```

### 🔮 自然言語処理の仕組み

1. **意図検出**: LLMがクエリを分析し、操作タイプ（クエリ、集計、タイムライン、比較）を判断

2. **エンティティ抽出**: 人物、日付、アクション、その他の関連エンティティを識別

3. **クエリ変換**: 自然言語をModern Query APIを使った構造化クエリに変換

4. **スマートルーティング**: 適切なハンドラ（クエリビルダー、タイムラインAPI、集計など）にルーティング

### 🎯 エレガントなチェイニング

`.nl()`メソッドは特別なチェイン可能なプロミスを返します - 直接awaitするか、修飾子を追加できます：

```typescript
// これらすべてが美しく動作します：

// 1. ダイレクトクエリ
const result = await memory.nl("アリスは何を学んだ？");

// 2. 時間制約付き
const recentLearning = await memory
  .nl("アリスは何を学んだか")
  .during("去年");

// 3. エンティティフォーカス付き
const bobEvents = await memory
  .nl("全てのイベントを表示")
  .about("ボブ")
  .limit(5);

// 4. ショートハンドメソッドを使用
const weekActivity = await memory
  .nl("何が起きたか")
  .recent(7);  // 過去7日間

// 5. 複数の修飾子
const complexQuery = await memory
  .nl("学習イベントを検索")
  .about(["アリス", "ボブ"])
  .during("2024年")
  .orderBy("最新順")
  .limit(10);
```

### 📝 サポートされているクエリタイプ

#### 情報クエリ
- "XのYは何ですか？" - 特定時点の状態クエリ
- "Xはいつ起きましたか？" - 時間的クエリ
- "誰がXしましたか？" - エンティティクエリ
- "Xは何回ありましたか？" - カウントクエリ

#### タイムラインクエリ
- "Xの履歴を表示" - 完全なタイムライン
- "YとZの間でXに何が変わった？" - 比較
- "1月のXのステータス" - スナップショットクエリ

#### 集計クエリ
- "全てのXをカウント" - シンプルなカウント
- "全てのユニークなXをリスト" - 重複のない値
- "Xの最初/最後の発生" - 境界クエリ

#### 検索クエリ
- "全てのXを検索" - キーワード検索
- "Z期間内のYを検索" - フィルタ付き検索
- "Xを含むイベント" - コンテンツ検索

### 🌐 多言語自然クエリ

自然言語クエリはあらゆる言語で動作します：

```typescript
// 日本語
await memory.nl("田中さんの現在の役職は？");
await memory.nl("今年誰がリーダーになりましたか？");

// 英語
await memory.nl("What did Bob learn last year?");
await memory.nl("Show me all events from January");

// スペイン語
await memory.nl("¿Qué aprendió María el año pasado?");
await memory.nl("Muéstrame todos los eventos de enero");

// フランス語
await memory.nl("Qu'est-ce que Pierre a fait en 2024?");
await memory.nl("Combien de fois Alice a-t-elle appris quelque chose?");
```

## 高度な使い方

### プロバイダーオプション

```typescript
// Cloudflare Workers AI (エッジ最適化)
const cf = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  model: '@cf/openai/gpt-oss-120b' // オプション、デフォルトはgpt-oss-120b
});

// Groq (最速推論)
const groq = await WhenM.groq(process.env.GROQ_API_KEY, {
  model: 'llama-3.3-70b-versatile' // オプション
});

// Google Gemini (最高性能)
const gemini = await WhenM.gemini(process.env.GEMINI_API_KEY, {
  model: 'gemini-1.5-pro' // オプション
});
```

### 環境変数からの自動検出

```typescript
import { whenm } from '@aid-on/whenm';

// 環境変数からプロバイダーを自動検出
const memory = await whenm.auto();
```

### カスタム永続化

```typescript
// Cloudflare D1 データベースと組み合わせて
const memory = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  persistence: {
    d1: env.DB, // D1データベースバインディング
    namespace: 'my-app' // マルチテナンシー用のオプションの名前空間
  }
});
```

### エンジンへの直接アクセス

高度な使用例では、基礎となるエンジンにアクセスできます：

```typescript
const memory = await WhenM.cloudflare({ /* ... */ });

// 生のエンジンにアクセス
const engine = memory.getEngine();

// Prologクエリを直接実行
const results = await engine.query('holds_at(role(alice, X), "2024-01-01")');

// カスタムPrologルールをロード
await engine.loadFacts(`
  initiates(graduated(P, School), alumni(P, School)).
  terminates(expelled(P, School), student(P, School)).
`);
```

## アーキテクチャ

### 🔄 データフロー：思考から記憶、そして洞察へ

**イベント記録のフロー:**

```
🗣️ 「田中さんがCTOになった」
        ↓
🧠 LLMパーサ
   → 抽出: {subject: "田中", verb: "became", object: "CTO"}
        ↓
📝 イベント生成
   → 作成: event("田中", "became", "CTO")
        ↓
⚡ PROLOGエンジン
   → 記録: initiates(event(...), role("田中", "CTO"))
   → 記録: terminates(event(...), role("田中", _))
   → 記録: happens(event(...), "2024-01-01")
        ↓
💾 知識ベース
   → 時間事実として保存、即座に推論可能
```

**知識クエリのフロー:**

```
❓ 「2023年の田中さんの役職は？」
        ↓
🧠 LLMパーサ
   → 抽出: queryType: "what"
   → 抽出: subject: "田中"
   → 抽出: predicate: "role"
   → 抽出: timeframe: "2023"
        ↓
🔍 PROLOGクエリ
   → 実行: holds_at(role("田中", X), "2023-12-31")
        ↓
📊 時間推論
   → Event Calculusが発見: X = "シニアエンジニア"
        ↓
💬 LLMフォーマッタ
   → 生成: 「2023年の田中さんはシニアエンジニアでした」
```

#### 📥 **イベント記録** (自然言語 → 知識)

```typescript
await memory.remember("田中さんが1月にCTOになった", "2024-01-01");
```

1. **LLM理解**
   - 抽出: `{subject: "田中", verb: "became", object: "CTO"}`
   - 識別: これは役職変更（単一状態）
   
2. **Prolog事実生成**
   ```prolog
   % 新しい役職を開始
   initiates(event("田中", "became", "CTO"), role("田中", "CTO")).
   % 古い役職を終了
   terminates(event("田中", "became", "CTO"), role("田中", _)).
   % イベント発生
   happens(event("田中", "became", "CTO"), "2024-01-01").
   ```

3. **知識ベース更新**
   - Trealla Prologのメモリ内データベースに事実を保存
   - 時間推論に即座に利用可能

#### 🔍 **知識クエリ** (質問 → 時間推論 → 回答)

```typescript
const answer = await memory.ask("2023年の田中さんの役職は？");
```

1. **LLMクエリ理解**
   - 抽出: `{queryType: "what", subject: "田中", predicate: "role", timeframe: "2023"}`
   
2. **Prolog時間クエリ**
   ```prolog
   ?- holds_at(role("田中", X), "2023-12-31").
   % Event Calculusが2023-12-31以前の最後の役職変更を検索
   X = "シニアエンジニア"
   ```

3. **LLM応答生成**
   - Prolog結果: `X = "シニアエンジニア"`
   - 自然な応答生成: 「2023年の田中さんはシニアエンジニアでした」

### Event Calculus 基盤

WhenMは形式的なEvent Calculus述語を使用：

- `happens(Event, Time)` - 特定の時間にイベントが発生
- `initiates(Event, Fluent)` - イベントが状態を開始
- `terminates(Event, Fluent)` - イベントが状態を終了
- `holds_at(Fluent, Time)` - 特定の時間に状態が真

### パフォーマンス

- **挿入速度**: >25,000イベント/秒
- **クエリ速度**: 典型的なクエリで約1-30ms
- **メモリ効率**: エッジデプロイ向けに最適化
- **WebAssembly**: Trealla PrologがWASMで動作し、移植性を確保

## ユースケース

### 🤖 対話型AI
チャットボットに過去の会話とユーザー履歴の記憶を与える。

### 📊 ビジネスインテリジェンス
組織の変化、従業員の昇進、ビジネスの進化を追跡。

### 🎮 ゲーム開発
ゲーム世界の状態、プレイヤーの進捗、ナラティブの歴史を維持。

### 🏥 ヘルスケア
患者の履歴、治療の進展、医療タイムラインを追跡。

### 📚 教育
学生の進捗、スキル開発、学習パスを監視。

## なぜRAGではないのか？

従来のRAG（検索拡張生成）には根本的な制限があります：

| 側面 | RAG | WhenM |
|------|-----|-------|
| 時間理解 | ❌ 時間の概念なし | ✅ ネイティブな時間推論 |
| 状態変化 | ❌ 進化を追跡できない | ✅ 状態遷移を理解 |
| 時点クエリ | ❌ すべての一致を返す | ✅ 特定時点の状態を返す |
| 矛盾 | ❌ 相反する事実を返す可能性 | ✅ タイムラインに基づいて解決 |
| ストレージ効率 | ❌ 冗長な埋め込みを保存 | ✅ イベントのみを保存 |

## コントリビューション

貢献を歓迎します！詳細は[コントリビューションガイド](CONTRIBUTING.md)をご覧ください。

## ライセンス

MIT © Aid-On Team

## 謝辞

- Andrew Davison氏による[Trealla Prolog](https://github.com/trealla-prolog/trealla)上に構築
- 古典的AI時間推論研究にインスパイア
- 自然言語理解のための最新LLMによって動作