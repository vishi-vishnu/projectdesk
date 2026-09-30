import { cloudinaryProvider } from './cloudinary'
import type { StorageProvider } from './types'

export * from './types'

/**
 * Select the file storage backend at build time.
 *  - "firebase"   → Firebase Storage (local emulator, or Blaze-plan projects)
 *  - "cloudinary" → Cloudinary free tier via the signed-upload API route
 * The Firebase Storage SDK is imported on demand so it stays out of the
 * Cloudinary bundle.
 */
const lazyFirebaseProvider: StorageProvider = {
  id: 'firebase',
  async upload(file, options) {
    const { firebaseStorageProvider } = await import('./firebaseStorage')
    return firebaseStorageProvider.upload(file, options)
  },
}

export const storageProvider: StorageProvider =
  import.meta.env.VITE_STORAGE_PROVIDER === 'cloudinary' ? cloudinaryProvider : lazyFirebaseProvider
