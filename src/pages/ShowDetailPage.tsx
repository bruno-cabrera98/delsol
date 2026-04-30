import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, ExternalLink } from 'lucide-react'
import { useShowDetail } from '@/hooks/useShowDetail'
import { useFavorites } from '@/contexts/FavoritesContext'
import { SectionTabs } from '@/components/episodes/SectionTabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ShowDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { show, loading, error } = useShowDetail(slug ?? '')
  const { isFavorite, toggleFavorite } = useFavorites()

  if (loading) {
    return (
      <div>
        <div className="h-48 bg-muted animate-pulse" />
        <div className="px-4 py-4 space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    )
  }

  if (error || !show) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
        <p className="text-muted-foreground">No se pudo cargar el programa</p>
        <Link to="/" className="text-primary text-sm hover:underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  const isFav = isFavorite(show.id)
  const conductors = show.staff.filter((s) => s.rol === 'conductor')
  const img = show.img_894 || show.img_360

  return (
    <div>
      {/* Hero */}
      <div className="relative">
        {img ? (
          <div className="relative h-52 sm:h-64 overflow-hidden">
            <img
              src={img}
              alt={show.nombre}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/20 to-background" />
        )}

        {/* Back + Fav overlay */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 pt-2">
          <Link
            to="/"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <button
            onClick={() => toggleFavorite(show.id)}
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-all',
              isFav ? 'bg-primary text-white' : 'bg-black/40 text-white hover:bg-black/60'
            )}
            aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Star className={cn('h-4 w-4', isFav && 'fill-white')} />
          </button>
        </div>

        {/* Show info at bottom of hero */}
        <div className="absolute bottom-0 inset-x-0 px-4 pb-4">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">{show.nombre}</h1>
          {conductors.length > 0 && (
            <p className="text-sm text-white/80 drop-shadow mt-0.5">
              {conductors.map((c) => c.nombre).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Social links */}
      {(show.facebook || show.twitter || show.instagram) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
          {show.facebook && (
            <a
              href={show.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Facebook
            </a>
          )}
          {show.twitter && (
            <a
              href={show.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Twitter / X
            </a>
          )}
          {show.instagram && (
            <a
              href={show.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Instagram
            </a>
          )}
        </div>
      )}

      {/* Episodes */}
      <SectionTabs slug={show.id} sections={show.secciones ?? []} />
    </div>
  )
}
