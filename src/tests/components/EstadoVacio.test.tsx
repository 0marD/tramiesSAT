import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EstadoVacio } from '@/components/shared/EstadoVacio'

describe('EstadoVacio', () => {
  it('renderiza el título y la descripción', () => {
    render(
      <EstadoVacio
        titulo="Sin trámites"
        descripcion="Aún no has iniciado ningún trámite."
      />
    )
    expect(screen.getByText('Sin trámites')).toBeInTheDocument()
    expect(screen.getByText('Aún no has iniciado ningún trámite.')).toBeInTheDocument()
  })

  it('renderiza el link de acción cuando se provee la prop accion', () => {
    render(
      <EstadoVacio
        titulo="Sin trámites"
        descripcion="Descripción"
        accion={{ texto: 'Empezar con RFC', href: '/tramite/rfc-persona-fisica' }}
      />
    )
    expect(screen.getByRole('link', { name: 'Empezar con RFC' })).toBeInTheDocument()
  })

  it('el link de acción tiene el href correcto', () => {
    render(
      <EstadoVacio
        titulo="Sin trámites"
        descripcion="Descripción"
        accion={{ texto: 'Empezar con RFC', href: '/tramite/rfc-persona-fisica' }}
      />
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tramite/rfc-persona-fisica')
  })

  it('no renderiza link cuando no se provee prop accion', () => {
    render(<EstadoVacio titulo="Sin trámites" descripcion="Descripción" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
