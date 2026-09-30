import { connectStorageEmulator, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import { app, emulatorHost, useEmulators } from '../firebase'
import { resolveContentType, safeFileName } from '../files'
import { UploadCancelledError, type StorageProvider } from './types'

// Firebase Storage is only used with the local emulator (or a Blaze-plan project).
// This module is loaded lazily, so Cloudinary deployments never download it.
const storage = getStorage(app)
if (useEmulators) connectStorageEmulator(storage, emulatorHost, 9199)

/**
 * Firebase Storage adapter. Used with the local emulator (free) or a project on
 * the Blaze plan. Access is enforced by storage.rules (team members only).
 */
export const firebaseStorageProvider: StorageProvider = {
  id: 'firebase',
  upload(file, { teamId, submissionId, onProgress, signal }) {
    const contentType = resolveContentType(file)
    const path = `teams/${teamId}/submissions/${submissionId}/${Date.now()}-${safeFileName(file.name)}`
    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType,
      customMetadata: { originalName: file.name },
    })

    return new Promise((resolve, reject) => {
      const onAbort = () => task.cancel()
      signal?.addEventListener('abort', onAbort, { once: true })

      task.on(
        'state_changed',
        (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (error) => {
          signal?.removeEventListener('abort', onAbort)
          reject(error.code === 'storage/canceled' ? new UploadCancelledError() : error)
        },
        async () => {
          signal?.removeEventListener('abort', onAbort)
          const url = await getDownloadURL(task.snapshot.ref)
          resolve({ name: file.name, url, path, size: file.size, contentType, provider: 'firebase' })
        },
      )
    })
  },
}
