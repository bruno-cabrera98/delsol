import { useState, useEffect, useRef } from 'react'
import type { Show } from '@/types'
import { fetchShows } from '@/lib/api'
import { loadShowsCache, saveShowsCache } from '@/lib/storage'

interface State {
  shows: Show[]
  loading: boolean
  error: string | null
}

const cache = { current: null as Show[] | null }

export function useShows() {
  const [state, setState] = useState<State>(() => {
    const cached = loadShowsCache<Show[]>()
    if (cached) {
      cache.current = cached
      return { shows: cached, loading: false, error: null }
    }
    return { shows: [], loading: true, error: null }
  })

  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    fetchShows()
      .then((shows) => {
        cache.current = shows
        saveShowsCache(shows)
        setState({ shows, loading: false, error: null })
      })
      .catch((err: unknown) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
        }))
      })
  }, [])

  function retry() {
    setState({ shows: [], loading: true, error: null })
    fetched.current = false
    cache.current = null
  }

  return { ...state, retry }
}
