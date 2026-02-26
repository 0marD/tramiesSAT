'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Bell, User } from 'lucide-react'

const ITEMS = [
  { href: '/',            icono: Home,  etiqueta: 'Inicio'      },
  { href: '/historial',   icono: Clock, etiqueta: 'Historial'   },
  { href: '/vencimientos',icono: Bell,  etiqueta: 'Vencimientos'},
  { href: '/cuenta',      icono: User,  etiqueta: 'Mi cuenta'   },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="h-bottomnav bg-white border-t border-slate-100 flex items-center shrink-0"
      aria-label="Navegación principal"
    >
      {ITEMS.map(({ href, icono: Icono, etiqueta }) => {
        const activo = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`
              flex-1 flex flex-col items-center justify-center gap-1 py-2
              min-h-[44px] transition-colors
              ${activo ? 'text-marca-accion' : 'text-slate-400 hover:text-slate-600'}
            `}
            aria-current={activo ? 'page' : undefined}
          >
            <Icono size={22} aria-hidden="true" />
            <span className="text-xs font-medium">{etiqueta}</span>
          </Link>
        )
      })}
    </nav>
  )
}
