import { useFavorites } from '@/contexts/FavoritesContext'
import { useShows } from '@/hooks/useShows'
import { FavoritesRow } from '@/components/shows/FavoritesRow'
import { ShowGrid } from '@/components/shows/ShowGrid'

export function HomePage() {
  const { shows, loading, error, retry } = useShows()
  const { favorites } = useFavorites()

  const favoriteShows = shows.filter((s) => favorites.includes(s.id))

  return (
    <div>
      <FavoritesRow shows={favoriteShows} />

      <div className="px-4 pt-3 pb-1">
        <h1 className="text-base font-bold text-foreground">
          {favorites.length > 0 ? 'Todos los programas' : 'Programas'}
        </h1>
      </div>

      <ShowGrid shows={shows} loading={loading} error={error} onRetry={retry} />
    </div>
  )
}
