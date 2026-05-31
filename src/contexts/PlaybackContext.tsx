import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import type { PlaybackEntry, HistoryEntry, ListenState, Episode } from '@/types'
import { savePlayback, loadAllPlayback, addHistoryEntry, getAllHistory, deleteHistoryEntry, clearHistory } from '@/lib/db'

const FINISHED_THRESHOLD = 0.80
const HISTORY_MAX = 50

interface PlaybackContextValue {
  getListenState: (episodeId: string) => ListenState
  getProgress: (episodeId: string) => number
  getPosition: (episodeId: string) => number
  recordPlay: (episodeId: string, position: number, duration: number) => void
  addToHistory: (episode: Episode) => void
  history: HistoryEntry[]
  clearAllHistory: () => void
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, PlaybackEntry>>(new Map())
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const historyRef = useRef<HistoryEntry[]>([])

  useEffect(() => {
    Promise.all([loadAllPlayback(), getAllHistory()])
      .then(([playback, hist]) => {
        setMap(new Map(playback.map((e) => [e.episodeId, e])))
        const sorted = hist.sort((a, b) => b.playedAt - a.playedAt)
        historyRef.current = sorted
        setHistory(sorted)
      })
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

  // Returns saved position in seconds (0 if never played)
  // Note: recordPlay guards position > 0, so getPosition returns 0 for never-played episodes.
  // The resume handler's `if (savedPos > 0)` relies on this — both guards must stay in sync.
  const getPosition = useCallback((episodeId: string): number => {
    return map.get(episodeId)?.position ?? 0
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

  const addToHistory = useCallback((episode: Episode) => {
    const entry: HistoryEntry = { episodeId: episode.id, episode, playedAt: Date.now() }
    addHistoryEntry(entry).catch(() => {})

    const prev = historyRef.current
    const filtered = prev.filter((h) => h.episodeId !== episode.id)
    const updated = [entry, ...filtered]
    const trimmed = updated.slice(0, HISTORY_MAX)

    // Delete evicted entry from IDB if over cap
    if (updated.length > HISTORY_MAX) {
      deleteHistoryEntry(updated[HISTORY_MAX].episodeId).catch(() => {})
    }

    historyRef.current = trimmed
    setHistory(trimmed)
  }, [])

  const clearAllHistory = useCallback(() => {
    clearHistory().catch(() => {})
    historyRef.current = []
    setHistory([])
  }, [])

  return (
    <PlaybackContext.Provider value={{ getListenState, getProgress, getPosition, recordPlay, addToHistory, history, clearAllHistory }}>
      {children}
    </PlaybackContext.Provider>
  )
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider')
  return ctx
}
