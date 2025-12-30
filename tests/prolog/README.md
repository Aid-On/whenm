# Native Prolog Tests for WhenM Event Calculus

This directory contains native Prolog test suites for the WhenM Event Calculus temporal reasoning engine.

## Test Files

### `event_calculus_test.pl`
Comprehensive PLUnit-based test suite for SWI-Prolog (reference implementation):
- Core Event Calculus predicates (`holds_at`, `clipped`, `holds_now`)
- Pattern-based rules (`started_`, `stopped_`, `became_`, etc.)
- Semantic event rules (knowledge, membership, possession, etc.)
- Query helpers (`all_holding`, `events_between`, `fluent_timeline`)
- Utility predicates (`clear_person`, `clear_all`, date comparisons)
- Edge cases and complex scenarios
- Performance tests with large event sets

### `test_runner.js` (Default)
JavaScript-based test runner using Trealla Prolog (included as npm dependency):
```bash
npm run test:prolog
```
- ✅ **All 10 tests passing**
- Core Event Calculus functionality
- Pattern matching and semantic events
- Complex timeline scenarios
- No external dependencies needed
- Fast execution

### `run_tests.sh` (Optional)
Native SWI-Prolog test runner (requires SWI-Prolog installation):
```bash
npm run test:prolog:swipl
```
- Runs complete PLUnit test suite with SWI-Prolog
- Most comprehensive testing
- Requires: `brew install swi-prolog` (macOS) or `apt-get install swi-prolog` (Linux)

## Running Tests

### Quick Test (Trealla - No Installation Required)
```bash
npm run test:prolog
```

### All Tests (TypeScript + Prolog)
```bash
npm run test:all
```

### Full Native Prolog Tests (Requires SWI-Prolog)
```bash
# Install SWI-Prolog first
brew install swi-prolog  # macOS
# or
apt-get install swi-prolog  # Linux

# Run tests
npm run test:prolog:swipl
```

## Test Coverage

The native Prolog tests verify:

1. **Temporal Reasoning**: Events initiate and terminate fluents correctly over time
2. **Pattern Matching**: Prefix patterns (`started_`, `became_`, etc.) map to correct rules
3. **Semantic Events**: Domain-specific events (learning, employment, relationships) work correctly
4. **Singular vs Accumulating Fluents**: Proper handling of replacement vs accumulation semantics
5. **Complex Timelines**: Multiple interacting events produce correct state at any point in time
6. **Performance**: Large event sets are handled efficiently

## Writing New Tests

### For SWI-Prolog (PLUnit)
Add tests to `event_calculus_test.pl`:
```prolog
test(test_name, [setup(setup_test_env)]) :-
    assertz(happens(event, "2024-01-01")),
    assertion(holds_at(fluent, "2024-06-01")).
```

### For Trealla (Simple Tests)
Add tests to `test_runner_simple.js`:
```javascript
console.log('\nTest N: Description');
try {
  await pl.consultText(`
    :- retractall(happens(_, _)).
    :- assertz(happens(event, "2024-01-01")).
  `);
  
  const result = await pl.queryOnce('holds_at(fluent, "2024-06-01").');
  if (result) {
    console.log(`${colors.green}✓ Test passed${colors.reset}`);
    passed++;
  } else {
    console.log(`${colors.red}✗ Test failed${colors.reset}`);
    failed++;
  }
} catch (e) {
  console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
  failed++;
}
```

## CI Integration

The tests can be integrated into CI pipelines:
```yaml
- name: Run Prolog Tests
  run: npm run test:prolog
```

For comprehensive testing with SWI-Prolog in CI:
```yaml
- name: Install SWI-Prolog
  run: sudo apt-get install -y swi-prolog
  
- name: Run Full Prolog Tests
  run: npm run test:prolog:swipl
```

## GitHub Actions CI Configuration

Add to `.github/workflows/test.yml`:

```yaml
name: Test WhenM

on:
  push:
    paths:
      - 'packages/whenm/**'
  pull_request:
    paths:
      - 'packages/whenm/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        working-directory: packages/whenm
        
      - name: Run TypeScript tests
        run: npm test
        working-directory: packages/whenm
        
      - name: Run Prolog tests (Trealla)
        run: npm run test:prolog
        working-directory: packages/whenm
        
      # Optional: Full SWI-Prolog tests
      - name: Install SWI-Prolog (optional)
        run: sudo apt-get update && sudo apt-get install -y swi-prolog
        continue-on-error: true
        
      - name: Run SWI-Prolog tests (optional)
        run: npm run test:prolog:swipl
        working-directory: packages/whenm
        continue-on-error: true
```