import { defineConfig, devices } from '@playwright/test'

/**
 * Two ways to run:
 *
 * 1. Default: tests run against the app in "fake" mode. The Firebase SDK is
 *    swapped for an in-browser backend seeded with demo data, so the suite is
 *    fast, deterministic and needs no network. Security rules are tested
 *    separately against the real Firestore emulator (npm run test:rules).
 *
 * 2. Smoke: BASE_URL=https://your-site npx playwright test --project=smoke
 *    runs a few read-only checks against a real deployment. CI does this
 *    after every production deploy.
 */
const PORT = 4173
const liveUrl = process.env.BASE_URL
const chromium = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: liveUrl ?? `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: liveUrl
    ? [{ name: 'smoke', testMatch: /smoke\.spec\.ts/, use: { ...devices['Desktop Chrome'], launchOptions: chromium } }]
    : [
        {
          name: 'chromium',
          testIgnore: /(responsive|smoke)\.spec\.ts/,
          use: { ...devices['Desktop Chrome'], launchOptions: chromium },
        },
        {
          name: 'mobile',
          testMatch: /responsive\.spec\.ts/,
          use: { ...devices['Pixel 7'], launchOptions: chromium },
        },
      ],
  webServer: liveUrl
    ? undefined
    : {
        command: `npx vite --mode fake --port ${PORT} --strictPort --host 127.0.0.1`,
        url: `http://127.0.0.1:${PORT}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
})
