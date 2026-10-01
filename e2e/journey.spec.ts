import { expect, test } from '@playwright/test'
import { signIn, signOut, users } from './helpers'

test.describe.configure({ timeout: 90_000 })

test('full project journey: register → team → proposal → guide → review → marks', async ({ page }) => {
  // 1. A new student registers and creates a team
  await page.goto('/register')
  await page.getByLabel('Full name').fill('Asha Menon')
  await page.getByLabel('College email').fill('asha@college.edu')
  await page.getByLabel('Department').selectOption('Electronics and Communication Engineering')
  await page.getByLabel('Register number').fill('910021106099')
  await page.getByLabel('Password').fill('asha-password')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Welcome, Asha' })).toBeVisible()
  await page.getByLabel('Team name').fill('Team Kestrel')
  await page.getByRole('button', { name: 'Create team' }).click()
  await expect(page.getByRole('heading', { name: 'Team Kestrel' })).toBeVisible()

  const code = (await page.locator('.tracking-\\[0\\.2em\\]').first().innerText()).trim()
  expect(code).toMatch(/^[A-Z2-9]{6}$/)

  // 2. Lead drafts and submits the proposal
  await page.getByRole('link', { name: 'Proposal', exact: true }).click()
  await page.getByLabel('Project title').fill('Crop disease detection from leaf images')
  await page.getByLabel(/Domain/).fill('Machine Learning')
  await page.getByLabel(/Tools & technologies/).fill('Python, TensorFlow, Flask')
  await page
    .getByLabel('Abstract')
    .fill('Farmers lose a large share of yield to leaf diseases that are identified too late. We train a CNN on field photographs to classify common diseases and suggest treatment through a simple web app.')
  await page.getByRole('button', { name: 'Submit for approval' }).click()
  await expect(page.getByText('Proposal sent to your guide')).toBeVisible()
  await expect(page.getByText('Pending approval').first()).toBeVisible()
  await signOut(page)

  // 3. A classmate joins with the code
  await signIn(page, users.gokul)
  await page.getByLabel('Join code').fill(code)
  await page.getByRole('button', { name: 'Find team' }).click()
  await expect(page.getByRole('dialog')).toContainText('Join Team Kestrel?')
  await page.getByRole('button', { name: 'Join team' }).click()
  await expect(page.getByRole('heading', { name: /Crop disease detection/ })).toBeVisible()
  await expect(page.getByRole('main').getByText('Gokul Anand', { exact: true })).toBeVisible()
  await signOut(page)

  // 4. Coordinator assigns a guide
  await signIn(page, users.coordinator)
  await page.getByRole('link', { name: 'Teams', exact: true }).click()
  await page.getByLabel('Guide for Team Kestrel').selectOption({ label: 'Prof. K. Arvind' })
  await expect(page.getByText('Prof. K. Arvind assigned to Team Kestrel')).toBeVisible()
  await signOut(page)

  // 5. Guide approves the topic
  await signIn(page, users.arvind)
  await page.getByRole('link', { name: /Crop disease detection/ }).first().click()
  await page.getByRole('link', { name: 'Proposal', exact: true }).click()
  await page.getByRole('button', { name: 'Approve topic' }).click()
  await expect(page.getByText('Topic approved')).toBeVisible()
  await signOut(page)

  // 6. Student uploads Review 1
  await signIn(page, 'asha@college.edu', 'asha-password')
  await page.getByRole('link', { name: 'Reviews', exact: true }).click()
  await page.getByRole('link', { name: /Review 1: Problem & literature survey/ }).click()
  await page.getByLabel('Choose files to upload').setInputFiles(['e2e/fixtures/sample-report.pdf', 'e2e/fixtures/sample-diagram.png'])
  await expect(page.getByText('sample-report.pdf')).toBeVisible()
  await page.getByRole('button', { name: 'Submit for review' }).click()
  await expect(page.getByText('Submitted for review')).toBeVisible()
  await expect(page.getByText('Awaiting review').first()).toBeVisible()

  // …and asks a doubt on the submission
  await page.getByPlaceholder('Reply or ask your guide a question…').fill('Should the survey include papers older than 2019?')
  await page.getByLabel('Mark as a doubt for the guide').check()
  await page.getByRole('button', { name: 'Post' }).click()
  await expect(page.getByText('1 open doubt')).toBeVisible()
  await signOut(page)

  // 7. Guide sees it in the queue, replies and awards marks
  await signIn(page, users.arvind)
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Review queue' }).click()
  await expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible()
  await page.getByRole('table').getByRole('link', { name: /Crop disease detection/ }).click()
  await page.getByPlaceholder('Feedback for the team…').fill('Keep it to the last five years unless a paper is foundational.')
  await page.getByRole('button', { name: 'Post' }).click()
  await page.getByRole('button', { name: 'Mark resolved' }).click()
  await page.getByLabel('Marks', { exact: true }).fill('17')
  await page.getByLabel('Remarks', { exact: true }).fill('Good survey. Add a comparison table.')
  await page.getByRole('button', { name: 'Accept' }).click()
  await expect(page.getByText('Review accepted')).toBeVisible()
  await signOut(page)

  // 8. Student sees the result
  await signIn(page, users.gokul)
  await expect(page.getByText('17 / 20')).toBeVisible()
  await page.getByRole('link', { name: 'Review 1: Problem & literature survey' }).click()
  await expect(page.getByText('Accepted by Prof. K. Arvind')).toBeVisible()
  await expect(page.getByText('Good survey. Add a comparison table.')).toBeVisible()
})

test('guide requests changes and the team resubmits a new version', async ({ page }) => {
  await signIn(page, users.meena)
  await page.goto('/teams/team-aurora/reviews/r2')
  await page.getByLabel('Remarks', { exact: true }).fill('Label the gateway antenna gain in the diagram.')
  await page.getByRole('button', { name: 'Request changes' }).click()
  await expect(page.getByText('Changes requested', { exact: true }).first()).toBeVisible()
  await signOut(page)

  await signIn(page, users.arjun)
  await page.goto('/teams/team-aurora/reviews/r2')
  await expect(page.getByText('Label the gateway antenna gain in the diagram.')).toBeVisible()
  await page.getByRole('button', { name: 'New version' }).click()
  await page.getByLabel('Choose files to upload').setInputFiles('e2e/fixtures/sample-report.pdf')
  await page.getByRole('button', { name: 'Submit version 3' }).click()
  await expect(page.getByText('Version 3 submitted')).toBeVisible()
  await expect(page.getByRole('button', { name: /Version 3/ })).toBeVisible()
})

test('uploader rejects unsupported and oversized files', async ({ page }) => {
  await signIn(page, users.arjun)
  await page.goto('/teams/team-aurora/reviews/r3')
  await page.getByLabel('Choose files to upload').setInputFiles({
    name: 'notes.exe',
    mimeType: 'application/x-msdownload',
    buffer: Buffer.from('MZ'),
  })
  await expect(page.getByText(/only PDF, PPT\/PPTX/)).toBeVisible()
  await page.getByLabel('Choose files to upload').setInputFiles({
    name: 'huge.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(11 * 1024 * 1024),
  })
  await expect(page.getByText(/The limit is 10 MB per file/)).toBeVisible()
})

test('coordinator approves a pending faculty account', async ({ page }) => {
  await signIn(page, users.coordinator)
  await page.getByRole('link', { name: 'People' }).click()
  await expect(page.getByText('J. Prakash')).toBeVisible()
  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('J. Prakash approved')).toBeVisible()
  await expect(page.getByText('Awaiting approval')).toHaveCount(0)
})

test('coordinator edits the review schedule', async ({ page }) => {
  await signIn(page, users.coordinator)
  await page.getByRole('link', { name: 'Review schedule' }).click()
  await page.getByRole('button', { name: 'Edit schedule' }).click()
  await page.getByLabel('Stage 3 title').fill('Review 3: Prototype demo')
  await page.getByRole('button', { name: 'Save schedule' }).click()
  await expect(page.getByText('Schedule updated')).toBeVisible()
  await expect(page.getByText('Review 3: Prototype demo')).toBeVisible()
})
