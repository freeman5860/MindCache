import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // 优化依赖预构建
  optimizeDeps: {
    exclude: ['@xenova/transformers'], // 避免预构建 transformers.js
  },

  // Worker 配置
  worker: {
    format: 'es',
  },

  // 构建配置
  build: {
    target: 'esnext',
    // 分离大型依赖
    rollupOptions: {
      output: {
        manualChunks: {
          orama: ['@orama/orama', '@orama/plugin-data-persistence'],
          dexie: ['dexie'],
        },
      },
    },
  },

  // 开发服务器配置
  server: {
    port: 3000,
    headers: {
      // 启用 SharedArrayBuffer（某些 WASM 操作需要）
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
