import { Play, Pause, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlayer } from '@/contexts/PlayerContext'
import { usePlayback } from '@/contexts/PlaybackContext'
import { ProgressArc } from '@/components/ui/ProgressArc'
import type { HistoryEntry } from '@/types'

function relativeDate(ts: number): string {
  const now = Date.now()
  const diffMs = now - ts
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 14) return 'Hace 1 semana'
  return `Hace ${Math.floor(diffDays / 7)} semanas`
}

interface Props {
  entry: HistoryEntry
}

export function HistoryRow({ entry }: Props) {
  const { episode, playedAt } = entry
  const { state, playEpisode } = usePlayer()
  const { getListenState, getProgress } = usePlayback()

  const isActive = state.episode?.id === episode.id
  const isPlaying = isActive && state.status === 'playing'
  const listenState = getListenState(episode.id)
  const progress = getProgress(episode.id)
  const img = episode.media.img_360x360 ?? episode.programa.img_mini

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors',
        isActive ? 'bg-primary/5' : 'hover:bg-muted/50'
      )}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
          {img ? (
            <img
              src={img}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
        {listenState !== 'unplayed' && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background shadow-sm flex items-center justify-center">
            {listenState === 'finished' ? (
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ProgressArc progress={progress} />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => { if (!isActive) playEpisode(episode) }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !isActive && playEpisode(episode)}
      >
        <p className={cn('text-sm font-medium leading-snug line-clamp-2', isActive ? 'text-primary' : 'text-foreground')}>
          {episode.titulo}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{episode.programa.nombre}</span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground">{relativeDate(playedAt)}</span>
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={() => { if (!isActive) playEpisode(episode) }}
        className={cn(
          'h-9 w-9 flex items-center justify-center rounded-full transition-all flex-shrink-0',
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
  )
}
