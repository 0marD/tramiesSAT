import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EstadoCargando } from '@/components/shared/EstadoCargando'

describe('EstadoCargando', () => {
  it('tiene role="status"', () => {
    render(<EstadoCargando />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renderiza el mensaje por defecto "Cargando..."', () => {
    render(<EstadoCargando />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renderiza el mensaje personalizado cuando se provee prop mensaje', () => {
    render(<EstadoCargando mensaje="Verificando datos..." />)
    expect(screen.getByText('Verificando datos...')).toBeInTheDocument()
  })
})
