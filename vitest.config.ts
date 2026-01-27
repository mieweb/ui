import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/visual/**',
      '**/*.spec.ts'
    ],
    coverage: {
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.storybook/',
        'src/test/',
        '**/*.stories.tsx',
        '**/*.config.{ts,js}',
        '**/types.ts',
        '**/index.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});