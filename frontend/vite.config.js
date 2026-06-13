import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // Auto open browser saat npm run dev
  },
  build: {
    sourcemap: true, // Memudahkan debugging di production
    rollupOptions: {
      output: {
        manualChunks: {
          // Pisahkan library besar ke chunk terpisah
          vendor: ['react', 'react-dom', 'axios'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
  },
})