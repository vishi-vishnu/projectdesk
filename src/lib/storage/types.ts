import type { FileRef, StorageProviderId } from '../types'

export interface UploadOptions {
  teamId: string
  submissionId: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export interface StorageProvider {
  id: StorageProviderId
  upload(file: File, options: UploadOptions): Promise<FileRef>
}

export class UploadCancelledError extends Error {
  constructor() {
    super('Upload cancelled')
    this.name = 'UploadCancelledError'
  }
}
