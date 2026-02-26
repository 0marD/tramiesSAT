export type CategoriaTramite = 'identidad' | 'declaracion' | 'facturacion'

export interface Tramite {
  id: string
  slug: string
  nombre: string
  descripcion: string
  descripcionSeo: string
  categoria: CategoriaTramite
  duracionMinutos: number
  requierePago: boolean
  activo: boolean
  versionContenido: string
  ultimaActualizacion: string
  ordenDisplay: number
}

export interface Paso {
  numero: number
  titulo: string
  instruccion: string
  imagenUrl: string
  imagenAlt: string
  ayuda?: string
  advertencia?: string
}

export interface Documento {
  id: string
  nombre: string
  descripcion?: string
  obligatorio: boolean
  urlRecurso?: string
}

export interface OpcionDiagnostico {
  id: string
  texto: string
  omitirPasos?: number[]
}

export interface PreguntaDiagnostico {
  id: string
  texto: string
  tipo: 'radio' | 'checkbox'
  opciones: OpcionDiagnostico[]
}

export interface ContenidoTramite {
  meta: Tramite
  diagnostico: PreguntaDiagnostico[]
  documentos: Documento[]
  pasos: Paso[]
}
