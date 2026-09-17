import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      'dist/**',
      'packages/datavis/**',
      'packages/esheet/**',
      'artipod-sync/**',
      'tests/visual/**',
      '**/*.spec.ts',
    ],
    coverage: {
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'packages/datavis/**',
        '.storybook/',
        'src/test/',
        '**/*.stories.tsx',
        '**/*.config.{ts,js}',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@mieweb\/ui\/components\/(.+)$/,
        replacement: `${resolve(__dirname, 'src/components')}/$1`,
      },
      {
        find: /^@mieweb\/ui\/styles\.css$/,
        replacement: resolve(__dirname, 'src/styles/base.css'),
      },
      {
        find: /^@mieweb\/ui\/utils$/,
        replacement: resolve(__dirname, 'src/utils/index.ts'),
      },
      {
        find: /^@mieweb\/ui$/,
        replacement: resolve(__dirname, 'src/index.ts'),
      },
      {
        find: '@',
        replacement: resolve(__dirname, 'src'),
      },
    ],
    dedupe: ['@mieweb/ui', 'lucide-react', 'react', 'react-dom'],
  },
});
