# WhenM Tests

## Directory Structure

### `/locomo`
LoCoMo (Long-term Conversational Memory) Benchmark Tests
- `test-locomo-load.js` - Data loading
- `test-locomo-query.js` - Query tests
- `test-locomo-massive.js` - Large-scale data tests (100+ events)

### `/integration`
Integration tests and natural language query tests
- `test-natural-language.js` - General NL queries
- `test-cloudflare-*.js` - Cloudflare Workers AI integration
- `test-live-*.js` - Live API tests

### `/debug`
Debug and troubleshooting utilities
- `test-debug-*.js` - Various debugging tools
- `test-who-*.js` - WHO query debugging
- `test-compound-*.js` - Compound event decomposition

### `/examples`
Usage examples and scenario tests
- `test-readme-*.js` - README example validation
- `test-validation-scenarios.js` - Validation scenarios

## How to Run

```bash
# Run specific test
node tests/locomo/test-locomo-massive.js

# Run LoCoMo benchmark (order matters)
node tests/locomo/test-locomo-load.js    # Prepare data
node tests/locomo/test-locomo-query.js   # Query tests

# Cloudflare integration test
node tests/integration/test-live-en.js
```