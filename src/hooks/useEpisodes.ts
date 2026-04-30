import { useState, useEffect, useCallback, useRef } from 'react'
import type { Episode } from '@/types'
import { fetchEpisodes } from '@/lib/api'

interface State {
  episodes: Episode[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  page: number
  totPage: number
  totRecords: number
}

export function useEpisodes(slug: string, section: string | null) {
  const [state, setState] = useState<State>({
    episodes: [],
    loading: true,
    loadingMore: false,
    error: null,
    page: 1,
    totPage: 1,
    totRecords: 0,
  })

  const keyRef = useRef('')

  useEffect(() => {
    const key = `${slug}::${section ?? ''}`
    keyRef.current = key
    setState({ episodes: [], loading: true, loadingMore: false, error: null, page: 1, totPage: 1, totRecords: 0 })

    fetchEpisodes(slug, section, 1)
      .then((res) => {
        if (keyRef.current !== key) return
        setState({
          episodes: res.records,
          loading: false,
          loadingMore: false,
          error: null,
          page: 1,
          totPage: res.totPage,
          totRecords: res.totRecords,
        })
      })
      .catch((err: unknown) => {
        if (keyRef.current !== key) return
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Error',
        }))
      })
  }, [slug, section])

  const loadMore = useCallback(() => {
    setState((s) => {
      if (s.loadingMore || s.page >= s.totPage) return s
      const nextPage = s.page + 1
      const key = `${slug}::${section ?? ''}`
      fetchEpisodes(slug, section, nextPage).then((res) => {
        if (keyRef.current !== key) return
        setState((prev) => ({
          ...prev,
          episodes: [...prev.episodes, ...res.records],
          loadingMore: false,
          page: nextPage,
          totPage: res.totPage,
        }))
      })
      return { ...s, loadingMore: true }
    })
  }, [slug, section])

  const hasMore = state.page < state.totPage

  return { ...state, hasMore, loadMore }
}
