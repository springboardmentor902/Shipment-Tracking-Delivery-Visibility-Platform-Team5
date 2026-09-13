import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      // Uploaded POD signature/photo files are served back out at this path by the
      // backend (see StaticFileConfig) - proxied here so <img src="/files/..."> resolves
      // through the same dev server the rest of the app runs on.
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
