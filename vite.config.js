import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
      ],

      manifest: {
        id: '/',
        name: 'Japan26',
        short_name: 'Japan26',

        description:
          'Itinerario y organización del viaje a Japón 2026',

        lang: 'es',
        start_url: '/',
        scope: '/',

        display: 'standalone',
        orientation: 'portrait-primary',

        background_color: '#fbfbfc',
        theme_color: '#e84f5f',

        categories: [
          'travel',
          'lifestyle',
          'productivity',
        ],

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        navigateFallback: '/index.html',

        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,woff,woff2}',
        ],

        navigateFallbackDenylist: [
          /^\/rest\//,
          /^\/auth\//,
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
})
