'use client'

import { Loader2 } from 'lucide-react'

interface BotonPrincipalProps {
  texto: string
  onClick?: () => void
  cargando?: boolean
  deshabilitado?: boolean
  tipo?: 'button' | 'submit'
}

export function BotonPrincipal({
  texto,
  onClick,
  cargando = false,
  deshabilitado = false,
  tipo = 'button',
}: BotonPrincipalProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <button
        type={tipo}
        onClick={onClick}
        disabled={deshabilitado || cargando}
        aria-busy={cargando}
        className="
          w-full h-14 rounded-btn
          bg-marca-accion text-white
          font-semibold text-base
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-blue-700
          active:scale-[0.98]
          motion-safe:transition-all duration-150
          focus-visible:outline-2 focus-visible:outline-marca-accion focus-visible:outline-offset-2
          max-w-lg mx-auto
        "
      >
        {cargando ? (
          <>
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            <span>Guardando...</span>
          </>
        ) : (
          texto
        )}
      </button>
    </div>
  )
}
