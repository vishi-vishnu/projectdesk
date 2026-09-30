import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

// Public keys Google uses to sign Firebase ID tokens.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

export interface FirebaseClaims extends JWTPayload {
  sub: string
  email?: string
}

/** Verifies a Firebase Auth ID token without the Admin SDK or a service account. */
export async function verifyIdToken(token: string, projectId: string): Promise<FirebaseClaims> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  })
  if (!payload.sub) throw new Error('Token has no subject')
  return payload as FirebaseClaims
}

export function bearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header
  if (!value?.startsWith('Bearer ')) return null
  return value.slice('Bearer '.length).trim() || null
}
