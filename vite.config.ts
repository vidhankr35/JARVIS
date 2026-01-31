
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensures process.env.API_KEY is available in the browser context via Vite's injection
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Fixes Vercel's "chunk size limit" warning
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'three'],
          genai: ['@google/genai']
        }
      }
    }
  }
});
