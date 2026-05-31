import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import type { PlayerState, PlayerAction, Episode, PlayerStatus } from '@/types'
import { loadPreferences, savePreferences, loadLastEpisode, saveLastEpisode } from '@/lib/storage'
import { getBlob } from '@/lib/db'
import { usePlayback } from '@/contexts/PlaybackContext'
import { useQueue } from '@/contexts/QueueContext'

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        episode: action.episode,
        status: 'loading',
        currentTime: 0,
        duration: 0,
      }
    case 'RESTORE':
      return {
        ...state,
        episode: action.episode,
        status: 'paused',
        currentTime: action.currentTime,
        duration: 0,
      }
    case 'SET_STATUS':
      return { ...state, status: action.status }
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.time }
    case 'SET_DURATION':
      return { ...state, duration: action.duration }
    case 'SET_VOLUME':
      return { ...state, volume: action.volume }
    case 'SEEK':
      return { ...state, currentTime: action.time }
    case 'TOGGLE_EXPAND':
      return { ...state, isExpanded: !state.isExpanded }
    case 'CLOSE_PLAYER':
      return { ...state, isExpanded: false }
    default:
      return state
  }
}

interface PlayerContextValue {
  state: PlayerState
  playEpisode: (episode: Episode) => Promise<void>
  playNext: () => void
  playPrev: () => void
  togglePlay: () => void
  seekTo: (seconds: number) => void
  skip: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleExpand: () => void
  closePlayer: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const prefs = loadPreferences()

  const [state, dispatch] = useReducer(playerReducer, {
    episode: null,
    status: 'idle' as PlayerStatus,
    currentTime: prefs.lastPosition,
    duration: 0,
    volume: prefs.volume,
    isExpanded: false,
  })

  const { recordPlay, addToHistory, getPosition, history } = usePlayback()
  const { dequeue } = useQueue()

  const audioRef = useRef<HTMLAudioElement>(new Audio())
  const blobUrlRef = useRef<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refs so onEnded (set up once) always calls the latest functions
  const dequeueRef = useRef(dequeue)
  const playEpisodeRef = useRef<(episode: Episode) => Promise<void>>(async () => {})
  const playNextRef = useRef<() => void>(() => {})
  const playPrevRef = useRef<() => void>(() => {})
  useEffect(() => { dequeueRef.current = dequeue }, [dequeue])

  useEffect(() => {
    const audio = audioRef.current
    audio.volume = prefs.volume

    const onTimeUpdate = () => dispatch({ type: 'SET_CURRENT_TIME', time: audio.currentTime })
    const onLoadedMetadata = () => dispatch({ type: 'SET_DURATION', duration: audio.duration })
    const onPlaying = () => dispatch({ type: 'SET_STATUS', status: 'playing' })
    const onPause = () => dispatch({ type: 'SET_STATUS', status: 'paused' })
    const onEnded = () => {
      dispatch({ type: 'SET_STATUS', status: 'idle' })
      const next = dequeueRef.current()
      if (next) Promise.resolve().then(() => playEpisodeRef.current(next))
    }
    const onError = () => dispatch({ type: 'SET_STATUS', status: 'error' })
    const onWaiting = () => dispatch({ type: 'SET_STATUS', status: 'loading' })

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.addEventListener('waiting', onWaiting)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('waiting', onWaiting)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore last session on mount
  useEffect(() => {
    const episode = loadLastEpisode()
    if (!episode) return
    const prefs = loadPreferences()
    const audio = audioRef.current

    dispatch({ type: 'RESTORE', episode, currentTime: prefs.lastPosition })

    const loadSrc = async () => {
      try {
        const blob = await getBlob(episode.id)
        if (blob) {
          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url
          audio.src = url
        } else {
          audio.src = episode.source_mp3
        }
      } catch {
        audio.src = episode.source_mp3
      }
      audio.volume = prefs.volume

      // Seek to saved position once metadata is available
      const onMeta = () => {
        audio.currentTime = prefs.lastPosition
        audio.removeEventListener('loadedmetadata', onMeta)
      }
      audio.addEventListener('loadedmetadata', onMeta)
      audio.load()
    }

    loadSrc()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save episode immediately when it changes
  useEffect(() => {
    saveLastEpisode(state.episode)
  }, [state.episode])

  // Save position every 5 seconds while playing, and immediately on pause/stop
  useEffect(() => {
    if (saveTimerRef.current) clearInterval(saveTimerRef.current)
    if (!state.episode) return

    const save = () => {
      const pos = audioRef.current.currentTime
      const dur = audioRef.current.duration || 0
      savePreferences({
        lastEpisodeId: state.episode?.id ?? null,
        lastPosition: pos,
        volume: state.volume,
      })
      if (state.episode?.id) recordPlay(state.episode.id, pos, dur)
    }

    if (state.status === 'playing') {
      save()
      saveTimerRef.current = setInterval(save, 5000)
    } else {
      save()
    }

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
    }
  }, [state.status, state.episode, state.volume])

  const playEpisode = useCallback(async (episode: Episode) => {
    const audio = audioRef.current

    // Record history before audio setup (fire-and-forget)
    addToHistory(episode)

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }

    dispatch({ type: 'LOAD', episode })

    try {
      const blob = await getBlob(episode.id)
      if (blob) {
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        audio.src = url
      } else {
        audio.src = episode.source_mp3
      }
    } catch {
      audio.src = episode.source_mp3
    }

    audio.volume = state.volume

    // Resume from saved position after metadata loads
    const savedPos = getPosition(episode.id)
    const onMeta = () => {
      if (savedPos > 0) audio.currentTime = savedPos
      audio.removeEventListener('loadedmetadata', onMeta)
    }
    audio.addEventListener('loadedmetadata', onMeta)

    audio.load()

    try {
      await audio.play()
    } catch (err) {
      console.error('Playback failed:', err)
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: episode.titulo,
        artist: episode.programa.nombre,
        artwork: episode.media.img_360x360
          ? [{ src: episode.media.img_360x360, sizes: '360x360', type: 'image/jpeg' }]
          : [],
      })
      navigator.mediaSession.setActionHandler('play', () => audio.play())
      navigator.mediaSession.setActionHandler('pause', () => audio.pause())
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        audio.currentTime = Math.max(0, audio.currentTime - 10)
      })
      navigator.mediaSession.setActionHandler('seekforward', () => {
        audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 10)
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current())
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current())
    }
  }, [state.volume, addToHistory, getPosition])

  const playNext = useCallback(() => {
    const next = dequeue()
    if (next) playEpisode(next)
  }, [dequeue, playEpisode])

  const playPrev = useCallback(() => {
    const prev = history.find((h) => h.episodeId !== state.episode?.id)
    if (prev) playEpisode(prev.episode)
  }, [history, state.episode, playEpisode])

  // Keep refs current so onEnded and MediaSession can always call the latest versions
  useEffect(() => { playEpisodeRef.current = playEpisode }, [playEpisode])
  useEffect(() => { playNextRef.current = playNext }, [playNext])
  useEffect(() => { playPrevRef.current = playPrev }, [playPrev])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (audio.paused) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [])

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, seconds))
    dispatch({ type: 'SEEK', time: audio.currentTime })
  }, [])

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds))
  }, [])

  const setVolume = useCallback((volume: number) => {
    audioRef.current.volume = volume
    dispatch({ type: 'SET_VOLUME', volume })
  }, [])

  const toggleExpand = useCallback(() => dispatch({ type: 'TOGGLE_EXPAND' }), [])
  const closePlayer = useCallback(() => dispatch({ type: 'CLOSE_PLAYER' }), [])

  return (
    <PlayerContext.Provider
      value={{ state, playEpisode, playNext, playPrev, togglePlay, seekTo, skip, setVolume, toggleExpand, closePlayer }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
