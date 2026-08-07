import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,        // fixed port
    strictPort: true,  // error if port busy
    open: true,        // automatically opens browser on start
    cors: true,        // enable CORS for backend calls
  },
  resolve: {
    alias: {
      '@': '/src',     // optional: allows imports like '@/components/MyComp'
    },
  },
  define: {
    'process.env': {}   // ensures process.env works in React
  }
})