import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Must be inline for proper vi.mock hoisting
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null }),
}))

const mockSetTema = vi.fn()

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    tema: 'sistema',
    temaEfectivo: 'claro',
    setTema: mockSetTema,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import { Header } from '@/components/layout/Header'

describe('Header', () => {
  beforeEach(() => {
    mockSetTema.mockClear()
  })

  it('renderiza el link "TrámiteSAT" cuando no se provee titulo', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /TrámiteSAT/i })).toBeInTheDocument()
  })

  it('renderiza el título cuando se provee la prop titulo', () => {
    render(<Header titulo="Mi trámite" />)
    expect(screen.getByText('Mi trámite')).toBeInTheDocument()
  })

  it('no renderiza botón de regresar por defecto', () => {
    render(<Header />)
    expect(screen.queryByRole('button', { name: 'Regresar' })).not.toBeInTheDocument()
  })

  it('renderiza el botón de regresar cuando mostrarRegresar es true', () => {
    render(<Header mostrarRegresar onRegresar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Regresar' })).toBeInTheDocument()
  })

  it('llama a onRegresar cuando se hace click en el botón regresar', () => {
    const onRegresar = vi.fn()
    render(<Header mostrarRegresar onRegresar={onRegresar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Regresar' }))
    expect(onRegresar).toHaveBeenCalledOnce()
  })
})
