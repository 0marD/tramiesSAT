import { describe, it, expect, vi } from 'vitest'
import crypto from 'crypto'
import { verificarFirmaWebhook } from '@/lib/mercadopago/webhook'

const SECRET = 'test-secret-key-12345'

function generarFirmaValida(requestId: string, ts: number): string {
  const templateString = `id:${requestId};request-id:${requestId};ts:${ts};`
  const hmac = crypto.createHmac('sha256', SECRET).update(templateString).digest('hex')
  return `ts=${ts},v1=${hmac}`
}

describe('verificarFirmaWebhook', () => {
  it('debe devolver true para una firma válida y reciente', () => {
    const requestId = 'req-abc-123'
    const ts = Math.floor(Date.now() / 1000)
    const signature = generarFirmaValida(requestId, ts)

    expect(verificarFirmaWebhook({
      body: '{}',
      signature,
      requestId,
      secret: SECRET,
    })).toBe(true)
  })

  it('debe devolver false si el timestamp tiene más de 5 minutos', () => {
    const requestId = 'req-abc-123'
    const ts = Math.floor(Date.now() / 1000) - 301 // 5min 1seg en el pasado
    const signature = generarFirmaValida(requestId, ts)

    expect(verificarFirmaWebhook({
      body: '{}',
      signature,
      requestId,
      secret: SECRET,
    })).toBe(false)
  })

  it('debe devolver false si la firma está manipulada', () => {
    const requestId = 'req-abc-123'
    const ts = Math.floor(Date.now() / 1000)
    const signatureTampering = `ts=${ts},v1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`

    expect(verificarFirmaWebhook({
      body: '{}',
      signature: signatureTampering,
      requestId,
      secret: SECRET,
    })).toBe(false)
  })

  it('debe devolver false si el secreto es incorrecto', () => {
    const requestId = 'req-abc-123'
    const ts = Math.floor(Date.now() / 1000)
    const signature = generarFirmaValida(requestId, ts)

    expect(verificarFirmaWebhook({
      body: '{}',
      signature,
      requestId,
      secret: 'secreto-incorrecto',
    })).toBe(false)
  })

  it('debe devolver false si la firma no tiene el formato esperado', () => {
    expect(verificarFirmaWebhook({
      body: '{}',
      signature: 'formato-invalido',
      requestId: 'req-abc-123',
      secret: SECRET,
    })).toBe(false)
  })

  it('debe devolver false si faltan partes en la firma', () => {
    const ts = Math.floor(Date.now() / 1000)
    // Falta v1
    expect(verificarFirmaWebhook({
      body: '{}',
      signature: `ts=${ts}`,
      requestId: 'req-abc-123',
      secret: SECRET,
    })).toBe(false)
  })

  it('debe devolver false si v1 no es hex válido (timingSafeEqual lanza error)', () => {
    const ts = Math.floor(Date.now() / 1000)
    // v1 con caracteres no-hex provocan error en Buffer.from
    expect(verificarFirmaWebhook({
      body: '{}',
      signature: `ts=${ts},v1=ZZZZ-no-es-hex`,
      requestId: 'req-abc-123',
      secret: SECRET,
    })).toBe(false)
  })
})
