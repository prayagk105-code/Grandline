import { defineConfig, loadEnv, type UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import react from '@vitejs/plugin-react';

interface ViteWithTestConfig extends UserConfig {
  test?: InlineConfig;
}

export default defineConfig(({ mode }): ViteWithTestConfig => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true
        }
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**']
    }
  };
});
