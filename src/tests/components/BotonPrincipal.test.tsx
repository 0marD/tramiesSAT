import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BotonPrincipal } from '@/components/shared/BotonPrincipal'

describe('BotonPrincipal', () => {
  it('renderiza el texto recibido en prop texto', () => {
    render(<BotonPrincipal texto="Continuar" />)
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })

  it('muestra "Guardando..." cuando cargando es true', () => {
    render(<BotonPrincipal texto="Continuar" cargando />)
    expect(screen.getByText('Guardando...')).toBeInTheDocument()
  })

  it('el botón está deshabilitado cuando deshabilitado es true', () => {
    render(<BotonPrincipal texto="Continuar" deshabilitado />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('el botón está deshabilitado cuando cargando es true', () => {
    render(<BotonPrincipal texto="Continuar" cargando />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('llama a onClick cuando el botón es clickeado y está habilitado', () => {
    const onClick = vi.fn()
    render(<BotonPrincipal texto="Continuar" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
