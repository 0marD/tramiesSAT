export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'en_proceso'

export type TipoPago = 'por_tramite' | 'suscripcion_anual'

export interface Pago {
  id: string
  userId: string
  tramiteId: string | null
  tramiteSlug: string | null
  tipo: TipoPago
  montoCentavos: number
  estado: EstadoPago
  mpPreferenceId: string | null
  mpPaymentId: string | null
  createdAt: string
}
