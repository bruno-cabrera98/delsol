import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Play, Pause, RotateCcw, RotateCw, Volume2, ChevronDown, Download, Trash2, Loader2, AlertCircle, SkipBack, SkipForward, ListMusic, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '@/contexts/PlayerContext'
import { usePlayback } from '@/contexts/PlaybackContext'
import { useQueue } from '@/contexts/QueueContext'
import { useDownloads } from '@/contexts/DownloadsContext'
import { formatTime } from '@/lib/utils'
import type { Episode } from '@/types'

function SkipButton({
  icon: Icon,
  label,
  onClick,
  aria,
  size,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  aria: string
  size: 'sm' | 'md'
}) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      <div className="relative flex items-center justify-center">
        <Icon className={size === 'md' ? 'h-7 w-7' : 'h-6 w-6'} strokeWidth={1.75} />
        <span className={`absolute font-bold tabular-nums ${size === 'md' ? 'text-[9px]' : 'text-[8px]'}`}>
          {label}
        </span>
      </div>
    </button>
  )
}

export function FullPlayer() {
  const { state, togglePlay, seekTo, skip, setVolume, closePlayer, playNext, playPrev } = usePlayer()
  const { history } = usePlayback()
  const { queue, remove: removeFromQueue, clear: clearQueue } = useQueue()
  const { isDownloaded, downloadEpisode, removeDownload, getStatus, getProgress } = useDownloads()
  const { episode, status, currentTime, duration, volume, isExpanded } = state
  const [queueOpen, setQueueOpen] = useState(false)

  const hasPrev = history.some((h) => h.episodeId !== episode?.id)
  const hasNext = queue.length > 0

  if (!episode) return null

  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'
  const img = episode.media.img_894x503 ?? episode.media.img_360x360 ?? episode.programa.img_mini
  const downloaded = isDownloaded(episode.id)
  const dlStatus = getStatus(episode.id)
  const dlProgress = getProgress(episode.id)

  return (
    <Dialog open={isExpanded} onOpenChange={(open) => !open && closePlayer()}>
      <DialogContent className="flex flex-col h-[100dvh] max-h-[100dvh] rounded-none p-0 border-0">
        {/* Blurred background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110"
          style={{ backgroundImage: img ? `url(${img})` : undefined }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-background/80" aria-hidden />

        {/* Content */}
        <div className="relative flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={closePlayer}
              className="h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar reproductor"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
            <div className="text-center flex-1 mx-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest truncate">
                {episode.seccion?.nombre ?? episode.programa.nombre}
              </p>
            </div>
            <button
              onClick={() => setQueueOpen((o) => !o)}
              className={`h-10 w-10 flex items-center justify-center rounded-full transition-colors ${queueOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Ver cola"
            >
              <ListMusic className="h-5 w-5" />
            </button>
          </div>

          {/* Artwork */}
          <div className="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
            <div className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
              {img ? (
                <img src={img} alt={episode.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Play className="h-8 w-8 text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info + controls */}
          <div className="px-6 pb-safe pb-8 space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-foreground text-base leading-snug line-clamp-2">
                  {episode.titulo}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">{episode.programa.nombre}</p>
              </div>
              <button
                onClick={() =>
                  downloaded ? removeDownload(episode.id) : downloadEpisode(episode)
                }
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                aria-label={downloaded ? 'Eliminar descarga' : dlStatus === 'error' ? 'Reintentar descarga' : 'Descargar episodio'}
                disabled={dlStatus === 'downloading'}
                title={dlStatus === 'error' ? 'Error — reintentar' : undefined}
              >
                {dlStatus === 'downloading' ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {dlProgress > 0 && <span className="text-[8px] tabular-nums mt-0.5">{dlProgress}%</span>}
                  </div>
                ) : dlStatus === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : downloaded ? (
                  <Trash2 className="h-4 w-4 text-destructive" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Seek */}
            <div className="space-y-2">
              <Slider
                min={0}
                max={Math.max(1, Math.floor(duration))}
                step={1}
                value={[Math.floor(currentTime)]}
                onValueChange={([v]) => seekTo(v)}
                className="w-full [&_[data-radix-slider-thumb]]:h-5 [&_[data-radix-slider-thumb]]:w-5"
              />
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Prev / Next track */}
            <div className="flex items-center justify-between">
              <button
                onClick={playPrev}
                disabled={!hasPrev}
                className="flex items-center gap-1.5 text-xs text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors disabled:cursor-default"
                aria-label="Episodio anterior"
              >
                <SkipBack className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={playNext}
                disabled={!hasNext}
                className="flex items-center gap-1.5 text-xs text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors disabled:cursor-default"
                aria-label="Siguiente en cola"
              >
                Siguiente
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <SkipButton icon={RotateCcw} label="30" onClick={() => skip(-30)} aria="Retroceder 30 segundos" size="sm" />
              <SkipButton icon={RotateCcw} label="10" onClick={() => skip(-10)} aria="Retroceder 10 segundos" size="md" />

              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="h-16 w-16 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-all shadow-lg disabled:opacity-70"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isLoading ? (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7 fill-white" />
                ) : (
                  <Play className="h-7 w-7 fill-white ml-0.5" />
                )}
              </button>

              <SkipButton icon={RotateCw} label="10" onClick={() => skip(10)} aria="Avanzar 10 segundos" size="md" />
              <SkipButton icon={RotateCw} label="30" onClick={() => skip(30)} aria="Avanzar 30 segundos" size="sm" />
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 pb-6">
              <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Queue panel — slides up from bottom */}
        <div
          className={`absolute inset-x-0 bottom-0 h-1/2 bg-background border-t border-border overflow-y-auto transform transition-transform duration-300 ease-in-out ${queueOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0]
            if (touch && touch.clientY - (e.currentTarget.getBoundingClientRect().top) > 50) {
              setQueueOpen(false)
            }
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
            <span className="text-sm font-semibold">Cola</span>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Vaciar cola"
              >
                Vaciar cola
              </button>
            )}
          </div>

          {/* Now playing */}
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Reproduciendo ahora
          </p>
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b border-border">
            <img
              src={episode.media.img_360x360 ?? episode.programa.img_mini}
              alt=""
              className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{episode.titulo}</p>
              <p className="text-xs text-muted-foreground truncate">{episode.programa.nombre}</p>
            </div>
          </div>

          {/* Up next */}
          {queue.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                A continuación
              </p>
              {queue.map((ep: Episode) => (
                <div key={ep.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <img
                    src={ep.media.img_360x360 ?? ep.programa.img_mini}
                    alt=""
                    className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ep.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">{ep.programa.nombre}</p>
                  </div>
                  <button
                    onClick={() => removeFromQueue(ep.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    aria-label="Quitar de la cola"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
