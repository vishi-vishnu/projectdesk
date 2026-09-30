/* In-browser stand-in for `firebase/storage` (UI tests only). Files live as blob URLs. */
const urls = new Map<string, string>()

export const getStorage = () => ({})
export const connectStorageEmulator = () => {}
export const ref = (_storage: unknown, path: string) => ({ fullPath: path })

export function uploadBytesResumable(r: { fullPath: string }, file: File) {
  let cancelled = false
  const snapshot = { ref: r, bytesTransferred: 0, totalBytes: file.size || 1 }
  return {
    snapshot,
    cancel: () => {
      cancelled = true
    },
    on(
      _event: string,
      next: (s: typeof snapshot) => void,
      error: (e: { code: string }) => void,
      complete: () => void,
    ) {
      let step = 0
      const tick = () => {
        if (cancelled) return error({ code: 'storage/canceled' })
        step++
        snapshot.bytesTransferred = Math.min(snapshot.totalBytes, Math.round((snapshot.totalBytes * step) / 5))
        next(snapshot)
        if (step < 5) setTimeout(tick, 120)
        else {
          urls.set(r.fullPath, URL.createObjectURL(file))
          complete()
        }
      }
      setTimeout(tick, 120)
    },
  }
}

export async function getDownloadURL(r: { fullPath: string }) {
  return urls.get(r.fullPath) ?? ''
}
