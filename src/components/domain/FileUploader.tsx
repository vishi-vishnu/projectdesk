import { useRef, useState, type DragEvent } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { cn, ProgressBar } from '@/components/ui'
import { ACCEPT_ATTRIBUTE, MAX_FILE_SIZE, MAX_FILES_PER_SUBMISSION } from '@/lib/constants'
import { resolveContentType, validateFile } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import { FileIcon } from './FileIcon'

export interface QueuedFile {
  id: string
  file: File
  progress: number
  error?: string
}

/** Drag-and-drop picker. Uploading is driven by the parent form. */
export function FileUploader({
  files,
  onChange,
  disabled,
}: {
  files: QueuedFile[]
  onChange: (files: QueuedFile[]) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const add = (list: FileList | null) => {
    if (!list) return
    const next = [...files]
    const problems: string[] = []
    for (const file of Array.from(list)) {
      const problem = validateFile(file)
      if (problem) problems.push(problem)
      else if (next.length >= MAX_FILES_PER_SUBMISSION) problems.push(`You can attach up to ${MAX_FILES_PER_SUBMISSION} files.`)
      else if (next.some((q) => q.file.name === file.name && q.file.size === file.size)) continue
      else next.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file, progress: 0 })
    }
    setErrors([...new Set(problems)])
    onChange(next)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) add(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-md border border-dashed px-4 py-7 text-center transition-colors',
          dragging ? 'border-brand bg-brand-soft' : 'border-line-strong bg-subtle/60',
          disabled && 'opacity-60',
        )}
      >
        <UploadCloud className="size-6 text-ink-3" aria-hidden />
        <p className="mt-2 text-[13.5px] text-ink-2">
          Drag files here or{' '}
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="font-medium text-brand hover:underline disabled:no-underline"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-[12px] text-ink-3">
          PDF, PPT/PPTX, DOC/DOCX or images · up to {formatBytes(MAX_FILE_SIZE)} each · max {MAX_FILES_PER_SUBMISSION} files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            add(e.target.files)
            e.target.value = ''
          }}
          aria-label="Choose files to upload"
        />
      </div>

      {errors.length > 0 && (
        <ul className="space-y-1 text-[12.5px] text-bad" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line bg-surface">
          {files.map((q) => (
            <li key={q.id} className="flex items-center gap-3 px-3 py-2.5">
              <FileIcon contentType={resolveContentType(q.file)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[13.5px] font-medium">{q.file.name}</p>
                  <span className="tabular shrink-0 text-[12px] text-ink-3">
                    {disabled && !q.error ? `${q.progress}%` : formatBytes(q.file.size)}
                  </span>
                </div>
                {disabled && !q.error && <ProgressBar value={q.progress} className="mt-1.5" tone={q.progress === 100 ? 'ok' : 'brand'} />}
                {q.error && <p className="mt-0.5 text-[12px] text-bad">{q.error}</p>}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(files.filter((f) => f.id !== q.id))}
                  className="rounded-md p-1.5 text-ink-3 hover:bg-subtle hover:text-ink"
                  aria-label={`Remove ${q.file.name}`}
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
