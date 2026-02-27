import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// vi.mock must be top-level — cannot be in an imported side-effect file for this to hoist correctly
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null }),
}))

import { DiagnosticoForm } from '@/components/tramite/DiagnosticoForm'
import type { PreguntaDiagnostico } from '@/types/tramite'

const preguntas: PreguntaDiagnostico[] = [
  {
    id: 'p1',
    texto: '¿Tienes RFC?',
    tipo: 'radio',
    opciones: [
      { id: 'p1-si', texto: 'Sí, ya tengo RFC' },
      { id: 'p1-no', texto: 'No, necesito tramitarlo' },
    ],
  },
  {
    id: 'p2',
    texto: '¿Tienes e.firma?',
    tipo: 'radio',
    opciones: [
      { id: 'p2-si', texto: 'Sí' },
      { id: 'p2-no', texto: 'No' },
    ],
  },
]

describe('DiagnosticoForm', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      value: { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
      writable: true,
    })
  })

  it('renderiza todas las preguntas y sus opciones', () => {
    render(<DiagnosticoForm preguntas={preguntas} tramiteSlug="efirma" />)
    expect(screen.getByText('¿Tienes RFC?')).toBeInTheDocument()
    expect(screen.getByText('¿Tienes e.firma?')).toBeInTheDocument()
    expect(screen.getByText('Sí, ya tengo RFC')).toBeInTheDocument()
    expect(screen.getByText('No, necesito tramitarlo')).toBeInTheDocument()
  })

  it('las opciones tienen role="radio"', () => {
    render(<DiagnosticoForm preguntas={preguntas} tramiteSlug="efirma" />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
  })

  it('las opciones tienen aria-checked=false inicialmente', () => {
    render(<DiagnosticoForm preguntas={preguntas} tramiteSlug="efirma" />)
    const radios = screen.getAllByRole('radio')
    radios.forEach(radio => expect(radio).toHaveAttribute('aria-checked', 'false'))
  })

  it('hacer click en una opción la marca con aria-checked=true', () => {
    render(<DiagnosticoForm preguntas={preguntas} tramiteSlug="efirma" />)
    const primeraOpcion = screen.getByText('Sí, ya tengo RFC').closest('button')!
    fireEvent.click(primeraOpcion)
    expect(primeraOpcion).toHaveAttribute('aria-checked', 'true')
  })

  it('el botón continuar está deshabilitado cuando no todas las preguntas están respondidas', () => {
    render(<DiagnosticoForm preguntas={preguntas} tramiteSlug="efirma" />)
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('llama a sessionStorage.setItem al hacer submit con todas las preguntas respondidas', () => {
    const setItemMock = vi.fn()
    Object.defineProperty(window, 'sessionStorage', {
      value: { setItem: setItemMock, getItem: vi.fn() },
      writable: true,
    })
    render(<DiagnosticoForm preguntas={preguntas} tramiteSlug="efirma" />)

    fireEvent.click(screen.getByText('Sí, ya tengo RFC').closest('button')!)
    fireEvent.click(screen.getByText('Sí').closest('button')!)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(setItemMock).toHaveBeenCalledWith(
      'diagnostico-efirma',
      expect.any(String)
    )
  })
})
