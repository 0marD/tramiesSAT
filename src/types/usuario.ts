export type TipoContribuyente =
  | 'asalariado'
  | 'freelancer'
  | 'negocio_propio'
  | 'nuevo_contribuyente'

export type PlanUsuario = 'gratuito' | 'pago_por_tramite' | 'anual'

export interface PerfilUsuario {
  id: string
  nombre: string | null
  tipoContribuyente: TipoContribuyente | null
  plan: PlanUsuario
  planVenceEn: Date | null
}

export interface ProgresoTramite {
  tramiteSlug: string
  tramiteNombre: string
  pasoActual: number
  totalPasos: number
  completado: boolean
  completadoEn: Date | null
  updatedAt: Date
}
