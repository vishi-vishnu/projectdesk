import { auth } from '../firebase'
import { resolveContentType } from '../files'
import { UploadCancelledError, type StorageProvider } from './types'

interface SignatureResponse {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
}

interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  bytes: number
}

async function requestSignature(teamId: string): Promise<SignatureResponse> {
  const user = auth.currentUser
  if (!user) throw new Error('You need to be signed in to upload files.')
  const token = await user.getIdToken()
  const res = await fetch('/api/upload-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ teamId }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Could not authorise the upload (HTTP ${res.status}).`)
  }
  return res.json() as Promise<SignatureResponse>
}

/**
 * Cloudinary adapter (free tier). The browser never sees the API secret:
 * a Vercel function verifies the Firebase ID token and team membership,
 * then returns a short-lived signature scoped to the team's folder.
 */
export const cloudinaryProvider: StorageProvider = {
  id: 'cloudinary',
  async upload(file, { teamId, onProgress, signal }) {
    const sig = await requestSignature(teamId)
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', sig.apiKey)
    form.append('timestamp', String(sig.timestamp))
    form.append('signature', sig.signature)
    form.append('folder', sig.folder)

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
        else {
          let message = `Upload failed (HTTP ${xhr.status}).`
          try {
            message = JSON.parse(xhr.responseText).error?.message ?? message
          } catch {
            /* keep default */
          }
          reject(new Error(message))
        }
      }
      xhr.onerror = () => reject(new Error('Network error while uploading.'))
      xhr.onabort = () => reject(new UploadCancelledError())
      signal?.addEventListener('abort', () => xhr.abort(), { once: true })
      xhr.send(form)
    })

    return {
      name: file.name,
      url: result.secure_url,
      path: result.public_id,
      size: result.bytes ?? file.size,
      contentType: resolveContentType(file),
      provider: 'cloudinary',
    }
  },
}
