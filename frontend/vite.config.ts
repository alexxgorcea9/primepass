import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@store': path.resolve(__dirname, './src/store'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },

  server: {
    // 1. Listen on all network interfaces so your phone/other devices can connect:
    host: '0.0.0.0',
    port: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV ? 3000 : 5173,

    // 2. Force WebSocket‐based HMR instead of EventSource
    hmr: {
      protocol: 'ws',
      port: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV ? 24678 : undefined,
    },

    // 3. (Optional) If you'd rather disable SSE completely and fall back to polling:
    // watch: {
    //   usePolling: true
    // },

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
