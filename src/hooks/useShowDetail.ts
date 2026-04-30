import { useState, useEffect } from 'react'
import type { ShowDetail } from '@/types'
import { fetchShowDetail } from '@/lib/api'

interface State {
  show: ShowDetail | null
  loading: boolean
  error: string | null
}

const cache = new Map<string, ShowDetail>()

export function useShowDetail(slug: string) {
  const [state, setState] = useState<State>(() => {
    const cached = cache.get(slug)
    return cached
      ? { show: cached, loading: false, error: null }
      : { show: null, loading: true, error: null }
  })

  useEffect(() => {
    if (cache.has(slug)) {
      setState({ show: cache.get(slug)!, loading: false, error: null })
      return
    }
    setState({ show: null, loading: true, error: null })
    fetchShowDetail(slug)
      .then((show) => {
        cache.set(slug, show)
        setState({ show, loading: false, error: null })
      })
      .catch((err: unknown) => {
        setState({
          show: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Error',
        })
      })
  }, [slug])

  return state
}
