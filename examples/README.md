# WhenM Examples

This directory contains practical examples demonstrating how to use WhenM for temporal reasoning and event tracking.

## Examples

### 1. Basic Usage (`basic-usage.js`)
- Simple event recording and querying
- Current and historical state queries
- Shows core Event Calculus functionality

```bash
node examples/basic-usage.js
```

### 2. Complex Timeline (`complex-timeline.js`)
- Handling overlapping life events
- Career progression tracking
- Multi-faceted state queries
- Timeline analysis

```bash
node examples/complex-timeline.js
```

### 3. LLM Integration (`llm-integration.js`)
- Natural language event recording
- Complex reasoning queries
- Automatic date extraction
- Reasoning chain demonstration

```bash
# Requires GROQ API key
export GROQ_API_KEY=your-api-key
node examples/llm-integration.js
```

## Key Concepts Demonstrated

### Temporal Reasoning
- Events happen at specific times
- States persist until changed
- Historical queries work at any point in time

### Event Types
- **Accumulating**: Skills, knowledge, possessions (can have multiple)
- **Singular**: Location, role, employment (only one at a time)
- **Temporal**: Learning, projects (have start and end)

### Query Patterns
- Simple state queries: "Does X know Y?"
- Historical queries: "What was X's job in 2022?"
- Complex reasoning: "What happened to X's project?"

## Running Examples

1. Install dependencies:
```bash
npm install
```

2. Run examples:
```bash
# Basic example (no API key needed)
node examples/basic-usage.js

# Complex timeline (no API key needed)
node examples/complex-timeline.js

# LLM integration (requires GROQ API key)
export GROQ_API_KEY=your-api-key
node examples/llm-integration.js
```

## Creating Your Own Examples

WhenM is designed to be intuitive:

```javascript
import { createWhenMEngine } from '@aid-on/whenm';

const engine = await createWhenMEngine();

// Record events
await engine.record('user learned Python', '2024-01-01');

// Query state
const result = await engine.ask('Does user know Python?', '2024-06-01');
console.log(result.answer); // true

await engine.destroy();
```

## Use Cases

- **Personal History Tracking**: Track life events, skills, relationships
- **Project Management**: Track project states, team changes, milestones
- **Character Development**: Game or story characters with evolving states
- **Audit Systems**: Track changes and query historical states
- **Learning Systems**: Track knowledge acquisition and skill development