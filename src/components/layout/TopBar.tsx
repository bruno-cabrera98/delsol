import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function TopBar() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      const prompt = e as BeforeInstallPromptEvent
      setInstallPrompt(prompt)
      window.__delsol_installPrompt = prompt
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      window.__delsol_installPrompt = undefined
    }
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">DS</span>
          </div>
          <span className="font-bold text-foreground text-base tracking-tight">
            Del Sol <span className="text-primary">99.5</span>
          </span>
        </div>
      </div>

      {installPrompt && !installed && (
        <Button size="sm" variant="outline" onClick={handleInstall} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Instalar
        </Button>
      )}
    </header>
  )
}
