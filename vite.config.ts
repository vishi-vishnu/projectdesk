/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // UI-test mode: swap the Firebase SDK for an in-browser fake (src/testing/fake).
  // Never enabled for production builds.
  const fake = env.VITE_FAKE_BACKEND === 'true' && mode !== 'production'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        ...(fake
          ? [
              { find: /^firebase\/app$/, replacement: src('testing/fake/app.ts') },
              { find: /^firebase\/auth$/, replacement: src('testing/fake/auth.ts') },
              { find: /^firebase\/firestore$/, replacement: src('testing/fake/firestore.ts') },
              { find: /^firebase\/storage$/, replacement: src('testing/fake/storage.ts') },
            ]
          : []),
        { find: '@', replacement: src('') },
      ],
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // Core SDK in one long-cached chunk; Storage stays separate (lazy-loaded).
            if (/node_modules\/@firebase\/(app|auth|firestore|util|component|logger|webchannel)/.test(id)) return 'firebase'
            if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'react'
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    },
  }
})
