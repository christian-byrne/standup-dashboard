import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'storage-supabase',
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
})