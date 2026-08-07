import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,        // fixed port
    strictPort: true,  // error if port busy
    open: true,        // automatically opens browser on start
    cors: true,        // enable CORS for backend calls
    hmr: {
      overlay:false
    },
    watch: {
      usePolling: true
    }
  }
})