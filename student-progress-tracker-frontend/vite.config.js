import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Központi .env a repó gyökerében (egy szinttel feljebb, mint a frontend mappa)
const repoRoot = path.resolve(__dirname, '..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: repoRoot,
  server: {
    // npm run dev: ugyanazon az originön marad a fetch (/api → backend :8000), nincs CORS-probléma
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
})
