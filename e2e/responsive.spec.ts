import { expect, test } from '@playwright/test'
import { PASSWORD, users } from './helpers'

test('mobile navigation works and pages do not scroll sideways', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(users.arjun)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Smart Irrigation/ })).toBeVisible()
  await expect(page.getByText('Review stages')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('dialog', { name: 'Navigation' }).getByRole('link', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toHaveCount(0)
})

for (const path of ['/teams/team-aurora/reviews/r2', '/teams/team-aurora/proposal', '/teams/team-aurora/discussion']) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(users.arjun)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('heading', { name: /Smart Irrigation/ })).toBeVisible()
    await page.goto(path)
    await expect(page.getByRole('heading', { name: /Smart Irrigation/ })).toBeVisible()
    await page.waitForTimeout(500)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
