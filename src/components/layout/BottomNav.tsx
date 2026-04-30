import { NavLink } from 'react-router-dom'
import { Home, Download, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Inicio', Icon: Home },
  { to: '/downloads', label: 'Descargas', Icon: Download },
  { to: '/settings', label: 'Ajustes', Icon: Settings },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 h-14 flex items-stretch bg-background/95 backdrop-blur border-t border-border pb-safe">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
