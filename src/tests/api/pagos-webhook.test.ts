import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockVerificarFirma = vi.fn()
const mockServiceFrom = vi.fn()

vi.mock('@/lib/mercadopago/webhook', () => ({
  verificarFirmaWebhook: mockVerificarFirma,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildWebhookRequest(body: unknown, firmaCabecera = 'ts=9999999999,v1=aaaa'): NextRequest {
  return new NextRequest('http://localhost/api/pagos/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': firmaCabecera,
      'x-request-id': 'req-test-1',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function buildApprovedPagoMpResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      status: 'approved',
      external_reference: 'user-1-1700000000',
      transaction_amount: 59,
    }),
  } as unknown as Response
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/pagos/webhook', () => {
  beforeEach(() => {
    mockVerificarFirma.mockReset()
    mockServiceFrom.mockReset()
    process.env['WEBHOOK_SECRET_MERCADOPAGO'] = 'test-secret'
    process.env['MERCADOPAGO_ACCESS_TOKEN'] = 'test-token'
  })

  it('retorna 401 cuando la firma es inválida', async () => {
    mockVerificarFirma.mockReturnValue(false)
    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'payment', data: { id: '123' } }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 cuando el body no es JSON válido', async () => {
    mockVerificarFirma.mockReturnValue(true)
    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest('not-json{{{'))
    expect(res.status).toBe(400)
  })

  it('retorna 200 y sale temprano para eventos que no son "payment"', async () => {
    mockVerificarFirma.mockReturnValue(true)
    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'plan', data: { id: '456' } }))
    expect(res.status).toBe(200)
    const json = await res.json() as { ok: boolean }
    expect(json.ok).toBe(true)
    expect(mockServiceFrom).not.toHaveBeenCalled()
  })

  it('para pago aprobado por_tramite: actualiza pago e inserta tramites_desbloqueados', async () => {
    mockVerificarFirma.mockReturnValue(true)

    global.fetch = vi.fn().mockResolvedValue(buildApprovedPagoMpResponse())

    const mockPagoRow = { id: 'pago-1', user_id: 'user-1', tramite_id: 'tramite-1', tipo: 'por_tramite' }

    const mockUpdate = vi.fn().mockReturnThis()
    const mockEqUpdate = vi.fn().mockReturnThis()
    const mockSelectUpdate = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({ data: mockPagoRow })

    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    mockServiceFrom
      .mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEqUpdate,
        select: mockSelectUpdate,
        single: mockSingle,
      })
      .mockReturnValueOnce({
        insert: mockInsert,
      })

    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'payment', data: { id: 'mp-pago-1' } }))
    expect(res.status).toBe(200)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('para pago aprobado suscripcion_anual: actualiza perfiles con plan anual', async () => {
    mockVerificarFirma.mockReturnValue(true)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'approved',
        external_reference: 'user-1-1700000000',
        transaction_amount: 349,
      }),
    } as unknown as Response)

    const mockPagoRow = { id: 'pago-2', user_id: 'user-1', tramite_id: null, tipo: 'suscripcion_anual' }

    const mockPerfilesUpdate = vi.fn().mockReturnThis()
    const mockPerfilesEq = vi.fn().mockResolvedValue({ data: null, error: null })

    mockServiceFrom
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPagoRow }),
      })
      .mockReturnValueOnce({
        update: mockPerfilesUpdate,
        eq: mockPerfilesEq,
      })

    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'payment', data: { id: 'mp-pago-2' } }))
    expect(res.status).toBe(200)
    expect(mockPerfilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'anual' })
    )
  })

  it('para pago rechazado: actualiza pago con estado "rechazado"', async () => {
    mockVerificarFirma.mockReturnValue(true)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'rejected',
        external_reference: 'user-1-1700000000',
        transaction_amount: 59,
      }),
    } as unknown as Response)

    const mockUpdate = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })

    mockServiceFrom.mockReturnValueOnce({ update: mockUpdate, eq: mockEq })

    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'payment', data: { id: 'mp-pago-3' } }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'rechazado' })
  })

  it('para pago cancelado: actualiza pago con estado "cancelado"', async () => {
    mockVerificarFirma.mockReturnValue(true)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'cancelled',
        external_reference: 'user-1-1700000000',
        transaction_amount: 59,
      }),
    } as unknown as Response)

    const mockUpdate = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })

    mockServiceFrom.mockReturnValueOnce({ update: mockUpdate, eq: mockEq })

    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'payment', data: { id: 'mp-pago-4' } }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'cancelado' })
  })

  it('retorna 500 cuando el fetch a MP falla (para que MP reintente)', async () => {
    mockVerificarFirma.mockReturnValue(true)
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'payment', data: { id: 'mp-pago-5' } }))
    expect(res.status).toBe(500)
  })

  it('retorna 500 cuando WEBHOOK_SECRET_MERCADOPAGO no está definido', async () => {
    delete process.env['WEBHOOK_SECRET_MERCADOPAGO']
    const { POST } = await import('@/app/api/pagos/webhook/route')
    const res = await POST(buildWebhookRequest({ type: 'payment', data: { id: '123' } }))
    expect(res.status).toBe(500)
  })
})
