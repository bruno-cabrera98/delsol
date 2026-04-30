import { Play, Pause, ChevronUp } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { Progress } from '@/components/ui/progress'

export function MiniPlayer() {
  const { state, togglePlay, toggleExpand } = usePlayer()
  const { episode, status, currentTime, duration } = state

  if (!episode) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const isPlaying = status === 'playing' || status === 'loading'
  const img = episode.media.img_360x360 ?? episode.programa.img_mini

  return (
    <div
      className="fixed bottom-14 inset-x-0 z-40 bg-card border-t border-border shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Progress value={progress} className="h-0.5 rounded-none" />
      <div className="flex items-center h-16 px-3 gap-3">
        <button
          onClick={toggleExpand}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          aria-label="Abrir reproductor"
        >
          <img
            src={img}
            alt=""
            className="h-10 w-10 rounded-md object-cover flex-shrink-0 bg-muted"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {episode.titulo}
            </p>
            <p className="text-xs text-muted-foreground truncate">{episode.programa.nombre}</p>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
          </button>

          <button
            onClick={toggleExpand}
            className="h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Expandir reproductor"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
