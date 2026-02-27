import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('guardarProgreso', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
    mockRevalidatePath.mockReset()
  })

  it('retorna error cuando el usuario no tiene sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('sin sesión') })
    const { guardarProgreso } = await import('@/lib/tramites/acciones')
    const resultado = await guardarProgreso({ tramiteSlug: 'rfc-persona-fisica', pasoActual: 1 })
    expect(resultado.exito).toBe(false)
    if (!resultado.exito) {
      expect(resultado.error).toBe('Sesión expirada')
    }
  })

  it('retorna error cuando la validación Zod falla', async () => {
    const { guardarProgreso } = await import('@/lib/tramites/acciones')
    // pasoActual: 0 es inválido según el schema
    const resultado = await guardarProgreso({ tramiteSlug: 'rfc-persona-fisica', pasoActual: 0 })
    expect(resultado.exito).toBe(false)
    if (!resultado.exito) {
      expect(resultado.error).toBe('Datos inválidos')
    }
  })

  it('retorna error cuando el trámite no se encuentra en DB', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })

    const { guardarProgreso } = await import('@/lib/tramites/acciones')
    const resultado = await guardarProgreso({ tramiteSlug: 'rfc-persona-fisica', pasoActual: 1 })
    expect(resultado.exito).toBe(false)
    if (!resultado.exito) {
      expect(resultado.error).toBe('Trámite no encontrado')
    }
  })

  it('retorna { exito: true } en upsert exitoso', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'tramite-1' } }),
      })
      .mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      })

    const { guardarProgreso } = await import('@/lib/tramites/acciones')
    const resultado = await guardarProgreso({ tramiteSlug: 'rfc-persona-fisica', pasoActual: 2 })
    expect(resultado.exito).toBe(true)
  })

  it('llama a revalidatePath("/historial") al guardar exitosamente', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'tramite-1' } }),
      })
      .mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      })

    const { guardarProgreso } = await import('@/lib/tramites/acciones')
    await guardarProgreso({ tramiteSlug: 'rfc-persona-fisica', pasoActual: 2 })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/historial')
  })
})

describe('marcarTramiteCompletado', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
    mockRevalidatePath.mockReset()
  })

  it('retorna error cuando el usuario no tiene sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { marcarTramiteCompletado } = await import('@/lib/tramites/acciones')
    const resultado = await marcarTramiteCompletado('rfc-persona-fisica')
    expect(resultado.exito).toBe(false)
    if (!resultado.exito) {
      expect(resultado.error).toBe('Sesión expirada')
    }
  })

  it('retorna error cuando el trámite no se encuentra', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })

    const { marcarTramiteCompletado } = await import('@/lib/tramites/acciones')
    const resultado = await marcarTramiteCompletado('rfc-persona-fisica')
    expect(resultado.exito).toBe(false)
    if (!resultado.exito) {
      expect(resultado.error).toBe('Trámite no encontrado')
    }
  })

  it('retorna { exito: true } al completar exitosamente', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'tramite-1' } }),
      })
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

    // The second from().update().eq().eq() chain
    mockFrom.mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const { marcarTramiteCompletado } = await import('@/lib/tramites/acciones')
    const resultado = await marcarTramiteCompletado('rfc-persona-fisica')
    expect(resultado.exito).toBe(true)
  })
})
