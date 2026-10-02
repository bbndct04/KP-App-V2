import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'KP App — Katarungang Pambarangay',
        short_name: 'KP App',
        description: 'Official digital platform of Barangay New Kababae for filing and tracking Katarungang Pambarangay complaints.',
        theme_color: '#1a5fd4',
        background_color: '#edf1f8',
        display: 'standalone',
        start_url: '/login',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell (JS/CSS/HTML/fonts/icons) for offline load
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // Supabase reads (SELECT via GET) — serve cache instantly, refresh in background.
            // Safe for stale data; the page still gets fresh data on the next successful fetch.
            urlPattern: ({ url, request }) =>
              url.hostname.endsWith('.supabase.co') && url.pathname.includes('/rest/v1/') && request.method === 'GET',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-reads',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
            },
          },
          {
            // Auth, writes (POST/PATCH/DELETE), and Edge Functions — never cache.
            // Submitting a complaint or logging in must always hit the network.
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts — cache aggressively, they never change per-version
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // avoid SW confusion during `npm run dev`; test via `npm run build && npm run preview`
      },
    }),
  ],
})