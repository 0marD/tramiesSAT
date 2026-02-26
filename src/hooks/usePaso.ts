'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Paso } from '@/types/tramite'
import { logger } from '@/lib/utils/logger'

type EstadoPaso = 'cargando' | 'listo' | 'completando' | 'completado' | 'error'

interface EstadoHook {
  estado: EstadoPaso
  paso: Paso | null
  totalPasos: number
  avanzar: () => Promise<void>
  retroceder: () => void
}

// Mapa estático de pasos por trámite
// Cuando escale, se puede hacer dinámico con import()
const PASOS_POR_TRAMITE: Record<string, () => Promise<Paso[]>> = {
  'rfc-persona-fisica': async () => {
    const modulos = await Promise.all([
      import('@/content/tramites/rfc-persona-fisica/pasos/01-acceder-sat.json'),
      import('@/content/tramites/rfc-persona-fisica/pasos/02-ingresar-curp.json'),
      import('@/content/tramites/rfc-persona-fisica/pasos/03-verificar-datos.json'),
      import('@/content/tramites/rfc-persona-fisica/pasos/04-ingresar-correo.json'),
      import('@/content/tramites/rfc-persona-fisica/pasos/05-confirmar-domicilio.json'),
      import('@/content/tramites/rfc-persona-fisica/pasos/06-descargar-rfc.json'),
    ])
    return modulos.map(m => m.default as Paso)
  },
}

/**
 * Maneja la navegación entre pasos de un trámite.
 * Guarda el progreso en DB si hay sesión, o en sessionStorage si no.
 */
export function usePaso(slug: string, numeroPaso: number): EstadoHook {
  const router = useRouter()
  const [estado, setEstado] = useState<EstadoPaso>('cargando')
  const [paso, setPaso] = useState<Paso | null>(null)
  const [totalPasos, setTotalPasos] = useState(0)

  useEffect(() => {
    const cargarPaso = async () => {
      setEstado('cargando')
      try {
        const cargar = PASOS_POR_TRAMITE[slug]
        if (!cargar) {
          setEstado('error')
          return
        }
        const pasos = await cargar()
        setTotalPasos(pasos.length)

        const pasoActual = pasos[numeroPaso - 1]
        if (!pasoActual) {
          setEstado('error')
          return
        }
        setPaso(pasoActual)
        setEstado('listo')
      } catch (error) {
        logger.error('cargar_paso_fallo', { error, slug, numeroPaso })
        setEstado('error')
      }
    }

    cargarPaso()
  }, [slug, numeroPaso])

  const avanzar = useCallback(async () => {
    setEstado('completando')

    try {
      // Guardar progreso (primero en sessionStorage como fallback inmediato)
      sessionStorage.setItem(`progreso-${slug}`, String(numeroPaso + 1))

      // TODO: guardar en DB cuando haya sesión (ver Server Action guardarProgreso)

      setEstado('completado')

      if (numeroPaso >= totalPasos) {
        router.push(`/tramite/${slug}/exito`)
      } else {
        router.push(`/tramite/${slug}/guia/${numeroPaso + 1}`)
      }
    } catch (error) {
      logger.error('avanzar_paso_fallo', { error, slug, numeroPaso })
      setEstado('error')
    }
  }, [slug, numeroPaso, totalPasos, router])

  const retroceder = useCallback(() => {
    if (numeroPaso > 1) {
      router.push(`/tramite/${slug}/guia/${numeroPaso - 1}`)
    } else {
      router.push(`/tramite/${slug}/documentos`)
    }
  }, [slug, numeroPaso, router])

  return { estado, paso, totalPasos, avanzar, retroceder }
}
