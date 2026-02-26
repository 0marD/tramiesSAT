import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { DiagnosticoForm } from '@/components/tramite/DiagnosticoForm'
import { TRAMITES_DISPONIBLES } from '@/constants/tramites'
import type { PreguntaDiagnostico } from '@/types/tramite'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tramite = TRAMITES_DISPONIBLES.find(t => t.slug === params.slug)
  return { title: `Diagnóstico — ${tramite?.nombre ?? 'Trámite'}` }
}

async function obtenerPreguntas(slug: string): Promise<PreguntaDiagnostico[]> {
  try {
    const datos = await import(`@/content/tramites/${slug}/diagnostico.json`)
    return datos.default as PreguntaDiagnostico[]
  } catch {
    return []
  }
}

export default async function PaginaDiagnostico({ params }: Props) {
  const tramite = TRAMITES_DISPONIBLES.find(t => t.slug === params.slug)

  if (!tramite) {
    notFound()
  }

  const preguntas = await obtenerPreguntas(params.slug)

  return (
    <div className="flex flex-col min-h-screen">
      <Header titulo="Un par de preguntas" mostrarRegresar />
      <PageContainer>
        <div className="mb-6">
          <p className="text-slate-500 text-sm">
            Esto nos ayuda a mostrarte exactamente los pasos que necesitas.
          </p>
        </div>

        <DiagnosticoForm preguntas={preguntas} tramiteSlug={params.slug} />
      </PageContainer>
    </div>
  )
}
