import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { SchemaCrearPago } from '@/lib/validaciones/schemas'
import { logger } from '@/lib/utils/logger'
import { PRECIO_POR_TRAMITE_CENTAVOS, PRECIO_ANUAL_CENTAVOS } from '@/constants/planes'

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verificar sesión
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Validar body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const validado = SchemaCrearPago.safeParse(body)
  if (!validado.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detalles: validado.error.flatten() },
      { status: 400 }
    )
  }

  const { tipoPlan, tramiteSlug } = validado.data
  const esPorTramite = tipoPlan === 'por_tramite'

  // 3. Verificar que el usuario no tenga ya acceso (evitar cobro duplicado)
  if (esPorTramite && tramiteSlug) {
    const { data: tramite } = await supabase
      .from('tramites')
      .select('id')
      .eq('slug', tramiteSlug)
      .single()

    if (tramite) {
      const { data: desbloqueado } = await supabase
        .from('tramites_desbloqueados')
        .select('id')
        .eq('user_id', user.id)
        .eq('tramite_id', tramite.id)
        .single()

      if (desbloqueado) {
        return NextResponse.json({ error: 'Ya tienes acceso a este trámite' }, { status: 409 })
      }
    }
  }

  try {
    const montoCentavos = esPorTramite ? PRECIO_POR_TRAMITE_CENTAVOS : PRECIO_ANUAL_CENTAVOS
    const externalRef = `${user.id}-${Date.now()}`

    // 4. Crear registro de pago en DB (estado pendiente)
    const serviceSupabase = createServiceRoleClient()
    const { data: tramiteDb } = tramiteSlug
      ? await serviceSupabase.from('tramites').select('id').eq('slug', tramiteSlug).single()
      : { data: null }

    const { data: pago, error: errorPago } = await serviceSupabase
      .from('pagos')
      .insert({
        user_id: user.id,
        tramite_id: tramiteDb?.id ?? null,
        tramite_slug: tramiteSlug ?? null,
        tipo: tipoPlan,
        monto_centavos: montoCentavos,
        estado: 'pendiente',
        mp_external_ref: externalRef,
        metadata: {},
      })
      .select('id')
      .single()

    if (errorPago || !pago) {
      throw new Error('No se pudo crear el registro de pago')
    }

    // 5. Crear preferencia en MercadoPago
    const titulo = esPorTramite
      ? `TrámiteSAT — ${tramiteSlug ?? 'Trámite'}`
      : 'TrámiteSAT — Suscripción Anual'

    const respuestaMp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ title: titulo, quantity: 1, unit_price: montoCentavos / 100 }],
        external_reference: externalRef,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/tramite/${tramiteSlug ?? ''}/documentos?pago=exitoso`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/tramite/${tramiteSlug ?? ''}/documentos?pago=fallido`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/tramite/${tramiteSlug ?? ''}/documentos?pago=pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagos/webhook`,
      }),
    })

    const preferencia = await respuestaMp.json() as { id: string; init_point: string }

    // Guardar el preference_id en la DB
    await serviceSupabase
      .from('pagos')
      .update({ mp_preference_id: preferencia.id })
      .eq('id', pago.id)

    logger.info('preferencia_pago_creada', { pagoId: pago.id, userId: user.id })

    return NextResponse.json({
      preferenceId: preferencia.id,
      initPoint: preferencia.init_point,
    }, { status: 200 })
  } catch (error) {
    logger.error('crear_pago_fallo', { error, userId: user.id })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
