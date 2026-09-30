import { File, FileImage, FileText, Presentation } from 'lucide-react'
import { cn } from '@/components/ui'
import { fileKind, fileLabel } from '@/lib/files'

const styles = {
  pdf: 'bg-bad-soft text-bad',
  slides: 'bg-warn-soft text-warn',
  doc: 'bg-brand-soft text-brand',
  image: 'bg-ok-soft text-ok',
  other: 'bg-subtle text-ink-3',
}

export function FileIcon({ contentType, className }: { contentType: string; className?: string }) {
  const kind = fileKind(contentType)
  const Icon = kind === 'image' ? FileImage : kind === 'slides' ? Presentation : kind === 'pdf' || kind === 'doc' ? FileText : File
  return (
    <span
      className={cn('flex size-9 shrink-0 flex-col items-center justify-center rounded-md', styles[kind], className)}
      aria-hidden
    >
      <Icon className="size-4" />
      <span className="mt-px text-[8.5px] leading-none font-semibold tracking-wide">{fileLabel(contentType)}</span>
    </span>
  )
}
