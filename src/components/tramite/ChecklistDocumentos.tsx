'use client'

import { useState } from 'react'
import { CheckCircle, Circle, ExternalLink } from 'lucide-react'
import { BotonPrincipal } from '@/components/shared/BotonPrincipal'
import { TEXTOS } from '@/constants/textos'
import type { Documento } from '@/types/tramite'

interface ChecklistDocumentosProps {
  documentos: Documento[]
  onTodosListos: () => void
}

export function ChecklistDocumentos({ documentos, onTodosListos }: ChecklistDocumentosProps) {
  const [marcados, setMarcados] = useState<Set<string>>(new Set())

  const toggleDocumento = (id: string) => {
    setMarcados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) { nuevo.delete(id) } else { nuevo.add(id) }
      return nuevo
    })
  }

  const todosListos = marcados.size === documentos.length

  return (
    <div className="pb-24">
      <ul className="space-y-3" aria-label="Lista de documentos necesarios">
        {documentos.map(doc => {
          const marcado = marcados.has(doc.id)
          return (
            <li key={doc.id}>
              <button
                role="checkbox"
                aria-checked={marcado}
                aria-label={doc.nombre}
                onClick={() => toggleDocumento(doc.id)}
                className={`
                  w-full flex items-start gap-4 p-4 rounded-card border text-left
                  motion-safe:transition-all duration-150
                  focus-visible:outline-2 focus-visible:outline-marca-accion focus-visible:outline-offset-2
                  ${marcado
                    ? 'border-exito bg-exito-suave'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }
                `}
              >
                <div className="mt-0.5 shrink-0">
                  {marcado
                    ? <CheckCircle size={22} className="text-exito" aria-hidden="true" />
                    : <Circle size={22} className="text-slate-300" aria-hidden="true" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-base ${marcado ? 'text-exito' : 'text-slate-900'}`}>
                    {doc.nombre}
                  </p>
                  {doc.descripcion && (
                    <p className="text-sm text-slate-500 mt-0.5">{doc.descripcion}</p>
                  )}
                  {doc.urlRecurso && !marcado && (
                    <a
                      href={doc.urlRecurso}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-marca-accion font-medium hover:underline"
                      aria-label={`Obtener ${doc.nombre} (abre en nueva pestaña)`}
                    >
                      Obtenerla aquí
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <BotonPrincipal
        texto={TEXTOS.botones.tengoTodo}
        onClick={onTodosListos}
        deshabilitado={!todosListos}
      />
    </div>
  )
}
