import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Show } from '@/types'
import { useFavorites } from '@/contexts/FavoritesContext'

interface Props {
  show: Show
}

export function ShowCard({ show }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(show.id)
  const img = show.img_360 || show.img_894 || show.img_mini
  const conductor = show.staff.find((s) => s.rol === 'conductor')

  return (
    <div className="relative group">
      <Link
        to={`/show/${show.id}`}
        className="block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
      >
        <div className="aspect-square bg-muted overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={show.nombre}
              loading="lazy"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-2xl font-bold text-primary/60">{show.nombre[0]}</span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {show.nombre}
          </p>
          {conductor && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{conductor.nombre}</p>
          )}
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleFavorite(show.id)
        }}
        className={cn(
          'absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-all',
          fav
            ? 'bg-primary text-white'
            : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100'
        )}
        aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        <Star className={cn('h-3.5 w-3.5', fav && 'fill-white')} />
      </button>
    </div>
  )
}
