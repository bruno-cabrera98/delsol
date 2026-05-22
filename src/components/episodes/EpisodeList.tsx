import { useEffect, useRef } from 'react'
import { EpisodeRow } from './EpisodeRow'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { Episode } from '@/types'

interface Props {
  episodes: Episode[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  totRecords: number
  onLoadMore: () => void
}

export function EpisodeList({
  episodes,
  loading,
  loadingMore,
  error,
  hasMore,
  totRecords,
  onLoadMore,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(loadingMore)
  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { onLoadMoreRef.current = onLoadMore }, [onLoadMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreRef.current) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center text-muted-foreground px-4">
        <p>No se pudieron cargar los episodios</p>
      </div>
    )
  }

  if (episodes.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground px-4">
        <p>No hay episodios disponibles</p>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {totRecords} episodio{totRecords !== 1 ? 's' : ''}
        </p>
      </div>
      <div>
        {episodes.map((ep) => (
          <EpisodeRow key={ep.id} episode={ep} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Button variant="outline" size="sm" onClick={onLoadMore}>
              Cargar más
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
