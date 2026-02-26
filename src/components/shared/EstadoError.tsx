'use client'

import { AlertCircle } from 'lucide-react'

interface EstadoErrorProps {
  mensaje?: string
  onReintentar?: () => void
}

export function EstadoError({
  mensaje = 'Algo salió mal. Intenta de nuevo.',
  onReintentar,
}: EstadoErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
      <AlertCircle size={48} className="text-error" aria-hidden="true" />
      <p className="text-slate-700 text-base">{mensaje}</p>
      {onReintentar && (
        <button
          onClick={onReintentar}
          className="px-6 py-3 rounded-btn border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  )
}
