import { useEffect } from 'react'

/** Sets the browser tab title, e.g. "Review queue · ProjectDesk". */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = `${title} · ProjectDesk`
    return () => {
      document.title = previous
    }
  }, [title])
}
