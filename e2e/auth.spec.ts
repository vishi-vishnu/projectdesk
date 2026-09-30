import { expect, test } from '@playwright/test'
import { signIn, users } from './helpers'

test('rejects a wrong password with a clear message', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(users.arjun)
  await page.getByLabel('Password').fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('The email or password is incorrect.')
})

test('validates the sign-in form before submitting', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Enter a valid email address.')).toBeVisible()
  await expect(page.getByText('Enter your password.')).toBeVisible()
})

test('redirects unauthenticated visitors to sign in', async ({ page }) => {
  await page.goto('/teams/team-aurora')
  await expect(page).toHaveURL(/\/login/)
})

test('each role lands on its own home screen', async ({ page }) => {
  await signIn(page, users.arjun)
  await expect(page).toHaveURL(/\/teams\/team-aurora/)
  await expect(page.getByRole('heading', { name: /Smart Irrigation/ })).toBeVisible()
})

test('students cannot open coordinator pages', async ({ page }) => {
  await signIn(page, users.arjun)
  await page.goto('/cycles')
  await expect(page).not.toHaveURL(/\/cycles/)
})

test('faculty sign-up waits for coordinator approval', async ({ page }) => {
  await page.goto('/register')
  await page.getByRole('button', { name: 'Faculty' }).click()
  await page.getByLabel('Full name').fill('Dr. Test Faculty')
  await page.getByLabel('College email').fill('new.faculty@college.edu')
  await page.getByLabel('Department').selectOption('Information Technology')
  await page.getByLabel('Password').fill('supersecret')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Waiting for coordinator approval' })).toBeVisible()
})
