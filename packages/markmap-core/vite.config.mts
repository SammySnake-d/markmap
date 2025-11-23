import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'markmapCore',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.mjs';
        if (format === 'cjs') return 'index.js';
        return `index.${format}.js`;
      },
    },
    rollupOptions: {
      external: ['d3', 'd3-flextree', 'markmap-common', 'markmap-interfaces'],
      output: {
        globals: {
          'd3': 'd3',
          'd3-flextree': 'd3Flextree',
          'markmap-common': 'markmapCommon',
          'markmap-interfaces': 'markmapInterfaces',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
});
