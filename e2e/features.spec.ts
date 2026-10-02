import { expect, test } from '@playwright/test'
import { PASSWORD, signIn, signOut, users } from './helpers'

test.describe.configure({ timeout: 60_000 })

test('coordinator posts an announcement and students see it in the bell and on their team page', async ({ page }) => {
  await signIn(page, users.coordinator)
  const card = page.getByRole('main').locator('div.rounded-lg', { has: page.getByRole('heading', { name: 'Announcements' }) })
  await card.getByRole('button', { name: 'New' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title').fill('Lab closed on Monday')
  await dialog.getByLabel('Message').fill('The project lab is closed for maintenance on Monday.')
  await dialog.getByLabel('Who should see it').selectOption('students')
  await dialog.getByRole('button', { name: 'Post announcement' }).click()
  await expect(page.getByText('Announcement posted')).toBeVisible()
  await expect(card.getByText('Lab closed on Monday')).toBeVisible()
  await signOut(page)

  // A student sees it on the team overview and as an unread notification
  await signIn(page, users.arjun)
  await expect(page.getByRole('main').getByText('Lab closed on Monday')).toBeVisible()
  const bell = page.getByRole('button', { name: /Notifications, \d+ unread/ })
  await expect(bell).toBeVisible()
  await bell.click()
  await expect(page.getByRole('menu').getByText('Lab closed on Monday')).toBeVisible()
  await page.keyboard.press('Escape')
  // Opening the list marks everything as read
  await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()
  await signOut(page)

  // Faculty-only notices stay hidden from guides when aimed at students
  await signIn(page, users.meena)
  await expect(page.getByRole('main').getByText('Review 2 marks due this week')).toBeVisible()
  await expect(page.getByRole('main').getByText('Lab closed on Monday')).toHaveCount(0)
})

test('coordinator auto-assigns guides, honouring the team preference', async ({ page }) => {
  await signIn(page, users.coordinator)
  await page.getByRole('link', { name: 'Teams', exact: true }).click()
  await expect(page.getByText('Prefers Dr. P. Kavitha')).toBeVisible()
  await page.getByRole('button', { name: 'Auto-assign guides' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('row', { name: /Team Vertex.*Dr\. P\. Kavitha.*Preferred/ })).toBeVisible()
  await dialog.getByRole('button', { name: /Assign 1 team/ }).click()
  await expect(page.getByText('Assigned guides to 1 team')).toBeVisible()
  await expect(page.getByLabel('Guide for Team Vertex')).toHaveValue('fac-kavitha')
  await expect(page.getByRole('button', { name: 'Auto-assign guides' })).toBeDisabled()
})

test('team lead picks a preferred guide on the proposal', async ({ page }) => {
  await signIn(page, 'irfan@demo.projectdesk.app')
  await page.getByRole('link', { name: 'Proposal', exact: true }).click()
  const select = page.getByLabel(/Preferred guide/)
  await expect(select).toHaveValue('fac-kavitha')
  await select.selectOption({ label: 'Prof. K. Arvind, Assistant Professor' })
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText('Proposal saved')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel(/Preferred guide/)).toHaveValue('fac-arvind')
})

test('dark theme can be chosen from the account menu and is remembered', async ({ page }) => {
  await signIn(page, users.meena)
  await page.getByRole('button', { name: /faculty guide/i }).last().click()
  await page.getByRole('menuitem', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: /faculty guide/i }).last().click()
  await page.getByRole('menuitem', { name: 'Light' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('light is the default and the header toggle switches themes, even on a dark system', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' })
  const page = await context.newPage()
  await page.goto('/login')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await signIn(page, users.arjun)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Switch to light mode' }).first().click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await context.close()
})

test('a user changes their password and signs in with the new one', async ({ page }) => {
  await signIn(page, users.meera)
  await page.goto('/profile')
  const form = page.getByRole('form', { name: 'Change password' })
  await form.getByLabel('Current password').fill('wrong-password')
  await form.getByLabel('New password', { exact: true }).fill('new-pass-2026')
  await form.getByLabel('Confirm new password').fill('new-pass-2026')
  await form.getByRole('button', { name: 'Change password' }).click()
  await expect(form.getByText('Your current password is not correct.')).toBeVisible()

  await form.getByLabel('Current password').fill(PASSWORD)
  await form.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText('Password changed')).toBeVisible()
  await signOut(page)

  await page.getByLabel('Email').fill(users.meera)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('The email or password is incorrect.')).toBeVisible()
  await signIn(page, users.meera, 'new-pass-2026')
})

test('team overview warns when a review deadline is close', async ({ page }) => {
  // Team Orbit hasn't uploaded Review 2, which was due three days ago in the demo data
  await signIn(page, 'aishwarya@demo.projectdesk.app')
  await expect(page.getByRole('main').getByText('Review 2 is 3 days overdue.')).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Open stage' }).first()).toBeVisible()
})
