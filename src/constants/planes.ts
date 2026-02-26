export const PLANES = {
  porTramite: {
    id: 'por_tramite' as const,
    nombre: 'Solo este trámite',
    precio: 59,
    precioTexto: '$59 MXN',
    descripcion: 'Acceso permanente a la guía de este trámite.',
  },
  anual: {
    id: 'suscripcion_anual' as const,
    nombre: 'Acceso anual completo',
    precio: 349,
    precioTexto: '$349 MXN/año',
    descripcion: 'Acceso a todos los trámites durante un año. Mejor valor.',
    destacado: true,
  },
} as const

export const PRECIO_POR_TRAMITE_CENTAVOS = PLANES.porTramite.precio * 100
export const PRECIO_ANUAL_CENTAVOS = PLANES.anual.precio * 100
