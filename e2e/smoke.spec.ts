import { expect, test } from '@playwright/test'

/**
 * Smoke test for a real deployment. CI runs it against the live URL after
 * every production deploy:  BASE_URL=https://... npx playwright test --project=smoke
 * It only reads; it never signs in or writes data.
 */
test('the health endpoint reports a fully configured server', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.status(), await res.text()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('ok')
  expect(body.checks).toEqual({ firebaseConfig: true, uploadSigning: true })
})

test('the sign-in page loads with no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  expect(errors).toEqual([])
})

test('deep links fall back to the app shell', async ({ page }) => {
  const res = await page.goto('/teams/does-not-exist')
  expect(res?.status()).toBe(200)
  await expect(page).toHaveURL(/\/login/)
})

test('the upload endpoint refuses requests without a sign-in token', async ({ request }) => {
  const res = await request.post('/api/upload-signature', { data: { teamId: 'team-x' } })
  expect(res.status()).toBe(401)
})
