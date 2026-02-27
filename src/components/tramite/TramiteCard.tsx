import Link from 'next/link'
import { ChevronRight, Lock } from 'lucide-react'
import type { MetaTramiteConstante } from '@/constants/tramites'

interface TramiteCardProps {
  tramite: MetaTramiteConstante
  animationDelay?: number
}

export function TramiteCard({ tramite, animationDelay = 0 }: TramiteCardProps) {
  return (
    <Link
      href={`/tramite/${tramite.slug}`}
      style={{ animationDelay: `${animationDelay}ms` }}
      className="
        flex items-center gap-4
        p-4 rounded-card
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-700
        hover:border-marca-accion hover:shadow-sm
        active:scale-[0.98]
        motion-safe:transition-all duration-150
        motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2
        animation-fill-both
        min-h-[72px]
        focus-visible:outline-2 focus-visible:outline-marca-accion focus-visible:outline-offset-2
      "
    >
      <div className="
        flex items-center justify-center
        w-12 h-12 rounded-xl
        bg-marca-suave dark:bg-blue-900/30 text-marca-accion
        shrink-0
        text-lg font-bold
      ">
        {tramite.nombre.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-base">{tramite.nombre}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{tramite.descripcion}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-slate-400 dark:text-slate-500">{tramite.duracionMinutos} min</span>
        {tramite.requierePago ? (
          <Lock size={14} className="text-slate-300 dark:text-slate-600" aria-label="Requiere pago" />
        ) : (
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" aria-hidden="true" />
        )}
      </div>
    </Link>
  )
}
