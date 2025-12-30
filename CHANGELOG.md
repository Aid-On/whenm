# Changelog

## [0.3.3] - 2025-12-30

### 🎉 Initial Release

**WhenM** - Time-aware memory system for LLMs with Event Calculus and Prolog reasoning

### Features

- **Schemaless Temporal Memory**: Remember and query events in any language without predefined schemas
- **Event Calculus Reasoning**: Mathematically sound temporal logic based on formal Event Calculus
- **Multi-Language Support**: Works with English, Japanese, and any other language
- **LLM Integration**: Supports multiple providers (Groq, Gemini, Cloudflare Workers AI)
- **Time-aware Queries**: Answer complex temporal questions like "What was X's role in 2021?"

### Core API

- `remember(event, date)` - Store temporal events
- `ask(question)` - Query with natural language using Event Calculus reasoning
- `search(keyword)` - Search events containing keywords
- `recent(days)` - Get recent events

### Performance

- 90% accuracy on Locomo temporal reasoning benchmark (9/10 correct)
- Average response time: ~1100ms per complex query

### Dependencies

- `@aid-on/unillm` - LLM provider abstraction
- `compromise` - Natural language processing
- `trealla` - Prolog reasoning engine for Event Calculus