import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  assetsInclude: ['**/*.glb'],
  server: { host: true },
  test: { include: ['src/**/*.test.ts'] },
});
