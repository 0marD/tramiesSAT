// Este archivo se regenera con: npm run db:generate-types
// Estructura base manual hasta tener el proyecto de Supabase configurado.
// Incluye Relationships:[] (requerido por @supabase/postgrest-js v2.98+)

type TipoContribuyenteDb = 'asalariado' | 'freelancer' | 'negocio_propio' | 'nuevo_contribuyente'
type PlanUsuarioDb = 'gratuito' | 'pago_por_tramite' | 'anual'
type EstadoPagoDb = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'en_proceso'
type TipoPagoDb = 'por_tramite' | 'suscripcion_anual'
type TipoRecordatorioDb = 'declaracion_anual_abril' | 'iva_mensual' | 'isr_mensual' | 'declaracion_bimestral_resico' | 'renovacion_suscripcion'

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          nombre: string | null
          tipo_contribuyente: TipoContribuyenteDb | null
          plan: PlanUsuarioDb
          plan_vence_en: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          nombre?: string | null
          tipo_contribuyente?: TipoContribuyenteDb | null
          plan?: PlanUsuarioDb
          plan_vence_en?: string | null
          deleted_at?: string | null
        }
        Update: {
          nombre?: string | null
          tipo_contribuyente?: TipoContribuyenteDb | null
          plan?: PlanUsuarioDb
          plan_vence_en?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tramites: {
        Row: {
          id: string
          slug: string
          nombre: string
          descripcion: string
          descripcion_seo: string
          categoria: string
          duracion_minutos: number
          requiere_pago: boolean
          activo: boolean
          version_contenido: string
          ultima_actualizacion: string
          orden_display: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          nombre: string
          descripcion: string
          descripcion_seo: string
          categoria: string
          duracion_minutos?: number
          requiere_pago?: boolean
          activo?: boolean
          version_contenido: string
          ultima_actualizacion: string
          orden_display?: number
        }
        Update: {
          slug?: string
          nombre?: string
          descripcion?: string
          descripcion_seo?: string
          categoria?: string
          duracion_minutos?: number
          requiere_pago?: boolean
          activo?: boolean
          version_contenido?: string
          ultima_actualizacion?: string
          orden_display?: number
        }
        Relationships: []
      }
      user_progreso: {
        Row: {
          id: string
          user_id: string
          tramite_id: string
          tramite_slug: string
          paso_actual: number
          total_pasos: number
          completado: boolean
          completado_en: string | null
          respuestas_diagnostico: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tramite_id: string
          tramite_slug: string
          paso_actual: number
          total_pasos: number
          completado?: boolean
          completado_en?: string | null
          respuestas_diagnostico?: Record<string, unknown>
          updated_at?: string
        }
        Update: {
          paso_actual?: number
          total_pasos?: number
          completado?: boolean
          completado_en?: string | null
          respuestas_diagnostico?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          id: string
          user_id: string
          tramite_id: string | null
          tramite_slug: string | null
          tipo: TipoPagoDb
          monto_centavos: number
          estado: EstadoPagoDb
          mp_preference_id: string | null
          mp_payment_id: string | null
          mp_external_ref: string | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tramite_id?: string | null
          tramite_slug?: string | null
          tipo: TipoPagoDb
          monto_centavos: number
          estado?: EstadoPagoDb
          mp_preference_id?: string | null
          mp_payment_id?: string | null
          mp_external_ref?: string | null
          metadata?: Record<string, unknown>
        }
        Update: {
          estado?: EstadoPagoDb
          mp_preference_id?: string | null
          mp_payment_id?: string | null
          mp_external_ref?: string | null
          metadata?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: []
      }
      tramites_desbloqueados: {
        Row: {
          id: string
          user_id: string
          tramite_id: string
          pago_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tramite_id: string
          pago_id: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      recordatorios: {
        Row: {
          id: string
          user_id: string
          tipo: TipoRecordatorioDb
          fecha_vencimiento: string
          notificado_30: boolean
          notificado_7: boolean
          notificado_1: boolean
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: TipoRecordatorioDb
          fecha_vencimiento: string
          notificado_30?: boolean
          notificado_7?: boolean
          notificado_1?: boolean
          activo?: boolean
        }
        Update: {
          notificado_30?: boolean
          notificado_7?: boolean
          notificado_1?: boolean
          activo?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          activa?: boolean
        }
        Update: {
          activa?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
