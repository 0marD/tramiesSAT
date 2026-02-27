import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarraProgreso } from '@/components/tramite/BarraProgreso'

describe('BarraProgreso', () => {
  it('renderiza texto "Paso X de Y"', () => {
    render(<BarraProgreso pasoActual={2} totalPasos={5} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/de 5/)).toBeInTheDocument()
  })

  it('tiene role progressbar', () => {
    render(<BarraProgreso pasoActual={1} totalPasos={4} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar tiene aria-valuenow correcto', () => {
    render(<BarraProgreso pasoActual={2} totalPasos={4} />)
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuenow', '50')
  })

  it('progressbar tiene aria-valuemin=0 y aria-valuemax=100', () => {
    render(<BarraProgreso pasoActual={1} totalPasos={4} />)
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuemin', '0')
    expect(barra).toHaveAttribute('aria-valuemax', '100')
  })

  it('paso 3 de 6 resulta en 50%', () => {
    render(<BarraProgreso pasoActual={3} totalPasos={6} />)
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuenow', '50')
  })
})
