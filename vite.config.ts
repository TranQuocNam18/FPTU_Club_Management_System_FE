import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/gateway/events': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gateway\/events/, '/api/v1/events'),
      },
      '/gateway/notifications': {
        target: 'http://localhost:5004',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gateway\/notifications/, '/api/v1/notifications'),
      },
      '/gateway': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
