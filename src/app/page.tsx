import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { TramiteCard } from '@/components/tramite/TramiteCard'
import { TRAMITES_DISPONIBLES } from '@/constants/tramites'

export default function PaginaHome() {
  const tramitesOrdenados = [...TRAMITES_DISPONIBLES].sort(
    (a, b) => a.ordenDisplay - b.ordenDisplay
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Trámites del SAT</h1>
          <p className="text-slate-500 mt-1">Elige el trámite que quieres hacer</p>
        </div>

        <ul className="space-y-3" aria-label="Lista de trámites disponibles">
          {tramitesOrdenados.map(tramite => (
            <li key={tramite.slug}>
              <TramiteCard tramite={tramite} />
            </li>
          ))}
        </ul>
      </PageContainer>
    </div>
  )
}
