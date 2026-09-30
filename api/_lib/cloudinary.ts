import { createHash } from 'node:crypto'

/**
 * Cloudinary signature: SHA-1 of the alphabetically sorted "key=value" params
 * joined with "&", followed by the API secret.
 * https://cloudinary.com/documentation/authentication_signatures
 */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1').update(toSign + apiSecret).digest('hex')
}

export function teamFolder(teamId: string): string {
  return `projectdesk/teams/${teamId}`
}

/** Firestore document ids we create are 20-char auto ids; reject anything else. */
export function isValidTeamId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{6,40}$/.test(value)
}
