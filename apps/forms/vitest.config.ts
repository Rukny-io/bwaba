import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', '../../packages/forms-shared/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@rukny/forms-shared': path.resolve(
        __dirname,
        '../../packages/forms-shared/src',
      ),
      '@': path.resolve(__dirname, '.'),
    },
  },
});
