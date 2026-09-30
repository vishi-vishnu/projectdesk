import { describe, expect, it } from 'vitest'
import { isValidTeamId, signParams, teamFolder } from './cloudinary.js'
import { parseMemberIds } from './firestore.js'
import { bearerToken } from './firebaseAuth.js'

describe('signParams', () => {
  it('matches the example from the Cloudinary docs', () => {
    // https://cloudinary.com/documentation/authentication_signatures#manual_signature_generation
    const sig = signParams(
      { eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: 1315060510 },
      'abcd',
    )
    expect(sig).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e')
  })

  it('is independent of key order and skips empty values', () => {
    const a = signParams({ timestamp: 1, folder: 'x', tags: '' }, 's')
    const b = signParams({ folder: 'x', timestamp: 1 }, 's')
    expect(a).toBe(b)
  })
})

describe('helpers', () => {
  it('scopes uploads to the team folder', () => {
    expect(teamFolder('abc123')).toBe('projectdesk/teams/abc123')
  })

  it('validates team ids', () => {
    expect(isValidTeamId('Xy7Kp2Lm9QwErTy12345')).toBe(true)
    expect(isValidTeamId('../../etc')).toBe(false)
    expect(isValidTeamId(42)).toBe(false)
  })

  it('parses member ids from a Firestore REST document', () => {
    const doc = { fields: { memberIds: { arrayValue: { values: [{ stringValue: 'u1' }, { stringValue: 'u2' }] } } } }
    expect(parseMemberIds(doc)).toEqual(['u1', 'u2'])
    expect(parseMemberIds({})).toEqual([])
  })

  it('extracts bearer tokens', () => {
    expect(bearerToken('Bearer abc')).toBe('abc')
    expect(bearerToken('Basic abc')).toBeNull()
    expect(bearerToken(undefined)).toBeNull()
  })
})
