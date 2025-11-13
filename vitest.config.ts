import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['apps/**', 'dist/**', 'node_modules/**', '**/*.d.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json', 'lcov'],
      include: ['packages/**/src/**/*.{ts,tsx}']
    },
    alias: {
      '@standup/config': path.resolve(__dirname, 'packages/config/src/index.ts'),
      '@standup/services-github': path.resolve(__dirname, 'packages/services-github/src/index.ts'),
      '@standup/services-claude': path.resolve(__dirname, 'packages/services-claude/src/index.ts'),
      '@standup/storage-fs': path.resolve(__dirname, 'packages/storage-fs/src/index.ts'),
      '@standup/services-github/*': path.resolve(__dirname, 'packages/services-github/src'),
      '@standup/services-claude/*': path.resolve(__dirname, 'packages/services-claude/src'),
      '@standup/storage-fs/*': path.resolve(__dirname, 'packages/storage-fs/src'),
      '@standup/workflow': path.resolve(__dirname, 'packages/workflow/src/index.ts'),
      '@standup/workflow/*': path.resolve(__dirname, 'packages/workflow/src')
    }
  }
});
