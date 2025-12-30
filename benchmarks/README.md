# WhenM Benchmarks

Performance benchmarks for WhenM temporal memory system.

## Benchmarks

### benchmark.test.ts
Main performance benchmark testing:
- Event insertion speed
- Query performance  
- Memory usage
- Temporal reasoning efficiency

### benchmark-20.test.ts
Extended test suite with 20 comprehensive test cases covering:
- Various event patterns
- Complex temporal queries
- Edge cases

## Running Benchmarks

```bash
# Run all benchmarks
npm run benchmark

# Run with vitest directly
npx vitest run benchmarks/**/*.test.ts

# Watch mode for development
npx vitest benchmarks/**/*.test.ts
```

## Performance Metrics

Current benchmark results:
- **Event Recording**: ~0.1ms per event
- **Query Execution**: ~46ms for 100 events
- **Memory Usage**: < 10MB for 1000 events