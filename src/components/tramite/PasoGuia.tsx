'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, HelpCircle, X } from 'lucide-react'
import { BotonPrincipal } from '@/components/shared/BotonPrincipal'
import { TEXTOS } from '@/constants/textos'
import type { Paso } from '@/types/tramite'

interface PasoGuiaProps {
  paso: Paso
  onAvanzar: () => void
  cargando?: boolean
}

export function PasoGuia({ paso, onAvanzar, cargando = false }: PasoGuiaProps) {
  const [mostrarAyuda, setMostrarAyuda] = useState(false)

  return (
    <div className="pb-28">
      {/* Instrucción principal */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{paso.titulo}</h2>
        <p className="text-base text-slate-700 leading-relaxed">{paso.instruccion}</p>
      </div>

      {/* Advertencia */}
      {paso.advertencia && (
        <div className="flex gap-3 p-4 bg-alerta-suave border border-alerta/20 rounded-card mb-4">
          <AlertTriangle size={20} className="text-alerta shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-slate-700">{paso.advertencia}</p>
        </div>
      )}

      {/* Imagen del portal del SAT */}
      <div className="relative w-full aspect-[9/16] max-h-96 rounded-card overflow-hidden bg-slate-100 mb-4">
        <Image
          src={paso.imagenUrl}
          alt={paso.imagenAlt}
          fill
          className="object-contain"
          priority
          onError={() => {/* placeholder hasta tener las capturas reales */}}
        />
        {/* Placeholder mientras no hay imagen */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
          Captura del SAT — Paso {paso.numero}
        </div>
      </div>

      {/* Botón de ayuda contextual */}
      {paso.ayuda && (
        <>
          <button
            onClick={() => setMostrarAyuda(true)}
            className="
              w-full flex items-center gap-2 p-4 rounded-card
              border border-dashed border-slate-300
              text-slate-500 text-sm hover:border-marca-accion hover:text-marca-accion
              motion-safe:transition-colors duration-150
              focus-visible:outline-2 focus-visible:outline-marca-accion focus-visible:outline-offset-2
            "
            aria-expanded={mostrarAyuda}
          >
            <HelpCircle size={18} aria-hidden="true" />
            ¿Algo no coincide con lo que ves?
          </button>

          {/* Panel de ayuda */}
          {mostrarAyuda && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ayuda-titulo"
              className="fixed inset-0 z-50 flex flex-col justify-end"
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMostrarAyuda(false)}
                aria-hidden="true"
              />
              <div className="relative bg-white rounded-t-modal p-6 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="ayuda-titulo" className="font-semibold text-slate-900 text-lg">
                    Ayuda
                  </h3>
                  <button
                    onClick={() => setMostrarAyuda(false)}
                    aria-label="Cerrar ayuda"
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-slate-700 text-base leading-relaxed">{paso.ayuda}</p>
                <button
                  onClick={() => setMostrarAyuda(false)}
                  className="mt-6 w-full py-3 rounded-btn border border-slate-200 text-slate-700 font-medium"
                >
                  Entendí
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BotonPrincipal
        texto={TEXTOS.botones.siguiente}
        onClick={onAvanzar}
        cargando={cargando}
      />
    </div>
  )
}
