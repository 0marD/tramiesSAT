import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TramiteCard } from '@/components/tramite/TramiteCard'
import type { MetaTramiteConstante } from '@/constants/tramites'

const tramiteBase: MetaTramiteConstante = {
  slug: 'rfc-persona-fisica',
  nombre: 'RFC',
  descripcion: 'Obtén tu Registro Federal de Contribuyentes',
  categoria: 'identidad',
  duracionMinutos: 10,
  requierePago: false,
  ordenDisplay: 1,
}

describe('TramiteCard', () => {
  it('renderiza el nombre del trámite', () => {
    render(<TramiteCard tramite={tramiteBase} />)
    expect(screen.getByText('RFC')).toBeInTheDocument()
  })

  it('renderiza la descripción del trámite', () => {
    render(<TramiteCard tramite={tramiteBase} />)
    expect(screen.getByText('Obtén tu Registro Federal de Contribuyentes')).toBeInTheDocument()
  })

  it('renderiza la duración en minutos', () => {
    render(<TramiteCard tramite={tramiteBase} />)
    expect(screen.getByText('10 min')).toBeInTheDocument()
  })

  it('tiene href correcto al slug del trámite', () => {
    render(<TramiteCard tramite={tramiteBase} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tramite/rfc-persona-fisica')
  })

  it('muestra ícono Lock cuando requierePago es true', () => {
    const conPago: MetaTramiteConstante = { ...tramiteBase, requierePago: true }
    render(<TramiteCard tramite={conPago} />)
    expect(screen.getByLabelText('Requiere pago')).toBeInTheDocument()
  })

  it('no muestra ícono Lock cuando requierePago es false', () => {
    render(<TramiteCard tramite={tramiteBase} />)
    expect(screen.queryByLabelText('Requiere pago')).not.toBeInTheDocument()
  })

  it('tiene clase focus-visible para navegación por teclado', () => {
    render(<TramiteCard tramite={tramiteBase} />)
    const link = screen.getByRole('link')
    expect(link.className).toContain('focus-visible:outline-2')
  })
})
