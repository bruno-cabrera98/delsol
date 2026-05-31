import { HashRouter, Routes, Route } from 'react-router-dom'
import { PlaybackProvider } from '@/contexts/PlaybackContext'
import { QueueProvider } from '@/contexts/QueueContext'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { DownloadsProvider } from '@/contexts/DownloadsContext'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { ShowDetailPage } from '@/pages/ShowDetailPage'
import { DownloadsPage } from '@/pages/DownloadsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { HistoryPage } from '@/pages/HistoryPage'

export default function App() {
  return (
    <PlaybackProvider>
    <QueueProvider>
    <PlayerProvider>
      <FavoritesProvider>
        <DownloadsProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/show/:slug" element={<ShowDetailPage />} />
                <Route path="/downloads" element={<DownloadsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </DownloadsProvider>
      </FavoritesProvider>
    </PlayerProvider>
    </QueueProvider>
    </PlaybackProvider>
  )
}
