import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import { loadFavorites, saveFavorites } from '@/lib/storage'

interface FavoritesState {
  slugs: string[]
}

type FavoritesAction =
  | { type: 'TOGGLE'; slug: string }
  | { type: 'REMOVE'; slug: string }

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'TOGGLE': {
      const exists = state.slugs.includes(action.slug)
      const slugs = exists
        ? state.slugs.filter((s) => s !== action.slug)
        : [...state.slugs, action.slug]
      saveFavorites(slugs)
      return { slugs }
    }
    case 'REMOVE': {
      const slugs = state.slugs.filter((s) => s !== action.slug)
      saveFavorites(slugs)
      return { slugs }
    }
    default:
      return state
  }
}

interface FavoritesContextValue {
  favorites: string[]
  isFavorite: (slug: string) => boolean
  toggleFavorite: (slug: string) => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(favoritesReducer, undefined, () => ({
    slugs: loadFavorites(),
  }))

  const isFavorite = useCallback((slug: string) => state.slugs.includes(slug), [state.slugs])
  const toggleFavorite = useCallback((slug: string) => dispatch({ type: 'TOGGLE', slug }), [])

  return (
    <FavoritesContext.Provider value={{ favorites: state.slugs, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
