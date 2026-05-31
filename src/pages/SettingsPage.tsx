import { Volume2, ExternalLink, Download } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __delsol_installPrompt?: BeforeInstallPromptEvent
  }
}

export function SettingsPage() {
  const { state, setVolume } = usePlayer()
  const [cacheCleared, setCacheCleared] = useState(false)

  async function handleClearCache() {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith('delsol-')).map((k) => caches.delete(k)))
      setCacheCleared(true)
      setTimeout(() => setCacheCleared(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Reproducción
        </h2>
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">Volumen</p>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[state.volume]}
                onValueChange={([v]) => setVolume(v)}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
              {Math.round(state.volume * 100)}%
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Aplicación
        </h2>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Instalar como app</p>
              <p className="text-xs text-muted-foreground mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 flex-shrink-0"
              onClick={async () => {
                const p = window.__delsol_installPrompt
                if (!p) return
                await p.prompt()
                const { outcome } = await p.userChoice
                if (outcome === 'accepted') window.__delsol_installPrompt = undefined
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Instalar
            </Button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Limpiar caché</p>
              <p className="text-xs text-muted-foreground mt-0.5">Elimina datos descargados temporalmente</p>
            </div>
            <Button
              size="sm"
              variant={cacheCleared ? 'secondary' : 'outline'}
              onClick={handleClearCache}
            >
              {cacheCleared ? '¡Listo!' : 'Limpiar'}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Acerca de
        </h2>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">DS</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Del Sol 99.5 FM</p>
              <p className="text-xs text-muted-foreground">Montevideo, Uruguay</p>
            </div>
          </div>
          <a
            href="https://delsol.uy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            delsol.uy
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">Versión</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {__APP_VERSION__} · {__BUILD_DATE__}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
