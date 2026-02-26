'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BotonPrincipal } from '@/components/shared/BotonPrincipal'
import { TEXTOS } from '@/constants/textos'
import type { PreguntaDiagnostico } from '@/types/tramite'

interface DiagnosticoFormProps {
  preguntas: PreguntaDiagnostico[]
  tramiteSlug: string
}

export function DiagnosticoForm({ preguntas, tramiteSlug }: DiagnosticoFormProps) {
  const router = useRouter()
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})

  const todasRespondidas = preguntas.every(p => respuestas[p.id] !== undefined)

  const seleccionarOpcion = (preguntaId: string, opcionId: string) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: opcionId }))
  }

  const continuar = () => {
    // Guardar respuestas en sessionStorage para usuarios sin sesión
    sessionStorage.setItem(
      `diagnostico-${tramiteSlug}`,
      JSON.stringify(respuestas)
    )
    router.push(`/tramite/${tramiteSlug}/documentos`)
  }

  return (
    <div className="pb-24 space-y-8">
      {preguntas.map(pregunta => (
        <fieldset key={pregunta.id} className="space-y-3">
          <legend className="text-base font-semibold text-slate-900 mb-3">
            {pregunta.texto}
          </legend>
          <div className="space-y-2">
            {pregunta.opciones.map(opcion => {
              const seleccionada = respuestas[pregunta.id] === opcion.id
              return (
                <button
                  key={opcion.id}
                  role="radio"
                  aria-checked={seleccionada}
                  onClick={() => seleccionarOpcion(pregunta.id, opcion.id)}
                  className={`
                    w-full p-4 rounded-card border text-left font-medium text-base
                    min-h-[52px] motion-safe:transition-all duration-150
                    focus-visible:outline-2 focus-visible:outline-marca-accion focus-visible:outline-offset-2
                    ${seleccionada
                      ? 'border-marca-accion bg-marca-suave text-marca-accion'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                    }
                  `}
                >
                  {opcion.texto}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <BotonPrincipal
        texto={TEXTOS.botones.continuar}
        onClick={continuar}
        deshabilitado={!todasRespondidas}
      />
    </div>
  )
}
