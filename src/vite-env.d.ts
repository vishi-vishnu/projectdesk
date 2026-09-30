/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_USE_EMULATORS?: 'true' | 'false'
  readonly VITE_EMULATOR_HOST?: string
  readonly VITE_STORAGE_PROVIDER?: 'firebase' | 'cloudinary'
  readonly VITE_DEMO_ACCOUNTS?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
