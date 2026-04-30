import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { Show } from '@/types'

interface Props {
  shows: Show[]
}

export function FavoritesRow({ shows }: Props) {
  if (shows.length === 0) return null

  return (
    <div className="px-4 pt-2 pb-1">
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Favoritos
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {shows.map((show) => (
          <Link
            key={show.id}
            to={`/show/${show.id}`}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
          >
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/40 bg-muted">
              {show.img_mini ? (
                <img
                  src={show.img_mini}
                  alt={show.nombre}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-lg font-bold text-primary/60">{show.nombre[0]}</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2 w-full">
              {show.nombre}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
