/**
 * Builds the body for GET /api/health. Kept separate from the handler so it
 * can be unit tested. It reports whether each setting is present, never the
 * values themselves.
 */
export interface HealthReport {
  status: 'ok' | 'degraded'
  version: string
  environment: string
  time: string
  checks: { firebaseConfig: boolean; uploadSigning: boolean }
}

export function healthReport(env: Record<string, string | undefined>, now = new Date()): HealthReport {
  const firebaseConfig = Boolean(env.FIREBASE_PROJECT_ID ?? env.VITE_FIREBASE_PROJECT_ID)
  const uploadSigning = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
  return {
    status: firebaseConfig && uploadSigning ? 'ok' : 'degraded',
    version: (env.VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7),
    environment: env.VERCEL_ENV ?? 'development',
    time: now.toISOString(),
    checks: { firebaseConfig, uploadSigning },
  }
}
