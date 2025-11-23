import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MarkmapUIDefault',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['markmap-common', 'markmap-interfaces'],
      output: {
        globals: {
          'markmap-common': 'MarkmapCommon',
          'markmap-interfaces': 'MarkmapInterfaces',
        },
      },
    },
    sourcemap: true,
  },
});
