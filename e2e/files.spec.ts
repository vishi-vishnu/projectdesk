import { expect, test } from '@playwright/test'
import { signIn, users } from './helpers'

test('guide previews a PDF report and an image inside the app', async ({ page }) => {
  await signIn(page, users.meena)
  await page.goto('/teams/team-aurora/reviews/r2')

  const pdfRow = page.getByRole('listitem').filter({ hasText: 'review2-system-design-v2.pdf' })
  await pdfRow.getByRole('button', { name: 'Preview' }).click()
  const dialog = page.getByRole('dialog', { name: 'review2-system-design-v2.pdf' })
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /review2-system-design-v2\.pdf$/)
  await dialog.getByRole('button', { name: 'Close' }).click()

  const imageRow = page.getByRole('listitem').filter({ hasText: 'architecture-diagram.png' })
  await imageRow.getByRole('button', { name: 'Preview' }).click()
  const image = page.getByRole('dialog').getByRole('img', { name: 'architecture-diagram.png' })
  await expect(image).toBeVisible()
  // the image actually loaded (not a broken link)
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(100)
})

test('slides can be downloaded, and the sample files are really served', async ({ page, request }) => {
  await signIn(page, users.arjun)
  await page.goto('/teams/team-aurora/reviews/r1')
  const download = page.getByRole('link', { name: 'Download review1-slides.pptx' })
  await expect(download).toHaveAttribute('href', '/samples/review1-slides.pptx')

  for (const path of ['/samples/review1-slides.pptx', '/samples/review1-literature-survey.pdf', '/samples/architecture-diagram.png']) {
    const res = await request.get(path)
    expect(res.status(), path).toBe(200)
    expect((await res.body()).byteLength, path).toBeGreaterThan(1000)
  }
})

test('a freshly uploaded image and PDF can be previewed straight away', async ({ page }) => {
  await signIn(page, users.arjun)
  await page.goto('/teams/team-aurora/reviews/r3')
  await page.getByLabel('Choose files to upload').setInputFiles(['e2e/fixtures/sample-diagram.png', 'e2e/fixtures/sample-report.pdf'])
  await page.getByRole('button', { name: 'Submit for review' }).click()
  await expect(page.getByText('Submitted for review')).toBeVisible()

  const imageRow = page.getByRole('listitem').filter({ hasText: 'sample-diagram.png' })
  await imageRow.getByRole('button', { name: 'Preview' }).click()
  const image = page.getByRole('dialog').getByRole('img', { name: 'sample-diagram.png' })
  await expect(image).toBeVisible()
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(100)
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()

  const pdfRow = page.getByRole('listitem').filter({ hasText: 'sample-report.pdf' })
  await pdfRow.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByRole('dialog').locator('iframe')).toHaveAttribute('src', /^blob:/)
})
