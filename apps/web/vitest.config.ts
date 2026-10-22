import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // tsconfig keeps JSX for Next; tests need it compiled
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    // mirrors tsconfig paths; order matters (specific before generic)
    alias: [
      { find: /^~\/config\/(.*)$/, replacement: dir('./config/$1') },
      { find: /^~\/components\/(.*)$/, replacement: dir('./components/$1') },
      { find: /^~\/lib\/(.*)$/, replacement: dir('./lib/$1') },
      { find: /^~\/(.*)$/, replacement: dir('./app/$1') },
      // `server-only` throws outside the react-server condition
      { find: /^server-only$/, replacement: dir('./lib/testing/empty.ts') },
    ],
  },
  test: {
    include: ['{app,lib,config,components}/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
