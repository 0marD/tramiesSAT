import crypto from 'crypto'

interface VerificarFirmaParams {
  body: string
  signature: string
  requestId: string
  secret: string
}

/**
 * Verifica la firma HMAC-SHA256 del webhook de MercadoPago.
 * Siempre llamar antes de procesar cualquier evento.
 * Docs: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verificarFirmaWebhook(params: VerificarFirmaParams): boolean {
  const { signature, requestId, secret } = params

  // Formato: "ts=1704067200,v1=abc123..."
  const partes = Object.fromEntries(
    signature.split(',').map(p => p.split('=') as [string, string])
  )

  const ts = partes['ts']
  const v1 = partes['v1']

  if (!ts || !v1) return false

  // Verificar que el timestamp no tiene más de 5 minutos
  const ahora = Math.floor(Date.now() / 1000)
  if (Math.abs(ahora - parseInt(ts, 10)) > 300) return false

  const templateString = `id:${requestId};request-id:${requestId};ts:${ts};`

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(templateString)
    .digest('hex')

  // Comparación de tiempo constante — evita timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(v1, 'hex')
    )
  } catch {
    return false
  }
}
