import { describe, expect, it } from 'vitest'
import { healthReport } from './health'

const full = {
  FIREBASE_PROJECT_ID: 'demo',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
  VERCEL_GIT_COMMIT_SHA: 'abcdef1234567',
  VERCEL_ENV: 'production',
}

describe('healthReport', () => {
  it('is ok when every setting is present', () => {
    const r = healthReport(full, new Date('2026-01-01T00:00:00Z'))
    expect(r).toEqual({
      status: 'ok',
      version: 'abcdef1',
      environment: 'production',
      time: '2026-01-01T00:00:00.000Z',
      checks: { firebaseConfig: true, uploadSigning: true },
    })
  })

  it('is degraded when the upload secret is missing', () => {
    const r = healthReport({ ...full, CLOUDINARY_API_SECRET: undefined })
    expect(r.status).toBe('degraded')
    expect(r.checks.uploadSigning).toBe(false)
  })

  it('never includes secret values in the report', () => {
    expect(JSON.stringify(healthReport(full))).not.toContain('secret')
  })
})
