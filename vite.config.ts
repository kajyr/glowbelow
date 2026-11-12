import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: './',
  assetsInclude: ['**/*.glb', '**/*.mp3'],
  server: { host: true },
  plugins: [
    VitePWA({
      // The itch.io zip registers no service worker (offline install stays on the game's own address).
      disable: loadEnv(mode, '.', 'VITE_').VITE_TARGET === 'itch',
      // A new version waits and takes over on the next launch; nothing ever prompts.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Glow Below',
        short_name: 'Glow Below',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#020a1c',
        theme_color: '#020a1c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The whole game, models and voices included, so it plays with no connection.
        globPatterns: ['**/*.{js,css,html,png,svg,glb,mp3,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
}));
