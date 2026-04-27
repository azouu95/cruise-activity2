import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy pour Discord Activity en dev
    proxy: {
      '/.proxy': {
        target: 'https://discord.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/.proxy/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
