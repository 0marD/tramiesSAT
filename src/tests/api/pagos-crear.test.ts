import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockSupabaseFrom,
  })),
  createServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}))

const mockServiceFrom = vi.fn()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRequest(body: unknown, options: RequestInit = {}): NextRequest {
  return new NextRequest('http://localhost/api/pagos/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  })
}

function buildInvalidJsonRequest(): NextRequest {
  return new NextRequest('http://localhost/api/pagos/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not-json{{{',
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/pagos/crear', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetUser.mockReset()
    mockSupabaseFrom.mockReset()
    mockServiceFrom.mockReset()
    process.env['MERCADOPAGO_ACCESS_TOKEN'] = 'test-token'
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://tramitesat.mx'
  })

  it('retorna 401 cuando el usuario no tiene sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/pagos/crear/route')
    const res = await POST(buildRequest({ tipoPlan: 'por_tramite' }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 cuando el body no es JSON válido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const { POST } = await import('@/app/api/pagos/crear/route')
    const res = await POST(buildInvalidJsonRequest())
    expect(res.status).toBe(400)
  })

  it('retorna 400 cuando la validación Zod falla', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const { POST } = await import('@/app/api/pagos/crear/route')
    const res = await POST(buildRequest({ tipoPlan: 'invalido' }))
    expect(res.status).toBe(400)
  })

  it('retorna 409 cuando el trámite ya está desbloqueado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockSupabaseFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'tramite-1' } }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'desbloqueado-1' } }),
      })

    const { POST } = await import('@/app/api/pagos/crear/route')
    const res = await POST(buildRequest({ tipoPlan: 'por_tramite', tramiteSlug: 'rfc-persona-fisica' }))
    expect(res.status).toBe(409)
  })

  it('retorna 200 con preferenceId en éxito', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // sin tramite desbloqueado
    mockSupabaseFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      })

    // service from: tramite lookup + pago insert
    mockServiceFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'tramite-db-1' } }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'pago-1' }, error: null }),
      })
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ id: 'pref-123', init_point: 'https://mp.com/pref-123' }),
    } as unknown as Response)

    const { POST } = await import('@/app/api/pagos/crear/route')
    const res = await POST(buildRequest({ tipoPlan: 'por_tramite', tramiteSlug: 'rfc-persona-fisica' }))
    expect(res.status).toBe(200)
    const json = await res.json() as { preferenceId: string }
    expect(json.preferenceId).toBe('pref-123')
  })

  it('retorna 500 cuando el fetch a MercadoPago falla', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })

    mockServiceFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'pago-1' }, error: null }),
      })

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { POST } = await import('@/app/api/pagos/crear/route')
    const res = await POST(buildRequest({ tipoPlan: 'suscripcion_anual' }))
    expect(res.status).toBe(500)
  })
})
