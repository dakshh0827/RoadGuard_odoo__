import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      'charming-contributors-greensboro-grill.trycloudflare.com'
    ],
    host: true, // allow external connections
    port: 5173  // or whatever port your frontend runs on
  }
})
