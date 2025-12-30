import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'text-summary'],
      exclude: [
        'coverage/**',
        'dist/**',
        '*.config.*',
        '**/[.]**',
        'packages/*/test?(s)/**',
        '**/*.d.ts',
        '**/*{.,-}test.ts',
        'tests/**',
        'benchmarks/**',
        'examples/**',
        'src/_deprecated/**',
        'src/_experimental/**',
        'node_modules/**',
        // Exclude test files and examples
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test-*.js',
        '**/demo-*.ts',
        // Exclude type definition files
        'src/schema.ts',
        'src/tools.ts',
        'src/index.ts',
        'src/utils.ts',
      ],
      include: ['src/**/*.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});