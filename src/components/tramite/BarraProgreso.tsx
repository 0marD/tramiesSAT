interface BarraProgresoProps {
  pasoActual: number
  totalPasos: number
}

export function BarraProgreso({ pasoActual, totalPasos }: BarraProgresoProps) {
  const porcentaje = Math.round((pasoActual / totalPasos) * 100)

  return (
    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
        Paso <span className="font-semibold text-slate-900 dark:text-white">{pasoActual}</span> de {totalPasos}
      </p>
      <div
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso: ${porcentaje}%`}
        className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-marca-accion rounded-full motion-safe:transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
