import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { artManifest } from './src/art/manifestPlugin.ts';

// GitHub Pages serves the site at /spanish-game/
export default defineConfig({
  base: '/spanish-game/',
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  plugins: [
    artManifest(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Mi Español: El Cielo',
        short_name: 'El Cielo',
        description: 'A dreamy pixel-art garden for learning Latin American Spanish.',
        lang: 'es',
        start_url: '/spanish-game/',
        scope: '/spanish-game/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fcb4db',
        theme_color: '#b399f5',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
});
