import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verificarFirmaWebhook } from '@/lib/mercadopago/webhook'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text()
  const signature = request.headers.get('x-signature') ?? ''
  const requestId = request.headers.get('x-request-id') ?? ''
  const secret = process.env.WEBHOOK_SECRET_MERCADOPAGO

  if (!secret) {
    logger.error('webhook_secret_faltante', {})
    return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
  }

  // 1. Verificar firma — siempre primero
  const firmaValida = verificarFirmaWebhook({ body, signature, requestId, secret })
  if (!firmaValida) {
    logger.warn('webhook_firma_invalida', { requestId })
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let evento: { type: string; data: { id: string } }
  try {
    evento = JSON.parse(body) as { type: string; data: { id: string } }
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Solo procesar eventos de tipo 'payment'
  if (evento.type !== 'payment') {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const pagoMpId = evento.data.id

  try {
    // 2. Consultar estado real del pago en MercadoPago (no confiar en el webhook)
    const respuestaMp = await fetch(
      `https://api.mercadopago.com/v1/payments/${pagoMpId}`,
      { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
    )

    if (!respuestaMp.ok) {
      throw new Error(`MP API error: ${respuestaMp.status}`)
    }

    const pagoDatos = await respuestaMp.json() as {
      status: string
      external_reference: string
      transaction_amount: number
    }

    const supabase = createServiceRoleClient()

    if (pagoDatos.status === 'approved') {
      // Actualizar pago
      const { data: pago } = await supabase
        .from('pagos')
        .update({ estado: 'aprobado', mp_payment_id: pagoMpId })
        .eq('mp_external_ref', pagoDatos.external_reference)
        .select('id, user_id, tramite_id, tipo')
        .single()

      if (pago) {
        if (pago.tipo === 'por_tramite' && pago.tramite_id) {
          // Desbloquear el trámite individual
          await supabase.from('tramites_desbloqueados').insert({
            user_id: pago.user_id,
            tramite_id: pago.tramite_id,
            pago_id: pago.id,
          })
        } else if (pago.tipo === 'suscripcion_anual') {
          // Activar plan anual (1 año desde hoy)
          const vence = new Date()
          vence.setFullYear(vence.getFullYear() + 1)

          await supabase
            .from('perfiles')
            .update({ plan: 'anual', plan_vence_en: vence.toISOString() })
            .eq('id', pago.user_id)
        }

        logger.info('pago_aprobado', { pagoId: pago.id, userId: pago.user_id })
      }
    } else if (pagoDatos.status === 'rejected' || pagoDatos.status === 'cancelled') {
      await supabase
        .from('pagos')
        .update({ estado: pagoDatos.status === 'rejected' ? 'rechazado' : 'cancelado' })
        .eq('mp_external_ref', pagoDatos.external_reference)
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    logger.error('webhook_procesamiento_fallo', { error, pagoMpId })
    // Retornar 500 para que MercadoPago reintente
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
