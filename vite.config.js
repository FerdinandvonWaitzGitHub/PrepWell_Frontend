import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React bundle
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting library (large)
          'vendor-recharts': ['recharts'],
          // Supabase SDK
          'vendor-supabase': ['@supabase/supabase-js'],
          // Validation
          'vendor-zod': ['zod'],
        },
      },
    },
  },
});
