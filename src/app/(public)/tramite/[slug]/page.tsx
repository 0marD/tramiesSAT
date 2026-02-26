import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Clock, FileText, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { TRAMITES_DISPONIBLES } from '@/constants/tramites'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return TRAMITES_DISPONIBLES.map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tramite = TRAMITES_DISPONIBLES.find(t => t.slug === params.slug)
  if (!tramite) return {}

  return {
    title: `${tramite.nombre} paso a paso`,
    description: tramite.descripcion,
  }
}

export default function PaginaLandingTramite({ params }: Props) {
  const tramite = TRAMITES_DISPONIBLES.find(t => t.slug === params.slug)

  if (!tramite) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header titulo={tramite.nombre} mostrarRegresar />
      <PageContainer>
        <div className="space-y-6">
          {/* Hero del trámite */}
          <div className="bg-marca-suave rounded-card p-6 text-center">
            <div className="text-4xl font-bold text-marca-accion mb-2">
              {tramite.nombre.charAt(0)}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">{tramite.nombre}</h1>
            <p className="text-slate-600 text-sm">{tramite.descripcion}</p>
          </div>

          {/* Información clave */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-card border border-slate-200 p-4 flex items-center gap-3">
              <Clock size={20} className="text-marca-accion" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500">Tiempo estimado</p>
                <p className="font-semibold text-slate-900">{tramite.duracionMinutos} minutos</p>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-card border border-slate-200 p-4 flex items-center gap-3">
              <FileText size={20} className="text-marca-accion" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500">Costo</p>
                <p className="font-semibold text-slate-900">
                  {tramite.requierePago ? '$59 MXN' : 'Gratis'}
                </p>
              </div>
            </div>
          </div>

          {/* Qué necesitas */}
          <div className="bg-white rounded-card border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900 mb-2">¿Qué vas a necesitar?</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Te diremos exactamente qué documentos preparar antes de empezar. El proceso
              es 100% en línea desde el portal del SAT.
            </p>
          </div>

          {/* CTA */}
          <Link
            href={`/tramite/${tramite.slug}/diagnostico`}
            className="
              flex items-center justify-center gap-2
              w-full py-4 rounded-btn
              bg-marca-accion text-white font-semibold text-base
              hover:bg-blue-700 active:scale-[0.98]
              motion-safe:transition-all duration-150
              focus-visible:outline-2 focus-visible:outline-marca-accion focus-visible:outline-offset-2
            "
          >
            Empezar ahora
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </PageContainer>
    </div>
  )
}
