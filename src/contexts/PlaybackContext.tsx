import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { PlaybackEntry, ListenState } from '@/types'
import { savePlayback, loadAllPlayback } from '@/lib/db'

const FINISHED_THRESHOLD = 0.80

interface PlaybackContextValue {
  getListenState: (episodeId: string) => ListenState
  getProgress: (episodeId: string) => number
  recordPlay: (episodeId: string, position: number, duration: number) => void
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, PlaybackEntry>>(new Map())

  useEffect(() => {
    loadAllPlayback()
      .then((entries) => setMap(new Map(entries.map((e) => [e.episodeId, e]))))
      .catch(() => {})
  }, [])

  const getListenState = useCallback((episodeId: string): ListenState => {
    const entry = map.get(episodeId)
    if (!entry || entry.duration === 0 || entry.position === 0) return 'unplayed'
    if (entry.position / entry.duration >= FINISHED_THRESHOLD) return 'finished'
    return 'started'
  }, [map])

  const getProgress = useCallback((episodeId: string): number => {
    const entry = map.get(episodeId)
    if (!entry || entry.duration === 0) return 0
    return Math.min(1, entry.position / entry.duration)
  }, [map])

  const recordPlay = useCallback((episodeId: string, position: number, duration: number) => {
    if (!episodeId || duration <= 0 || position <= 0) return
    const entry: PlaybackEntry = { episodeId, position, duration, updatedAt: Date.now() }
    savePlayback(entry).catch(() => {})
    setMap((prev) => {
      const next = new Map(prev)
      next.set(episodeId, entry)
      return next
    })
  }, [])

  return (
    <PlaybackContext.Provider value={{ getListenState, getProgress, recordPlay }}>
      {children}
    </PlaybackContext.Provider>
  )
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider')
  return ctx
}
