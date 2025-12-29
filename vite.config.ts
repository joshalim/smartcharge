
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // This allows the Gemini SDK to access the API key via process.env as required
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3080,
    host: true
  }
});
