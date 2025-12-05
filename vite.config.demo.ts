import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist-demo',
    rollupOptions: {
      input: {
        demo: 'demo.html',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    open: '/demo.html',
  },
})
