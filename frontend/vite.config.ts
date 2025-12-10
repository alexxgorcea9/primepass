import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';

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
    host: '0.0.0.0',
    port: 3000,  // Frontend development port
    
    // Enable HTTPS for camera/microphone access
    https: fs.existsSync(path.resolve(__dirname, 'certs/cert.pem')) ? {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    } : undefined,
    
    // Enable file watching with polling for Docker on Windows
    watch: {
      usePolling: true,
      interval: 500,  // Check more frequently
      ignored: ['**/node_modules/**', '**/.git/**'],
    },

    // HMR configuration for local network access
    hmr: {
      // Always use the network IP so HMR works from any device on the network
      host: '192.168.178.47',
      clientPort: 3000,
      protocol: 'wss',  // Changed to wss for secure WebSocket
      timeout: 30000,
    },

    proxy: {
      '/api': {
        target: process.env.DOCKER_ENV ? 'http://backend:8000' : 'http://192.168.178.47:8000',
        changeOrigin: true,
        secure: false,
        ws: true,  // Enable WebSocket proxying
      },
      '/media': {
        target: process.env.DOCKER_ENV ? 'http://backend:8000' : 'http://192.168.178.47:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
