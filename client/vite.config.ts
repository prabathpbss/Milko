import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Native fs.watch drops (ECONNRESET) on network drives such as Z:, so poll instead
    watch: { usePolling: true, interval: 500, ignored: ['**/node_modules/**', '**/dist/**'] },
    // Forward API calls to the Node.js backend during development
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
});
