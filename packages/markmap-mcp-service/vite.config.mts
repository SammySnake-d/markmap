import { builtinModules } from 'module';
import { readPackageUp } from 'read-package-up';
import { defineConfig } from 'vite';

const { packageJson: pkg } = await readPackageUp({ cwd: import.meta.dirname });

// 只将 peerDependencies 设为 external，dependencies 需要打包进去
const external = [
  ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
  ...Object.keys(pkg.peerDependencies || {}),
];

export default defineConfig({
  build: {
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      fileName: '[name]',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external,
      output: {
        banner: (chunk) => {
          if (chunk.fileName === 'index.js' || chunk.fileName === 'index.mjs') {
            return '#!/usr/bin/env node';
          }
          return '';
        },
      },
    },
  },
});
