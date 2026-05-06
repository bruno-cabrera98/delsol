import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { DownloadEntry, DownloadStatus, Episode } from '@/types'
import { addDownload, getAllDownloads, deleteDownload, clearAllDownloads } from '@/lib/db'

interface DownloadsState {
  downloads: DownloadEntry[]
  pending: Map<string, DownloadEntry>
  statuses: Map<string, DownloadStatus>
  progress: Map<string, number>
  loaded: boolean
}

type DownloadsAction =
  | { type: 'INIT'; downloads: DownloadEntry[] }
  | { type: 'ADD_PENDING'; entry: DownloadEntry }
  | { type: 'SET_PROGRESS'; episodeId: string; progress: number }
  | { type: 'ADD'; entry: DownloadEntry }
  | { type: 'ERROR_PENDING'; episodeId: string }
  | { type: 'REMOVE'; episodeId: string }
  | { type: 'CLEAR' }

function downloadsReducer(state: DownloadsState, action: DownloadsAction): DownloadsState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        downloads: action.downloads,
        statuses: new Map(action.downloads.map((d) => [d.episodeId, 'done'])),
        loaded: true,
      }
    case 'ADD_PENDING': {
      const pending = new Map(state.pending)
      pending.set(action.entry.episodeId, action.entry)
      const statuses = new Map(state.statuses)
      statuses.set(action.entry.episodeId, 'downloading')
      const progress = new Map(state.progress)
      progress.set(action.entry.episodeId, 0)
      return { ...state, pending, statuses, progress }
    }
    case 'SET_PROGRESS': {
      const progress = new Map(state.progress)
      progress.set(action.episodeId, action.progress)
      return { ...state, progress }
    }
    case 'ADD': {
      const pending = new Map(state.pending)
      pending.delete(action.entry.episodeId)
      const statuses = new Map(state.statuses)
      statuses.set(action.entry.episodeId, 'done')
      const progress = new Map(state.progress)
      progress.delete(action.entry.episodeId)
      return {
        ...state,
        downloads: [action.entry, ...state.downloads.filter((d) => d.episodeId !== action.entry.episodeId)],
        statuses,
        progress,
        pending,
      }
    }
    case 'ERROR_PENDING': {
      const pending = new Map(state.pending)
      pending.delete(action.episodeId)
      const statuses = new Map(state.statuses)
      statuses.set(action.episodeId, 'error')
      const progress = new Map(state.progress)
      progress.delete(action.episodeId)
      return { ...state, pending, statuses, progress }
    }
    case 'REMOVE': {
      const pending = new Map(state.pending)
      pending.delete(action.episodeId)
      const statuses = new Map(state.statuses)
      statuses.delete(action.episodeId)
      return {
        ...state,
        downloads: state.downloads.filter((d) => d.episodeId !== action.episodeId),
        statuses,
        pending,
      }
    }
    case 'CLEAR':
      return { ...state, downloads: [], statuses: new Map(), progress: new Map(), pending: new Map() }
    default:
      return state
  }
}

export interface PendingDownload {
  entry: DownloadEntry
  progress: number
}

interface DownloadsContextValue {
  downloads: DownloadEntry[]
  pendingDownloads: PendingDownload[]
  loaded: boolean
  getStatus: (episodeId: string) => DownloadStatus
  getProgress: (episodeId: string) => number
  isDownloaded: (episodeId: string) => boolean
  downloadEpisode: (episode: Episode) => Promise<void>
  removeDownload: (episodeId: string) => Promise<void>
  clearAll: () => Promise<void>
}

const DownloadsContext = createContext<DownloadsContextValue | null>(null)

// Route cdn.dl.uy URLs through our Cloudflare proxy so downloads work regardless
// of CORS headers or cross-origin redirects on the CDN.
function cdnProxyUrl(source_mp3: string): string {
  try {
    const u = new URL(source_mp3)
    if (u.hostname === 'cdn.dl.uy') {
      return '/dlproxy' + u.pathname + u.search
    }
  } catch { /* not a valid URL, use as-is */ }
  return source_mp3
}

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(downloadsReducer, {
    downloads: [],
    pending: new Map(),
    statuses: new Map(),
    progress: new Map(),
    loaded: false,
  })

  useEffect(() => {
    getAllDownloads()
      .then((downloads) => dispatch({ type: 'INIT', downloads }))
      .catch(console.error)
  }, [])

  const getStatus = useCallback(
    (episodeId: string): DownloadStatus => state.statuses.get(episodeId) ?? 'idle',
    [state.statuses]
  )

  const getProgress = useCallback(
    (episodeId: string): number => state.progress.get(episodeId) ?? 0,
    [state.progress]
  )

  const isDownloaded = useCallback(
    (episodeId: string) => state.statuses.get(episodeId) === 'done',
    [state.statuses]
  )

  const pendingDownloads: PendingDownload[] = Array.from(state.pending.entries()).map(([id, entry]) => ({
    entry,
    progress: state.progress.get(id) ?? 0,
  }))

  const downloadEpisode = useCallback(async (episode: Episode) => {
    const id = episode.id
    if (state.statuses.get(id) === 'downloading' || state.statuses.get(id) === 'done') return

    const entry: DownloadEntry = {
      episodeId: id,
      titulo: episode.titulo,
      programaNombre: episode.programa.nombre,
      source_mp3: episode.source_mp3,
      downloadedAt: new Date().toISOString(),
      img: episode.media.img_360x360 ?? episode.programa.img_mini,
      duracion: episode.duracion,
    }

    dispatch({ type: 'ADD_PENDING', entry })

    // Route CDN audio through our same-origin proxy to avoid CORS / redirect issues.
    const downloadUrl = cdnProxyUrl(episode.source_mp3)

    try {
      const res = await fetch(downloadUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const contentLength = res.headers.get('Content-Length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      let received = 0
      const chunks: ArrayBuffer[] = []

      const reader = res.body!.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
        received += value.length
        if (total > 0) {
          dispatch({ type: 'SET_PROGRESS', episodeId: id, progress: Math.round((received / total) * 100) })
        }
      }

      const blob = new Blob(chunks, { type: 'audio/mpeg' })
      await addDownload({ ...entry, fileSizeBytes: blob.size }, blob)
      dispatch({ type: 'ADD', entry: { ...entry, fileSizeBytes: blob.size } })
    } catch (err) {
      console.error('Download failed:', err)
      dispatch({ type: 'ERROR_PENDING', episodeId: id })
    }
  }, [state.statuses])

  const removeDownload = useCallback(async (episodeId: string) => {
    await deleteDownload(episodeId)
    dispatch({ type: 'REMOVE', episodeId })
  }, [])

  const clearAll = useCallback(async () => {
    await clearAllDownloads()
    dispatch({ type: 'CLEAR' })
  }, [])

  return (
    <DownloadsContext.Provider
      value={{ downloads: state.downloads, pendingDownloads, loaded: state.loaded, getStatus, getProgress, isDownloaded, downloadEpisode, removeDownload, clearAll }}
    >
      {children}
    </DownloadsContext.Provider>
  )
}

export function useDownloads() {
  const ctx = useContext(DownloadsContext)
  if (!ctx) throw new Error('useDownloads must be used within DownloadsProvider')
  return ctx
}
