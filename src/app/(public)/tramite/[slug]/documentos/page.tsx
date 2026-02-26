'use client'

import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { ChecklistDocumentos } from '@/components/tramite/ChecklistDocumentos'
import { EstadoCargando } from '@/components/shared/EstadoCargando'
import type { Documento } from '@/types/tramite'

// Los documentos del RFC se cargan estáticamente
import documentosRfc from '@/content/tramites/rfc-persona-fisica/documentos.json'

const DOCUMENTOS_POR_SLUG: Record<string, Documento[]> = {
  'rfc-persona-fisica': documentosRfc as Documento[],
}

interface Props {
  params: { slug: string }
}

export default function PaginaDocumentos({ params }: Props) {
  const router = useRouter()
  const documentos = DOCUMENTOS_POR_SLUG[params.slug] ?? []

  const continuar = () => {
    router.push(`/tramite/${params.slug}/guia/1`)
  }

  if (!documentos.length) {
    return <EstadoCargando />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header titulo="Prepara tus documentos" mostrarRegresar />
      <PageContainer>
        <div className="mb-6">
          <p className="text-slate-500 text-sm">
            Marca cada documento cuando lo tengas listo. Solo así podrás continuar.
          </p>
        </div>

        <ChecklistDocumentos documentos={documentos} onTodosListos={continuar} />
      </PageContainer>
    </div>
  )
}
