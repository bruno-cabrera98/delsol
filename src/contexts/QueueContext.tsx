import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import type { Episode } from '@/types'
import { loadQueue, saveQueue } from '@/lib/storage'

const QUEUE_MAX = 20

interface QueueContextValue {
  queue: Episode[]
  enqueue: (episode: Episode) => void
  dequeue: () => Episode | undefined
  remove: (episodeId: string) => void
  clear: () => void
}

const QueueContext = createContext<QueueContextValue | null>(null)

export function QueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Episode[]>(() => loadQueue())
  const queueRef = useRef<Episode[]>(queue)

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  const enqueue = useCallback((episode: Episode) => {
    const current = queueRef.current
    if (current.length >= QUEUE_MAX) return
    if (current.some((e) => e.id === episode.id)) return
    const next = [...current, episode]
    queueRef.current = next
    setQueue(next)
    saveQueue(next)
  }, [])

  // Reads from ref so return value is always correct regardless of render cycle
  const dequeue = useCallback((): Episode | undefined => {
    const current = queueRef.current
    if (current.length === 0) return undefined
    const [first, ...rest] = current
    queueRef.current = rest
    setQueue(rest)
    saveQueue(rest)
    return first
  }, [])

  const remove = useCallback((episodeId: string) => {
    const next = queueRef.current.filter((e) => e.id !== episodeId)
    queueRef.current = next
    setQueue(next)
    saveQueue(next)
  }, [])

  const clear = useCallback(() => {
    queueRef.current = []
    setQueue([])
    saveQueue([])
  }, [])

  return (
    <QueueContext.Provider value={{ queue, enqueue, dequeue, remove, clear }}>
      {children}
    </QueueContext.Provider>
  )
}

export function useQueue() {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueue must be used within QueueProvider')
  return ctx
}
