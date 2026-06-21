import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Rackd — Workout Tracker',
        short_name: 'Rackd',
        description: 'Personal + family workout tracker, offline-first',
        theme_color: '#0c0f14',
        background_color: '#0c0f14',
        display: 'standalone',
        start_url: '/',
        // ponytail: reuse the existing SVG favicon; add maskable PNGs later.
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
