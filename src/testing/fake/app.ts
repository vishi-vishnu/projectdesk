/* In-browser stand-in for `firebase/app` (UI tests only, see vite.config.ts). */
export class FirebaseError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'FirebaseError'
  }
}

export function initializeApp(options: unknown) {
  return { name: '[fake]', options }
}

export function getApp() {
  return { name: '[fake]', options: {} }
}
