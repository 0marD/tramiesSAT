interface EstadoCargandoProps {
  mensaje?: string
}

export function EstadoCargando({ mensaje = 'Cargando...' }: EstadoCargandoProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4" role="status" aria-live="polite">
      <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-marca-accion rounded-full animate-spin" aria-hidden="true" />
      <p className="text-slate-500 dark:text-slate-400 text-sm">{mensaje}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4 rounded-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  )
}
