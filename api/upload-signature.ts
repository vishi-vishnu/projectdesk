import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isValidTeamId, signParams, teamFolder } from './_lib/cloudinary.js'
import { bearerToken, verifyIdToken } from './_lib/firebaseAuth.js'
import { fetchTeamMemberIds } from './_lib/firestore.js'

/**
 * POST /api/upload-signature  { teamId }
 * Returns a Cloudinary upload signature restricted to the team's folder,
 * only if the caller is a signed-in member of that team.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !projectId) {
    return res.status(500).json({ error: 'File uploads are not configured on the server.' })
  }

  const token = bearerToken(req.headers.authorization)
  if (!token) return res.status(401).json({ error: 'Missing sign-in token.' })

  let uid: string
  try {
    uid = (await verifyIdToken(token, projectId)).sub
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }

  const teamId = (req.body as { teamId?: unknown } | undefined)?.teamId
  if (!isValidTeamId(teamId)) return res.status(400).json({ error: 'Invalid team.' })

  try {
    const members = await fetchTeamMemberIds(projectId, teamId, token)
    if (!members?.includes(uid)) {
      return res.status(403).json({ error: 'Only members of this team can upload files.' })
    }
  } catch (error) {
    console.error('membership check failed', error)
    return res.status(502).json({ error: 'Could not verify team membership. Try again.' })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = teamFolder(teamId)
  const signature = signParams({ folder, timestamp }, CLOUDINARY_API_SECRET)

  return res.status(200).json({
    signature,
    timestamp,
    folder,
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
  })
}
