import { useEffect, useState } from 'react'
import { onSnapshot, type DocumentReference, type FirestoreError, type Query } from 'firebase/firestore'

interface Result<T> {
  data: T
  loading: boolean
  error: FirestoreError | null
}

/**
 * Live document subscription. Pass `null` to skip (e.g. while an id is unknown).
 * `key` must change whenever the reference changes — refs aren't referentially stable.
 */
export function useDocument<T>(ref: DocumentReference<T> | null, key: string | null): Result<T | null> {
  const [state, setState] = useState<Result<T | null> & { key: string | null }>({
    data: null,
    loading: ref !== null,
    error: null,
    key,
  })

  // Reset synchronously when the key changes so stale data never flashes.
  if (state.key !== key) setState({ data: null, loading: ref !== null, error: null, key })

  useEffect(() => {
    if (!ref) return
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.exists() ? snap.data() : null, loading: false, error: null, key }),
      (error) => setState({ data: null, loading: false, error, key }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifies `ref`
  }, [key])

  return { data: state.data, loading: state.loading, error: state.error }
}

export function useCollection<T>(query: Query<T> | null, key: string | null): Result<T[]> {
  const [state, setState] = useState<Result<T[]> & { key: string | null }>({
    data: [],
    loading: query !== null,
    error: null,
    key,
  })

  if (state.key !== key) setState({ data: [], loading: query !== null, error: null, key })

  useEffect(() => {
    if (!query) return
    return onSnapshot(
      query,
      (snap) => setState({ data: snap.docs.map((d) => d.data()), loading: false, error: null, key }),
      (error) => {
        console.error(`[firestore] ${key}:`, error)
        setState({ data: [], loading: false, error, key })
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifies `query`
  }, [key])

  return { data: state.data, loading: state.loading, error: state.error }
}
