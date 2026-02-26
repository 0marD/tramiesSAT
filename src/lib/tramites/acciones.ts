'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SchemaGuardarProgreso } from '@/lib/validaciones/schemas'
import { logger } from '@/lib/utils/logger'
import type { Result } from '@/types/comun'

/**
 * Guarda el progreso del usuario en un trámite.
 * Valida sesión y datos en el servidor. Nunca confía en el cliente.
 */
export async function guardarProgreso(
  input: z.infer<typeof SchemaGuardarProgreso>
): Promise<Result<void>> {
  const validado = SchemaGuardarProgreso.safeParse(input)
  if (!validado.success) {
    return { exito: false, error: 'Datos inválidos' }
  }

  const supabase = await createServerSupabaseClient()

  // getUser() valida el token con Supabase — no solo lee la cookie
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { exito: false, error: 'Sesión expirada' }
  }

  // Obtener el tramite_id desde el slug
  const { data: tramite } = await supabase
    .from('tramites')
    .select('id')
    .eq('slug', validado.data.tramiteSlug)
    .single()

  if (!tramite) {
    return { exito: false, error: 'Trámite no encontrado' }
  }

  const { error } = await supabase
    .from('user_progreso')
    .upsert({
      user_id: user.id,
      tramite_id: tramite.id,
      tramite_slug: validado.data.tramiteSlug,
      paso_actual: validado.data.pasoActual,
      total_pasos: 6, // TODO: obtener dinámicamente según el trámite
      respuestas_diagnostico: (validado.data.respuestas ?? {}) as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,tramite_id',
    })

  if (error) {
    logger.error('guardar_progreso_fallo', { error, userId: user.id })
    return { exito: false, error: 'No pudimos guardar tu progreso' }
  }

  revalidatePath('/historial')
  return { exito: true, datos: undefined }
}

/**
 * Marca un trámite como completado.
 */
export async function marcarTramiteCompletado(
  tramiteSlug: string
): Promise<Result<void>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { exito: false, error: 'Sesión expirada' }
  }

  const { data: tramite } = await supabase
    .from('tramites')
    .select('id')
    .eq('slug', tramiteSlug)
    .single()

  if (!tramite) {
    return { exito: false, error: 'Trámite no encontrado' }
  }

  const { error } = await supabase
    .from('user_progreso')
    .update({
      completado: true,
      completado_en: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('tramite_id', tramite.id)

  if (error) {
    logger.error('completar_tramite_fallo', { error, userId: user.id, tramiteSlug })
    return { exito: false, error: 'No pudimos registrar que completaste el trámite' }
  }

  revalidatePath('/historial')
  return { exito: true, datos: undefined }
}
