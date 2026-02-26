import { FileText } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { EstadoVacio } from '@/components/shared/EstadoVacio'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = { title: 'Mi historial' }

export default async function PaginaHistorial() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: progresos } = await supabase
    .from('user_progreso')
    .select('tramite_slug, paso_actual, total_pasos, completado, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const hayProgresos = progresos && progresos.length > 0

  return (
    <div className="flex flex-col flex-1">
      <Header titulo="Mi historial" />
      <PageContainer>
        {!hayProgresos ? (
          <EstadoVacio
            icono={<FileText size={48} />}
            titulo="Aún no tienes trámites"
            descripcion="Empieza con el RFC. Es el primer paso para cualquier trámite del SAT."
            accion={{ texto: 'Empezar con RFC', href: '/tramite/rfc-persona-fisica' }}
          />
        ) : (
          <ul className="space-y-3" aria-label="Historial de trámites">
            {progresos.map(progreso => (
              <li
                key={progreso.tramite_slug}
                className="bg-white rounded-card border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-900 capitalize">
                    {progreso.tramite_slug.replace(/-/g, ' ')}
                  </p>
                  {progreso.completado ? (
                    <span className="text-xs text-exito bg-exito-suave px-2 py-1 rounded-full font-medium">
                      Completado
                    </span>
                  ) : (
                    <span className="text-xs text-alerta bg-alerta-suave px-2 py-1 rounded-full font-medium">
                      En progreso
                    </span>
                  )}
                </div>
                {!progreso.completado && (
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-marca-accion rounded-full"
                      style={{ width: `${Math.round((progreso.paso_actual / progreso.total_pasos) * 100)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </div>
  )
}
