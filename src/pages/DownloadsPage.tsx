import { useState, useEffect } from 'react'
import { Download, Trash2, HardDrive, Loader2 } from 'lucide-react'
import { useDownloads } from '@/contexts/DownloadsContext'
import { usePlayer } from '@/contexts/PlayerContext'
import { EpisodeRowCompact } from '@/components/episodes/EpisodeRow'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatBytes } from '@/lib/utils'

export function DownloadsPage() {
  const { downloads, pendingDownloads, loaded, removeDownload, clearAll } = useDownloads()
  const { playEpisode } = usePlayer()
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((est) => {
        if (est.usage != null && est.quota != null) {
          setStorageInfo({ usage: est.usage, quota: est.quota })
        }
      })
    }
  }, [downloads])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isEmpty = downloads.length === 0 && pendingDownloads.length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Download className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Sin descargas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Descargá episodios para escucharlos sin conexión
          </p>
        </div>
      </div>
    )
  }

  const totalSize = downloads.reduce((sum, d) => sum + (d.fileSizeBytes ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h1 className="font-bold text-foreground">
            {downloads.length} episodio{downloads.length !== 1 ? 's' : ''} descargado{downloads.length !== 1 ? 's' : ''}
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <HardDrive className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatBytes(totalSize)}
              {storageInfo && ` · ${formatBytes(storageInfo.usage)} usados de ${formatBytes(storageInfo.quota)}`}
            </span>
          </div>
        </div>
        {downloads.length > 0 && (
          !confirmClear ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive flex-shrink-0"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar todo
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await clearAll()
                  setConfirmClear(false)
                }}
              >
                Confirmar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
                Cancelar
              </Button>
            </div>
          )
        )}
      </div>

      {/* In-progress downloads */}
      {pendingDownloads.length > 0 && (
        <div className="border-b border-border">
          {pendingDownloads.map(({ entry, progress }) => (
            <div
              key={entry.episodeId}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {entry.img && (
                  <img src={entry.img} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1 text-foreground">{entry.titulo}</p>
                <p className="text-xs text-muted-foreground truncate mb-1.5">{entry.programaNombre}</p>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="flex-1 h-1" />
                  <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                    {progress > 0 ? `${progress}%` : '…'}
                  </span>
                </div>
              </div>
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Completed downloads */}
      <div>
        {downloads.map((dl) => (
          <div
            key={dl.episodeId}
            onClick={() => {
              playEpisode({
                id: dl.episodeId,
                titulo: dl.titulo,
                fechaEmision_dmy: dl.downloadedAt.slice(0, 10),
                duracion: dl.duracion ?? '',
                source_mp3: dl.source_mp3,
                url_name: dl.episodeId,
                media: { img_360x360: dl.img },
                programa: { id: '', nombre: dl.programaNombre, url: '', img_mini: dl.img ?? '', img_360: dl.img ?? '' },
              })
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && void 0}
            className="cursor-pointer"
          >
            <EpisodeRowCompact
              episode={dl}
              onDelete={(id) => {
                removeDownload(id)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
