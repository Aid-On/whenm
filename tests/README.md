# WhenM Tests

## ディレクトリ構成

### `/locomo`
LoCoMo (Long-term Conversational Memory) ベンチマークテスト
- `test-locomo-load.js` - データ読み込み
- `test-locomo-query.js` - クエリテスト
- `test-locomo-massive.js` - 大規模データテスト（100+イベント）

### `/integration`
統合テストと自然言語クエリテスト
- `test-natural-language.js` - NLクエリ全般
- `test-cloudflare-*.js` - Cloudflare Workers AI統合
- `test-live-*.js` - 実APIテスト

### `/debug`
デバッグとトラブルシューティング用
- `test-debug-*.js` - 各種デバッグツール
- `test-who-*.js` - WHOクエリデバッグ
- `test-compound-*.js` - 複合イベント分解

### `/examples`
使用例とシナリオテスト
- `test-readme-*.js` - READMEの例の検証
- `test-validation-scenarios.js` - バリデーションシナリオ

## 実行方法

```bash
# 特定のテストを実行
node tests/locomo/test-locomo-massive.js

# LoCoMoベンチマーク実行（順序重要）
node tests/locomo/test-locomo-load.js    # データ準備
node tests/locomo/test-locomo-query.js   # クエリテスト

# Cloudflare統合テスト
node tests/integration/test-live-en.js
```