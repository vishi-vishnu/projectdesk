import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'Demo@1234'
export const users = {
  coordinator: 'coordinator@demo.projectdesk.app',
  meena: 'meena@demo.projectdesk.app',
  arvind: 'arvind@demo.projectdesk.app',
  arjun: 'arjun@demo.projectdesk.app',
  gokul: 'gokul@demo.projectdesk.app',
  meera: 'meera@demo.projectdesk.app',
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

export async function signOut(page: Page) {
  // Works on desktop (sidebar) layouts
  await page.getByRole('button', { name: /student|faculty guide|project coordinator/i }).last().click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
}
