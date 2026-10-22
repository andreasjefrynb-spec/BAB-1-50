import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Jalur dasar akses aset aplikasi di GitHub Pages
  base: '/BAB-1-50/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/',
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
