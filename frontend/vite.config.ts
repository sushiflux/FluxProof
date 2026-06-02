import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// MMDDmmhh: Monat, Tag, Minuten, Stunden (zum Startzeitpunkt von Vite)
const now = new Date()
const MM  = String(now.getMonth() + 1).padStart(2, '0')
const DD  = String(now.getDate()).padStart(2, '0')
const mm  = String(now.getMinutes()).padStart(2, '0')
const hh  = String(now.getHours()).padStart(2, '0')
const buildStamp = `${MM}${DD}${mm}${hh}`

export default defineConfig({
  plugins: [react(), tailwindcss()],

  define: {
    __APP_VERSION__:    JSON.stringify(pkg.version),
    __BUILD_TIMESTAMP__: JSON.stringify(buildStamp),
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:5225',
        changeOrigin: true,
      },
    },
  },
})
