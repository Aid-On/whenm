# WhenM Project Structure

## 📁 Directory Organization

```
packages/whenm/
├── src/                     # Core source files
│   ├── index.ts            # Main entry point & exports
│   ├── final-engine.ts     # Unified schemaless engine (main implementation)
│   ├── llm-powered-engine.ts # LLM-powered schemaless engine
│   ├── proxy-entity.ts     # Dynamic property access via Proxy
│   ├── truly-schemaless-v2.ts # Zero-mapping schemaless engine
│   ├── unix-time-engine.ts # Millisecond precision temporal engine
│   ├── unified-api.ts      # Unified API layer
│   ├── entity-api.ts       # Entity manipulation API
│   ├── prolog-parser.ts    # Prolog query parser
│   ├── nlp-parser.ts       # Natural language parser
│   ├── simple-api.ts       # Simplified API
│   ├── smart-assert.ts     # Intelligent assertions
│   ├── persistence.ts      # D1 persistence layer
│   ├── tools.ts            # Utility functions
│   └── _experimental/      # Experimental implementations (archived)
│       ├── schemaless-engine.ts
│       ├── llm-schemaless.ts
│       ├── kuromoji-schemaless.ts
│       ├── truly-schemaless.ts
│       ├── locale-strategy.ts
│       ├── sliding-window.ts
│       └── time-precision.ts
│
├── examples/               # Example code & tests
│   ├── tests/             # Primary test examples
│   │   ├── 01-unified-engine.js     # Main unified engine test
│   │   ├── 02-llm-powered.js        # LLM-powered engine test
│   │   ├── 03-llm-real-api.js       # Real API integration test
│   │   ├── 04-truly-schemaless.js   # Zero-mapping engine test
│   │   └── 05-basic-schemaless.js   # Basic schemaless test
│   │
│   └── _experimental/     # Experimental tests (archived)
│       ├── test-comprehensive-comparison.js
│       ├── test-final-analysis.js
│       ├── test-llm-schemaless.js
│       ├── test-minimal.js
│       ├── test-no-preset.js
│       ├── test-prolog-debug.js
│       ├── test-schemaless-debug.js
│       ├── test-schemaless-deep.js
│       └── test-truly-schemaless.js
│
├── prolog/                 # Prolog rules & Event Calculus
│   └── ec.pl              # Event Calculus core rules
│
├── benchmarks/            # Performance benchmarks
│   └── ...
│
├── dist/                  # Compiled JavaScript output
│   └── ...
│
├── README.md              # User-facing documentation
├── README-old.md          # Previous version documentation
├── PROJECT_STRUCTURE.md  # This file
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
└── vitest.config.ts       # Test configuration
```

## 🎯 Core Files

### Main Implementation
- **`final-engine.ts`** - The unified schemaless engine that combines all approaches
  - Integrates with UniLLM for multiple LLM providers
  - Dynamic verb learning
  - ProxyEntity support
  - Knowledge export capability

### Supporting Engines
- **`llm-powered-engine.ts`** - LLM-based natural language processing
- **`truly-schemaless-v2.ts`** - Pure schemaless with zero predefined mappings
- **`proxy-entity.ts`** - Dynamic property access without schema
- **`unix-time-engine.ts`** - High-precision temporal operations

## 🧪 Test Organization

### Primary Tests (`examples/tests/`)
Tests are numbered for recommended execution order:
1. `01-unified-engine.js` - Complete unified engine functionality
2. `02-llm-powered.js` - LLM integration with mock provider
3. `03-llm-real-api.js` - Real API integration (requires API key)
4. `04-truly-schemaless.js` - Zero-mapping implementation
5. `05-basic-schemaless.js` - Basic schemaless operations

### Running Tests
```bash
# Run main unified engine test
node examples/tests/01-unified-engine.js

# Run with real API (requires GROQ_API_KEY)
GROQ_API_KEY=your_key node examples/tests/03-llm-real-api.js
```

## 🗂️ Archived/Experimental

Files in `_experimental` directories are previous iterations kept for reference but not part of the main implementation:
- Different schemaless approaches (NLP-based, Kuromoji, etc.)
- Performance experiments
- Alternative implementations

## 🏗️ Build & Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run specific test
node examples/tests/01-unified-engine.js
```

## 📝 Key Concepts

1. **Schemaless Operation** - No predefined verb mappings or schemas required
2. **Dynamic Learning** - Learns new verbs and concepts on the fly
3. **Temporal Reasoning** - Event Calculus for time-based logic
4. **Multi-Language** - Works with Japanese, English, or any language
5. **LLM Integration** - Uses LLMs for natural language understanding

## 🔄 Migration Path

If upgrading from schema-based version:
1. Use `createUnifiedEngine()` instead of `createWhenM()`
2. Remove all schema.ts dependencies
3. No need to define verb mappings
4. Works immediately with any language/domain