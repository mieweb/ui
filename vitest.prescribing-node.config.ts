import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
    include: [
      'src/prescribing/**/*.test.ts',
      'src/demo/prescribing/**/*.test.ts',
    ],
  },
});
