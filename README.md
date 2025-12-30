# WhenM

[English](README.md) | [日本語](README.ja.md)

[![CI](https://github.com/Aid-On/whenm/actions/workflows/ci.yml/badge.svg)](https://github.com/Aid-On/whenm/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@aid-on/whenm.svg)](https://www.npmjs.com/package/@aid-on/whenm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Temporal memory system that understands **when** things happened, not just what happened

## What is WhenM?

WhenM is a **schemaless temporal memory system** that gives AI applications the ability to understand time, state changes, and causality. Unlike traditional databases or RAG systems, WhenM natively understands that facts change over time.

### Core Difference from RAG

| Aspect | RAG | WhenM |
|--------|-----|-------|
| **Time Understanding** | ❌ None | ✅ Native temporal reasoning |
| **State Changes** | ❌ Can't track | ✅ Tracks all transitions |
| **Contradictions** | ❌ Returns all versions | ✅ Resolves by timeline |
| **Schema** | ⚠️ Predefined | ✅ Completely schemaless |
| **Query** | "What is X?" | "What was X at time Y?" |

## Quick Start

```bash
# Install
npm install @aid-on/whenm

# Setup (copy and edit .env)
cp .env.example .env
```

```typescript
import { WhenM } from '@aid-on/whenm';

// Initialize (uses mock LLM by default, or your API keys from .env)
const memory = await WhenM.auto();

// Or explicitly use mock for testing
const memory = await WhenM.mock();

// Or use Groq (recommended for production)
const memory = await WhenM.groq({
  apiKey: process.env.GROQ_API_KEY  // Get from https://console.groq.com/keys
});

// Remember events - any language, any domain
await memory.remember("Alice joined as engineer", "2020-01-15");
await memory.remember("Alice became team lead", "2022-06-01");
await memory.remember("ピカチュウが10万ボルトを覚えた", "2023-01-01");

// Ask temporal questions
await memory.ask("What was Alice's role in 2021?");
// → "engineer"

await memory.ask("アリスの現在の役職は？");
// → "team lead"

await memory.ask("ピカチュウはいつ10万ボルトを覚えた？");
// → "2023年1月1日"
```

## Key Features

### 🌍 Truly Schemaless
No schemas, no configuration, no entity definitions. WhenM understands any concept in any language through LLM integration.

```typescript
// Gaming domain
await memory.remember("Mario collected a fire flower", "2024-01-01");

// Cooking domain  
await memory.remember("Added salt to the soup", "2024-02-01");

// Business domain
await memory.remember("田中さんが部長になった", "2024-03-01");

// All work without any setup!
```

### ⏰ Temporal Reasoning
Built on formal Event Calculus, providing mathematically sound temporal logic for natural language queries about time and state changes.

### 🌐 Any Language, Any Domain
The query refinement layer automatically handles multiple languages and domains.

```typescript
// Japanese gaming
await memory.remember("ピカチュウが10万ボルトを覚えた");

// Spanish daily life
await memory.remember("El gato subió al árbol");

// English with emojis
await memory.remember("🚀 launched to Mars");
```

## Installation

```bash
npm install @aid-on/whenm
```

## Usage

### Basic Setup

```typescript
import { WhenM } from '@aid-on/whenm';

// Simple string format (provider:apikey)
const memory = await WhenM.create('groq:your-api-key');

// With model specification
const memory = await WhenM.create('groq:your-api-key:llama-3.3-70b-versatile');

// Unified config object
const memory = await WhenM.create({
  provider: 'groq',
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile'
});

// Provider-specific helpers
const memory = await WhenM.groq(process.env.GROQ_API_KEY);
const memory = await WhenM.gemini(process.env.GEMINI_API_KEY);
const memory = await WhenM.cloudflare({
  apiKey: process.env.CLOUDFLARE_API_KEY,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  email: process.env.CLOUDFLARE_EMAIL
});
```

### Recording Events

```typescript
// Simple event
await memory.remember("Project started", "2024-01-01");

// Complex state change
await memory.remember("Bob promoted to manager", "2024-06-01");

// Multilingual
await memory.remember("実験が成功した", "2024-07-01");
```

### Querying

```typescript
// Natural language queries
await memory.ask("What happened in January?");
await memory.ask("Who became manager this year?");
await memory.ask("プロジェクトの現在の状態は？");

// Structured queries
const events = await memory
  .query()
  .subject("Alice")
  .between("2024-01-01", "2024-12-31")
  .execute();

// Timeline analysis
const timeline = memory.timeline("Project-X");
const statusInMarch = await timeline.at("2024-03-15");
const recentChanges = await timeline.recent(30); // last 30 days
```

## Advanced Features

### Query Refinement Layer

WhenM includes a sophisticated refinement layer that standardizes queries across languages:

```typescript
// These all work seamlessly:
await memory.ask("What is Alice's role?");
await memory.ask("アリスの役職は？");
await memory.ask("¿Cuál es el rol de Alice?");
```

### Enable Query Refinement

For better multilingual support:

```typescript
const memory = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  enableRefiner: true  // Enable multilingual query refinement
});
```

### Persistence (Plugin System) - 🧪 EXPERIMENTAL

> ⚠️ **Note**: The persistence feature is experimental and has not been fully tested in production. Use with caution.

WhenM provides a pluggable persistence layer for durable storage:

#### Memory Persistence (Default)
```typescript
// Default - events stored in memory only
const memory = await WhenM.cloudflare(config);
```

#### D1 Database Persistence
```typescript
// Cloudflare D1 for durable storage
const memory = await WhenM.cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  persistenceType: 'd1',
  persistenceOptions: {
    database: env.DB,           // D1 database binding
    tableName: 'whenm_events',  // Optional: custom table name
    namespace: 'my-app'         // Optional: namespace for multi-tenancy
  }
});

// Save current state
await memory.persist();

// Restore from database
await memory.restore();

// Restore with filters
await memory.restore({
  timeRange: { from: '2024-01-01', to: '2024-12-31' },
  limit: 1000
});

// Check persistence stats
const stats = await memory.persistenceStats();
console.log(`Total persisted events: ${stats.totalEvents}`);
```

#### Custom Persistence Plugin
```typescript
// Implement your own persistence
class MyCustomPersistence {
  async save(event) { /* ... */ }
  async load(query) { /* ... */ }
  async stats() { /* ... */ }
  // ... other required methods
}

const memory = await WhenM.cloudflare({
  // ... config
  persistenceType: 'custom',
  persistenceOptions: new MyCustomPersistence()
});
```

#### Persistence API
```typescript
// Core persistence methods
await memory.persist();                    // Save all events to storage
await memory.restore();                    // Load all events from storage
await memory.restore({ limit: 100 });      // Load with query filters
const stats = await memory.persistenceStats(); // Get storage statistics

// Export/Import Prolog format
const prolog = await memory.exportProlog();
await memory.importProlog(prolog);
```

## Architecture

WhenM combines three powerful technologies:

1. **Event Calculus** - Formal temporal logic for reasoning about time
2. **Trealla Prolog** - High-performance logical inference engine (WASM)
3. **LLM Integration** - Natural language understanding without schemas

### Data Flow: How It Works

The system processes information through 5 stages:

```
Input → Language Normalization → Semantic Decomposition → Temporal Logic → Response
```

#### Example: Recording an Event

**Input:**
```typescript
await memory.remember("太郎がマネージャーになった", "2024-03-01");
```

**Stage 1: Language Normalization**
```json
{
  "original": "太郎がマネージャーになった",
  "language": "ja",
  "refined": "Taro became manager",
  "entities": ["Taro"]
}
```

**Stage 2: Semantic Analysis (LLM)**
```json
{
  "subject": "taro",
  "verb": "became",
  "object": "manager",
  "temporalType": "STATE_UPDATE",
  "affectedFluent": {
    "domain": "role",      // Dynamically determined
    "value": "manager",
    "isExclusive": true    // Only one role at a time
  }
}
```

**Stage 3: Prolog Facts Generation**
```prolog
event_fact("evt_1234", "taro", "became", "manager").
happens("evt_1234", 1709251200000).
initiates("evt_1234", role("taro", "manager")).
is_exclusive_domain(role).
```

#### Example: Querying Information

**Input:**
```typescript
await memory.ask("What is Taro's current role?");
```

**Prolog Query:**
```prolog
current_state("taro", role, Value)
```

**Event Calculus Processing:**
- Finds latest `initiates("evt_1234", role("taro", "manager"))`
- Checks no newer role changes exist (clipping check)
- Returns: `Value = "manager"`

### True Schemaless Design

Traditional systems require predefined schemas:
```typescript
// ❌ Hardcoded approach
if (verb === "became") domain = "role";
if (verb === "learned") domain = "skill";
```

WhenM dynamically understands any concept:
```typescript
// ✅ Dynamic understanding
"ピカチュウが10万ボルトを覚えた" → {domain: "skill", value: "thunderbolt", isExclusive: false}
"Robot battery at 80%" → {domain: "battery", value: "80", isExclusive: true}
"Alien transformed into energy" → {domain: "form", value: "energy", isExclusive: true}
```

The LLM determines the semantic meaning, domain, and exclusivity rules dynamically, enabling the system to handle any new concept without code changes.

## Performance

- **Insert Speed**: 25,000+ events/second
- **Query Speed**: 1-30ms for typical queries  
- **Memory**: Optimized for edge (runs in Cloudflare Workers)
- **Languages**: Any human language supported

## Use Cases

### 🏢 Employee Performance & Career Tracking
```typescript
const hr = await WhenM.cloudflare(config);

// Track career progression with full context
await hr.remember("Sarah joined as Junior Developer", "2021-01-15");
await hr.remember("Sarah completed React certification", "2021-06-20");
await hr.remember("Sarah led the payment module project", "2021-09-01");
await hr.remember("Sarah promoted to Senior Developer", "2022-01-15");
await hr.remember("Sarah became Tech Lead", "2023-06-01");

// Temporal performance queries
const review = await hr.ask("What achievements led to Sarah's promotion to Senior?");
// → "Completed React certification and successfully led payment module project"

// Compare growth between employees
const sarahGrowth = await hr.timeline("Sarah").compare("2021-01-15", "2024-01-15");
const johnGrowth = await hr.timeline("John").compare("2021-01-15", "2024-01-15");
// → Objective career progression comparison

// Find high performers
const fastGrowth = await hr.query()
  .verb(["promoted", "awarded", "recognized"])
  .last(12, 'months')
  .distinct('subject');
// → List of employees with recent achievements
```

### 🏥 Patient Medical History & Treatment Evolution
```typescript
const medical = await WhenM.cloudflare(config);

// Complex medical timeline
await medical.remember("Patient diagnosed with hypertension", "2020-03-15");
await medical.remember("Started lisinopril 10mg daily", "2020-03-20");
await medical.remember("Blood pressure improved to 130/80", "2020-06-15");
await medical.remember("Developed dry cough side effect", "2020-09-01");
await medical.remember("Switched to losartan 50mg", "2020-09-05");
await medical.remember("血圧が正常値に安定", "2021-01-15"); // Multilingual support

// Critical temporal queries for treatment decisions
const currentMeds = await medical.timeline("Patient").now();
// → Current medication and conditions

const medicationHistory = await medical.ask("Why was the medication changed in September 2020?");
// → "Lisinopril caused dry cough side effect, switched to losartan"

// Track treatment effectiveness over time
const bpHistory = await medical.query()
  .subject("Patient")
  .verb(["measured", "recorded"])
  .object("blood pressure")
  .last(6, 'months')
  .orderBy('time', 'asc')
  .execute();
// → Blood pressure trends for treatment evaluation
```

### 🤖 AI Agent Memory & Learning System
```typescript
const agent = await WhenM.cloudflare(config);

// Agent learns and adapts over time
await agent.remember("User prefers TypeScript over JavaScript", "2024-01-01");
await agent.remember("User works in Tokyo timezone", "2024-01-05");
await agent.remember("User dislikes verbose explanations", "2024-01-10");
await agent.remember("Failed to solve bug with approach A", "2024-02-01");
await agent.remember("Successfully solved bug with approach B", "2024-02-01");

// Context-aware responses based on temporal memory
const preferences = await agent.timeline("User").states();
// → All current user preferences and learned patterns

const debugging = await agent.ask("What debugging approach should I try?");
// → "Use approach B, as approach A previously failed"

// Learn from interaction patterns
const interactions = await agent.query()
  .verb(["failed", "succeeded", "errored"])
  .last(30, 'days')
  .execute();
// → Analyze success/failure patterns to improve
```

### 📊 Real-time Incident Management & RCA
```typescript
const ops = await WhenM.cloudflare(config);

// Track incident timeline
await ops.remember("CPU usage spiked to 95%", "2024-03-15 14:30");
await ops.remember("Database connection pool exhausted", "2024-03-15 14:31");
await ops.remember("API response time degraded to 5s", "2024-03-15 14:32");
await ops.remember("Deployed hotfix PR #1234", "2024-03-15 14:45");
await ops.remember("System recovered", "2024-03-15 14:50");

// Root cause analysis with temporal reasoning
const rca = await ops.ask("What caused the API degradation?");
// → "CPU spike led to connection pool exhaustion, causing API degradation"

// Pattern detection across incidents
const patterns = await ops.query()
  .verb(["spiked", "exhausted", "degraded"])
  .last(90, 'days')
  .execute();
// → Identify recurring issues

// Automated incident correlation
const correlation = await ops.timeline("System")
  .between("2024-03-15 14:00", "2024-03-15 15:00");
// → Complete incident timeline for postmortem
```

### 💰 Financial Audit Trail & Compliance
```typescript
const audit = await WhenM.cloudflare(config);

// Maintain complete audit trail
await audit.remember("Account opened by John", "2023-01-15");
await audit.remember("KYC verification completed", "2023-01-16");
await audit.remember("$50,000 deposited from Chase Bank", "2023-02-01");
await audit.remember("Flagged for unusual activity", "2023-03-15");
await audit.remember("Manual review cleared", "2023-03-16");
await audit.remember("Account upgraded to Premium", "2023-06-01");

// Compliance queries
const kycStatus = await audit.ask("Was KYC completed before the first transaction?");
// → "Yes, KYC completed on Jan 16, first transaction on Feb 1"

// Suspicious activity tracking
const flagged = await audit.query()
  .verb(["flagged", "suspended", "investigated"])
  .between("2023-01-01", "2023-12-31")
  .execute();
// → All compliance events for regulatory reporting

// Account state at any point for legal inquiries
const snapshot = await audit.timeline("Account")
  .at("2023-03-15");
// → Exact account state when flagged
```

### 🎮 Game State & Player Progression
```typescript
const game = await WhenM.cloudflare(config);

// Rich player history
await game.remember("Player discovered hidden dungeon", "2024-01-01 10:00");
await game.remember("Player defeated Dragon Boss", "2024-01-01 11:30");
await game.remember("Player earned 'Dragon Slayer' title", "2024-01-01 11:31");
await game.remember("Player joined guild 'Knights'", "2024-01-02");
await game.remember("ギルド戦で勝利した", "2024-01-03"); // Multilingual

// Personalized gameplay based on history
const achievements = await game.timeline("Player").states();
// → All titles, skills, and progression

// Quest eligibility based on temporal conditions
const eligible = await game.ask("Can player start the 'Ancient Evil' quest?");
// → "Yes, player has defeated Dragon Boss and joined a guild"

// Leaderboard with time-based scoring
const weeklyChamps = await game.query()
  .verb(["defeated", "completed", "won"])
  .last(7, 'days')
  .distinct('subject');
// → This week's most active players
```

### 🏭 IoT Sensor Network & Predictive Maintenance
```typescript
const iot = await WhenM.cloudflare(config);

// Continuous sensor monitoring
await iot.remember("Machine-A vibration increased to 0.8mm/s", "2024-03-01");
await iot.remember("Machine-A temperature at 75°C", "2024-03-02");
await iot.remember("Machine-A bearing noise detected", "2024-03-03");
await iot.remember("Machine-A scheduled maintenance", "2024-03-05");
await iot.remember("Machine-A bearing replaced", "2024-03-05");

// Predictive maintenance queries
const warning = await iot.ask("What signs preceded the bearing failure?");
// → "Vibration increased, temperature rose, then noise detected"

// Pattern recognition across fleet
const maintenance = await iot.query()
  .verb(["increased", "detected", "failed"])
  .last(30, 'days')
  .execute();
// → Identify machines showing similar patterns

// Optimal maintenance scheduling
const machineState = await iot.timeline("Machine-A")
  .compare("2024-02-01", "2024-03-01");
// → Degradation rate for maintenance planning
```

## API Reference

### Core Methods

#### `memory.remember(event: string, date?: string | Date)`
Records an event at a specific time.

#### `memory.ask(question: string)`
Answers questions using temporal reasoning.

#### `memory.query()`
Returns a query builder for structured searches.


### Query Builder API

Complete fluent interface for structured queries:

```typescript
// Basic query methods
memory.query()
  .where({ subject: "Alice", verb: "learned" })  // Filter by multiple conditions
  .subject("Alice")                              // Filter by entity (string or array)
  .verb(["learned", "studied"])                  // Filter by action (string or array)
  .object("Python")                               // Filter by target/object
  .between("2024-01-01", "2024-12-31")          // Time range filter
  .on("2024-06-15")                              // Specific date
  .last(30, 'days')                              // Recent time period (days/weeks/months/years)
  .orderBy('time', 'desc')                       // Sort (time/subject/verb/object, asc/desc)
  .limit(10)                                      // Limit results
  .offset(20)                                     // Skip results (pagination)
  .page(2, 10)                                    // Page number and size
  .execute()                                      // → Promise<Event[]>

// Aggregation methods
.count()                  // → Promise<number> - Count matching events
.exists()                 // → Promise<boolean> - Check if any match
.first()                  // → Promise<Event | null> - Get first match
.distinct('subject')      // → Promise<string[]> - Get unique values

// Chaining example
const recentLearning = await memory.query()
  .subject(["Alice", "Bob"])
  .verb("learned")
  .last(90, 'days')
  .orderBy('time', 'desc')
  .limit(5)
  .execute();
```


## Requirements

- Node.js 18+
- LLM Provider API credentials (required - one of the following):
  - Cloudflare AI (account ID, API key, email)
  - Groq API key
  - Google Gemini API key

## Environment Variables

```bash
# Cloudflare AI
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_EMAIL=your_email

# Or Groq
GROQ_API_KEY=your_groq_key

# Or Gemini
GEMINI_API_KEY=your_gemini_key
```

## Testing

```bash
# Run unit tests only (fast)
npm run test:unit

# Run integration tests only (requires API keys or uses mock)
npm run test:integration

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Roadmap

### Upcoming Features
- **Timeline API**: Full state tracking and temporal snapshots
  - `timeline.at(time)` - Complete state at any point in time
  - `timeline.states()` - Current state tracking
  - `timeline.compare()` - State change analysis
- **Advanced Persistence**: Additional storage backends
- **Performance Optimizations**: Faster Prolog integration
- **Extended Language Support**: More LLM providers

## License

MIT © Aid-On

## Credits

WhenM stands on the shoulders of giants:

### Core Technologies
- **[Trealla Prolog](https://github.com/trealla-prolog/trealla)** - WebAssembly-powered Prolog engine providing the logical reasoning foundation
- **[Event Calculus](https://en.wikipedia.org/wiki/Event_calculus)** - Formal temporal logic framework for rigorous time-based reasoning
- **[@aid-on/unillm](https://www.npmjs.com/package/@aid-on/unillm)** - Unified LLM interface enabling seamless multi-provider support

### Special Thanks
- The Trealla Prolog team for their excellent WASM implementation
- The Event Calculus research community for decades of temporal logic advancement
- The Aid-On team for continuous support and innovation