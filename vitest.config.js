import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/tests/**/*.test.js'
    ],
    exclude: [
      'node_modules/**',
      'src/tests/e2e/**'
    ],
  },
});
