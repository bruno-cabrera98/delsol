import { usePlayback } from '@/contexts/PlaybackContext'
import { HistoryRow } from '@/components/episodes/HistoryRow'

export function HistoryPage() {
  const { history, clearAllHistory } = usePlayback()

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-base font-semibold">Historial</h1>
          {history.length > 0 && (
            <p className="text-xs text-muted-foreground">{history.length} episodios</p>
          )}
        </div>
        {history.length > 0 && (
          <button
            onClick={clearAllHistory}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* List */}
      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">No hay episodios en el historial</p>
        </div>
      ) : (
        <div>
          {history.map((entry) => (
            <HistoryRow key={entry.episodeId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
