# WhenM Examples

This directory contains example scripts demonstrating how to use WhenM.

## Examples

### demo-memory.ts
Demonstrates natural language memory API with both structured (`record()`) and free-form (`parse()`) methods.

### demo-reasoning-chain.ts
Shows complex temporal reasoning and event chaining capabilities.

## Running Examples

```bash
# Install dependencies
npm install

# Run with tsx (TypeScript execution)
npx tsx examples/demo-memory.ts
npx tsx examples/demo-reasoning-chain.ts
```

## Environment Setup

Copy `.env.example` to `.env` and add your Cloudflare credentials:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_KEY=your_api_key
```