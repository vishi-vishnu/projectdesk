import { useState } from 'react'
import { Download, ExternalLink, Eye } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import { fileKind } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import type { FileRef } from '@/lib/types'
import { FileIcon } from './FileIcon'

function officeViewerUrl(url: string) {
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
}

/** Office Online can only open files served from a public https URL. */
const canUseOfficeViewer = (f: FileRef) =>
  f.provider === 'cloudinary' && ['slides', 'doc'].includes(fileKind(f.contentType))

export function FileList({ files }: { files: FileRef[] }) {
  const [preview, setPreview] = useState<FileRef | null>(null)

  return (
    <>
      <ul className="divide-y divide-line rounded-md border border-line">
        {files.map((f) => {
          const kind = fileKind(f.contentType)
          const previewable = kind === 'pdf' || kind === 'image'
          return (
            <li key={f.path} className="flex items-center gap-3 px-3 py-2.5">
              <FileIcon contentType={f.contentType} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink" title={f.name}>
                  {f.name}
                </p>
                <p className="text-[12px] text-ink-3">{formatBytes(f.size)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {previewable && (
                  <Button size="sm" variant="ghost" icon={<Eye className="size-4" />} onClick={() => setPreview(f)}>
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                )}
                {canUseOfficeViewer(f) && (
                  <a
                    href={officeViewerUrl(f.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-ink-2 hover:bg-subtle"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    <span className="hidden sm:inline">View</span>
                  </a>
                )}
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  download={f.name}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-ink-2 hover:bg-subtle"
                  aria-label={`Download ${f.name}`}
                >
                  <Download className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)} title={preview?.name ?? ''} size="lg">
        {preview && fileKind(preview.contentType) === 'image' && (
          <img src={preview.url} alt={preview.name} className="mx-auto max-h-[64vh] rounded-md border border-line" />
        )}
        {preview && fileKind(preview.contentType) === 'pdf' && (
          <iframe src={preview.url} title={preview.name} className="h-[64vh] w-full rounded-md border border-line" />
        )}
      </Dialog>
    </>
  )
}
