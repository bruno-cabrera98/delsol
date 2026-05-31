export interface StaffMember {
  rol: string
  nombre: string
  img?: string
}

export interface Show {
  id: string
  nombre: string
  url: string
  img_360: string
  img_894: string
  img_mini: string
  icon?: string
  publicar: boolean
  episodios: boolean
  staff: StaffMember[]
  facebook?: string
  twitter?: string
  instagram?: string
  telefono?: string
  whatsapp?: string
  correo?: string
}

export interface Section {
  id: string      // used as section slug in API URLs
  nombre: string
  orden?: string | number
}

export interface ShowDetail extends Show {
  secciones: Section[]
}

export interface EpisodeMedia {
  img_base?: string
  img_360x360?: string
  img_894x503?: string
  img_320X180?: string
  titulo?: string
  autor?: string
  imagenPie?: string
}

export interface Episode {
  id: string
  titulo: string
  resumen?: string
  tipoContenido?: string
  url?: string
  urlShort?: string
  fechaEmision_full?: string
  fechaEmision_dmy: string
  duracion: string
  duracion_mp3?: string
  nombre_estado?: string
  source_mp3: string
  source_video?: string
  url_name: string
  url_programa_id?: string
  url_subprograma_id?: string
  media: EpisodeMedia
  programa: Pick<Show, 'id' | 'nombre' | 'url' | 'img_mini' | 'img_360'>
  seccion?: { id: string; nombre: string; orden?: string }
}

export interface PaginatedResponse {
  page: number
  recordPage: number
  totRecords: number
  totPage: number
  offset: number
  records: Episode[]
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface PlayerState {
  episode: Episode | null
  status: PlayerStatus
  currentTime: number
  duration: number
  volume: number
  isExpanded: boolean
}

export type PlayerAction =
  | { type: 'LOAD'; episode: Episode }
  | { type: 'RESTORE'; episode: Episode; currentTime: number }
  | { type: 'SET_STATUS'; status: PlayerStatus }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SEEK'; time: number }
  | { type: 'TOGGLE_EXPAND' }
  | { type: 'CLOSE_PLAYER' }

export type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error'

export interface DownloadEntry {
  episodeId: string
  titulo: string
  programaNombre: string
  source_mp3: string
  downloadedAt: string
  fileSizeBytes?: number
  img?: string
  duracion?: string
}

export interface AppPreferences {
  volume: number
  lastEpisodeId: string | null
  lastPosition: number
}

export interface PlaybackEntry {
  episodeId: string
  position: number  // seconds
  duration: number  // seconds
  updatedAt: number // ms timestamp
}

export interface HistoryEntry {
  episodeId: string
  episode: Episode  // snapshot at time of play
  playedAt: number  // ms timestamp
}

export type ListenState = 'unplayed' | 'started' | 'finished'
