import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
  cacheDir: 'node_modules/.vite/development',
  plugins: [react(), tailwindcss()],
})
