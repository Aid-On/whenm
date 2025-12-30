# WhenM Performance Benchmarks

Performance benchmarks for the WhenM Event Calculus temporal reasoning engine.

## Running Benchmarks

```bash
# Run all benchmarks
npm run benchmark

# Run specific benchmark file
npx vitest run benchmarks/event-calculus.bench.ts

# Run with detailed output
npx vitest bench --reporter=verbose
```

## Benchmark Suites

### 1. Event Calculus (`event-calculus.bench.ts`)
Core Prolog operations performance:
- Single event insertion
- Batch event insertion (100 events)
- Single fluent queries
- Complex timeline queries
- Termination checking (clipped predicate)
- Singular fluent replacement

### 2. Memory Operations (`memory-operations.bench.ts`)
High-level API performance:
- Simple record operations
- Batch recording
- Natural language queries
- Historical queries
- getAllFacts performance
- Mixed operation sequences

### 3. Scale Testing (`scale.bench.ts`)
Performance with large datasets:
- 1000 event insertion
- Queries with 500+ events
- Complex queries on large datasets
- Point-in-time queries
- Timeline traversal

## Performance Targets

Based on Event Calculus optimizations:

| Operation | Target | Notes |
|-----------|--------|-------|
| Single event insert | < 1ms | Direct Prolog assertion |
| 100 events insert | < 40ms | ~25,000 events/sec |
| Single fluent query | < 1ms | With cut optimization |
| Query 100 events | < 30ms | No terminations |
| Query 500 events | < 740ms | With terminations |
| getAllFacts (50 fluents) | < 20ms | Point-in-time snapshot |

## Optimization Notes

### Current Optimizations
- **Cut in clipped/3**: Stops searching after first termination found
- **Efficient date comparison**: ISO format strings compare correctly with `@<`
- **Dynamic assertions**: Direct assertz/retract for fast updates

### Memory Considerations
- Trealla runs in WASM with limited memory
- Large datasets (>1000 events) may require pagination
- Consider periodic cleanup for long-running sessions

## Benchmark Results

Results will vary based on:
- CPU performance
- Node.js version
- Trealla WASM performance
- System memory availability

To generate a performance report:

```bash
npm run benchmark > benchmark-results.txt
```

## Adding New Benchmarks

Create a new `.bench.ts` file:

```typescript
import { describe, bench } from 'vitest';
import { createWhenMEngine } from '../src/index';

describe('Your Benchmark Suite', () => {
  bench('operation name', async () => {
    const engine = await createWhenMEngine();
    // Your benchmark code
    await engine.destroy();
  });
});
```

## Continuous Performance Monitoring

Consider adding benchmark regression tests to CI:

```yaml
- name: Run benchmarks
  run: npm run benchmark
  
- name: Compare with baseline
  run: |
    # Compare current results with baseline
    # Fail if performance degrades >10%
```