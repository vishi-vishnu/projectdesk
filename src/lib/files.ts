import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from './constants'
import { formatBytes } from './format'

const EXTENSION_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const baseName = (name: string) => name.split(/[\\/]/).pop() ?? ''

export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]{1,5})$/i.exec(baseName(name))
  return match ? match[1].toLowerCase() : ''
}

/** Some browsers report an empty type for Office files; fall back to the extension. */
export function resolveContentType(file: Pick<File, 'name' | 'type'>): string {
  if (file.type && ACCEPTED_FILE_TYPES[file.type]) return file.type
  return EXTENSION_TYPES[extensionOf(file.name)] ?? file.type ?? ''
}

export function validateFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  const type = resolveContentType(file)
  if (!ACCEPTED_FILE_TYPES[type]) {
    return `${file.name}: only PDF, PPT/PPTX, DOC/DOCX and images (PNG, JPG, WEBP) are accepted.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_SIZE)} per file.`
  }
  if (file.size === 0) return `${file.name} is empty.`
  return null
}

export type FileKind = 'pdf' | 'slides' | 'doc' | 'image' | 'other'

export function fileKind(contentType: string): FileKind {
  if (contentType === 'application/pdf') return 'pdf'
  if (contentType.startsWith('image/')) return 'image'
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'slides'
  if (contentType.includes('word')) return 'doc'
  return 'other'
}

export function fileLabel(contentType: string): string {
  return ACCEPTED_FILE_TYPES[contentType] ?? 'FILE'
}

/** Storage-safe object name: keeps the extension, strips anything unusual. */
export function safeFileName(name: string): string {
  const file = baseName(name)
  const ext = extensionOf(file)
  const base = (ext ? file.slice(0, -(ext.length + 1)) : file)
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .replace(/^\.+/, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return `${base || 'file'}${ext ? `.${ext}` : ''}`
}
