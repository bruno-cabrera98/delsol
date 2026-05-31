import { Play, Pause, Download, CheckCircle, Trash2, Loader2, AlertCircle, ListPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { usePlayer } from '@/contexts/PlayerContext'
import { useDownloads } from '@/contexts/DownloadsContext'
import { usePlayback } from '@/contexts/PlaybackContext'
import { useQueue } from '@/contexts/QueueContext'
import { ProgressArc } from '@/components/ui/ProgressArc'
import type { Episode, ListenState } from '@/types'

function ListenBadge({ state, progress }: { state: ListenState; progress: number }) {
  if (state === 'unplayed') return null
  if (state === 'finished') {
    return (
      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center shadow-sm">
        <CheckCircle className="w-3.5 h-3.5 text-primary" />
      </div>
    )
  }
  return (
    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background shadow-sm">
      <ProgressArc progress={progress} />
    </div>
  )
}

interface Props {
  episode: Episode
  showProgramName?: boolean
}

export function EpisodeRow({ episode, showProgramName = false }: Props) {
  const { state, playEpisode } = usePlayer()
  const { getStatus, getProgress, isDownloaded, downloadEpisode, removeDownload } = useDownloads()
  const { getListenState, getProgress: getListenProgress } = usePlayback()
  const { enqueue, queue } = useQueue()
  const isInQueue = queue.some((e) => e.id === episode.id)
  const listenState = getListenState(episode.id)
  const listenProgress = listenState === 'started' ? getListenProgress(episode.id) : 0

  const isActive = state.episode?.id === episode.id
  const isPlaying = isActive && state.status === 'playing'
  const dlStatus = getStatus(episode.id)
  const downloaded = isDownloaded(episode.id)
  const dlProgress = getProgress(episode.id)

  const img = episode.media.img_360x360 ?? episode.programa.img_mini

  function handlePlay() {
    if (isActive) {
      // handled by context
    } else {
      playEpisode(episode)
    }
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    if (downloaded) {
      removeDownload(episode.id)
    } else if (dlStatus !== 'downloading') {
      downloadEpisode(episode)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors',
        isActive ? 'bg-primary/5' : 'hover:bg-muted/50'
      )}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
          {img ? (
            <img
              src={img}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
        <ListenBadge state={listenState} progress={listenProgress} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={handlePlay} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handlePlay()}>
        {showProgramName && (
          <p className="text-[10px] text-primary font-medium uppercase tracking-wide truncate mb-0.5">
            {episode.programa.nombre}
          </p>
        )}
        <p
          className={cn(
            'text-sm font-medium leading-snug line-clamp-2 cursor-pointer',
            isActive ? 'text-primary' : 'text-foreground'
          )}
        >
          {episode.titulo}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{formatDate(episode.fechaEmision_dmy)}</span>
          {episode.duracion && (
            <>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{episode.duracion}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); enqueue(episode) }}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-full transition-colors',
            isInQueue ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="Agregar a la cola"
          title={isInQueue ? 'En la cola' : 'Agregar a la cola'}
        >
          <ListPlus className="h-4 w-4" />
        </button>

        <button
          onClick={handleDownload}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-full transition-colors relative',
            downloaded
              ? 'text-primary hover:text-destructive'
              : dlStatus === 'error'
              ? 'text-destructive hover:text-foreground'
              : dlStatus === 'downloading'
              ? 'text-muted-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={downloaded ? 'Eliminar descarga' : dlStatus === 'error' ? 'Reintentar descarga' : 'Descargar'}
          title={downloaded ? 'Eliminar descarga' : dlStatus === 'error' ? 'Error — reintentar' : 'Descargar'}
        >
          {dlStatus === 'downloading' ? (
            <div className="relative">
              <Loader2 className="h-4 w-4 animate-spin" />
              {dlProgress > 0 && (
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] tabular-nums text-muted-foreground">
                  {dlProgress}%
                </span>
              )}
            </div>
          ) : dlStatus === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : downloaded ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={handlePlay}
          className={cn(
            'h-9 w-9 flex items-center justify-center rounded-full transition-all',
            isActive
              ? 'bg-primary text-white'
              : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
          )}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}

// Compact version for downloads page
export function EpisodeRowCompact({
  episode,
  onDelete,
}: {
  episode: { episodeId: string; titulo: string; programaNombre: string; img?: string; duracion?: string; downloadedAt: string }
  onDelete: (id: string) => void
}) {
  const { state, playEpisode: _playEpisode } = usePlayer()

  const isActive = state.episode?.id === episode.episodeId

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border last:border-0',
        isActive ? 'bg-primary/5' : 'hover:bg-muted/50'
      )}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {episode.img && (
          <img src={episode.img} alt="" loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium line-clamp-2', isActive ? 'text-primary' : 'text-foreground')}>
          {episode.titulo}
        </p>
        <p className="text-xs text-muted-foreground truncate">{episode.programaNombre}</p>
      </div>
      <button
        onClick={() => onDelete(episode.episodeId)}
        className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        aria-label="Eliminar descarga"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
