import type { AppPreferences, Episode } from '@/types'

const PREFS_KEY = 'delsol-prefs'
const FAVORITES_KEY = 'delsol-favorites'
const SHOWS_CACHE_KEY = 'delsol-shows-cache'
const LAST_EPISODE_KEY = 'delsol-last-episode'
const QUEUE_KEY = 'delsol-queue'
const CACHE_TTL = 60 * 60 * 1000

const DEFAULT_PREFS: AppPreferences = {
  volume: 1,
  lastEpisodeId: null,
  lastPosition: 0,
}

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePreferences(prefs: Partial<AppPreferences>): void {
  try {
    const current = loadPreferences()
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }))
  } catch {
    // storage full or unavailable
  }
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveFavorites(slugs: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(slugs))
  } catch {
    // ignore
  }
}

export function saveLastEpisode(episode: Episode | null): void {
  try {
    if (episode) {
      localStorage.setItem(LAST_EPISODE_KEY, JSON.stringify(episode))
    } else {
      localStorage.removeItem(LAST_EPISODE_KEY)
    }
  } catch {
    // ignore
  }
}

export function loadLastEpisode(): Episode | null {
  try {
    const raw = localStorage.getItem(LAST_EPISODE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Episode
  } catch {
    return null
  }
}

export function loadShowsCache<T>(): T | null {
  try {
    const raw = localStorage.getItem(SHOWS_CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data as T
  } catch {
    return null
  }
}

export function saveShowsCache<T>(data: T): void {
  try {
    localStorage.setItem(SHOWS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // ignore
  }
}

export function loadQueue(): Episode[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveQueue(queue: Episode[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // ignore
  }
}
