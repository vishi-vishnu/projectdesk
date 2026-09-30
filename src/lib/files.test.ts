import { describe, expect, it } from 'vitest'
import { fileKind, resolveContentType, safeFileName, validateFile } from './files'

describe('validateFile', () => {
  it('accepts review documents and images', () => {
    expect(validateFile({ name: 'review.pdf', type: 'application/pdf', size: 1000 })).toBeNull()
    expect(validateFile({ name: 'slides.pptx', type: '', size: 1000 })).toBeNull()
    expect(validateFile({ name: 'shot.PNG', type: 'image/png', size: 1000 })).toBeNull()
  })

  it('rejects other types, empty and oversized files', () => {
    expect(validateFile({ name: 'app.exe', type: 'application/x-msdownload', size: 10 })).toMatch(/only PDF/)
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 0 })).toMatch(/empty/)
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 16 * 1024 * 1024 })).toMatch(/15 MB/)
  })
})

describe('helpers', () => {
  it('falls back to the extension when the browser reports no type', () => {
    expect(resolveContentType({ name: 'report.docx', type: '' })).toContain('wordprocessingml')
  })

  it('classifies files for icons and previews', () => {
    expect(fileKind('application/pdf')).toBe('pdf')
    expect(fileKind('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('slides')
    expect(fileKind('image/webp')).toBe('image')
  })

  it('makes storage-safe names', () => {
    expect(safeFileName('Review 2 — Final (v3).pdf')).toBe('Review-2-Final-v3.pdf')
    expect(safeFileName('../../etc/passwd')).not.toContain('/')
  })
})
