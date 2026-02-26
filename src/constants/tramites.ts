import type { CategoriaTramite } from '@/types/tramite'

export interface MetaTramiteConstante {
  slug: string
  nombre: string
  descripcion: string
  categoria: CategoriaTramite
  duracionMinutos: number
  requierePago: boolean
  ordenDisplay: number
}

export const TRAMITES_DISPONIBLES: MetaTramiteConstante[] = [
  {
    slug: 'rfc-persona-fisica',
    nombre: 'RFC',
    descripcion: 'Obtén tu Registro Federal de Contribuyentes',
    categoria: 'identidad',
    duracionMinutos: 10,
    requierePago: false,
    ordenDisplay: 1,
  },
  {
    slug: 'contrasena-sat',
    nombre: 'Contraseña SAT',
    descripcion: 'Crea o recupera tu contraseña del SAT',
    categoria: 'identidad',
    duracionMinutos: 8,
    requierePago: false,
    ordenDisplay: 2,
  },
  {
    slug: 'efirma',
    nombre: 'e.firma',
    descripcion: 'Tramita tu firma electrónica avanzada',
    categoria: 'identidad',
    duracionMinutos: 60,
    requierePago: true,
    ordenDisplay: 3,
  },
  {
    slug: 'declaracion-anual',
    nombre: 'Declaración Anual',
    descripcion: 'Presenta tu declaración anual como persona física asalariada',
    categoria: 'declaracion',
    duracionMinutos: 20,
    requierePago: true,
    ordenDisplay: 4,
  },
  {
    slug: 'cfdi-40',
    nombre: 'Factura (CFDI 4.0)',
    descripcion: 'Emite tu primera factura electrónica',
    categoria: 'facturacion',
    duracionMinutos: 15,
    requierePago: true,
    ordenDisplay: 5,
  },
]

export const TRAMITE_SLUGS = TRAMITES_DISPONIBLES.map(t => t.slug)
