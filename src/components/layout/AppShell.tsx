import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { MiniPlayer } from '@/components/player/MiniPlayer'
import { FullPlayer } from '@/components/player/FullPlayer'
import { usePlayer } from '@/contexts/PlayerContext'

export function AppShell() {
  const { state } = usePlayer()
  const hasEpisode = !!state.episode

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main
        className="pt-14"
        style={{
          paddingBottom: hasEpisode
            ? 'calc(64px + 56px + env(safe-area-inset-bottom, 0px))'
            : 'calc(56px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Outlet />
      </main>

      <MiniPlayer />
      <FullPlayer />

      {!state.isExpanded && <BottomNav />}
    </div>
  )
}
