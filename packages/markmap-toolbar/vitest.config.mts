import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@gera2ld/jsx-dom',
    jsxDev: false,
  },
  resolve: {
    alias: {
      '@gera2ld/jsx-dom/jsx-dev-runtime': '@gera2ld/jsx-dom/jsx-runtime',
    },
  },
});
