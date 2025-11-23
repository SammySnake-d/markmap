import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      // Map jsx-dev-runtime to our shim since @gera2ld/jsx-dom doesn't have dev runtime
      '@gera2ld/jsx-dom/jsx-dev-runtime': resolve(__dirname, './test/jsx-dev-runtime-shim.js'),
    },
  },
});
