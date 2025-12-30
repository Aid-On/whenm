# Changelog

All notable changes to this project will be documented in this file.

## [0.3.1] - 2025-12-30

### Fixed
- Removed deprecated query(), nl(), and timeline() methods  
- All temporal queries now use the ask() method with Event Calculus reasoning
- Deleted old schema.ts file with hardcoded mappings
- Unified all routes to use UnifiedSchemalessEngine for proper temporal reasoning

### Changed
- search() and recent() now use ask() internally for consistency
- Updated README to clearly indicate which methods to use

## [0.2.0] - 2025-12-30

### Restored Original Implementation
- Restored v0.1.0 implementation as the canonical version
- Fixed API compatibility with WhenM.cloudflare() and other methods
- Ensured all documented features work correctly

## [0.1.3] - 2025-12-30

### 🎉 Initial Release

**WhenM** - Time-aware memory system for LLMs with Event Calculus and Prolog reasoning

First stable public release with all features working correctly.

### Features
- Complete unified LLM provider interface  
- All helper functions properly exported
- Full temporal reasoning with Event Calculus
- Mock provider for testing without API
- Multi-language support (Japanese, English, etc.)
- 257 tests passing