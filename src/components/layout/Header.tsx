'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface HeaderProps {
  titulo?: string
  mostrarRegresar?: boolean
  onRegresar?: () => void
}

export function Header({ titulo, mostrarRegresar = false, onRegresar }: HeaderProps) {
  return (
    <header className="h-header bg-marca-profundo text-white flex items-center px-4 gap-3 shrink-0">
      {mostrarRegresar && (
        <button
          onClick={onRegresar}
          aria-label="Regresar"
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}

      {titulo ? (
        <h1 className="font-semibold text-base truncate flex-1">{titulo}</h1>
      ) : (
        <Link
          href="/"
          className="font-bold text-lg tracking-tight flex-1"
          aria-label="TrámiteSAT — Inicio"
        >
          TrámiteSAT
        </Link>
      )}
    </header>
  )
}
