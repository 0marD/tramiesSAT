'use client'

import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BarraProgreso } from '@/components/tramite/BarraProgreso'
import { PasoGuia } from '@/components/tramite/PasoGuia'
import { EstadoCargando } from '@/components/shared/EstadoCargando'
import { usePaso } from '@/hooks/usePaso'

interface Props {
  params: { slug: string; paso: string }
}

export default function PaginaPasoGuia({ params }: Props) {
  const numeroPaso = parseInt(params.paso, 10)

  if (isNaN(numeroPaso) || numeroPaso < 1) {
    notFound()
  }

  const { estado, paso, totalPasos, avanzar, retroceder } = usePaso(params.slug, numeroPaso)

  if (estado === 'cargando' || !paso) {
    return <EstadoCargando />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        titulo={`Paso ${numeroPaso} de ${totalPasos}`}
        mostrarRegresar={numeroPaso > 1}
        onRegresar={retroceder}
      />
      <BarraProgreso pasoActual={numeroPaso} totalPasos={totalPasos} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 max-w-lg mx-auto w-full">
        <PasoGuia
          paso={paso}
          onAvanzar={avanzar}
          cargando={estado === 'completando'}
        />
      </div>
    </div>
  )
}
