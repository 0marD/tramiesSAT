import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EstadoError } from '@/components/shared/EstadoError'

describe('EstadoError', () => {
  it('renderiza el mensaje por defecto', () => {
    render(<EstadoError />)
    expect(screen.getByText('Algo salió mal. Intenta de nuevo.')).toBeInTheDocument()
  })

  it('renderiza el mensaje personalizado', () => {
    render(<EstadoError mensaje="Error de conexión." />)
    expect(screen.getByText('Error de conexión.')).toBeInTheDocument()
  })

  it('renderiza botón "Intentar de nuevo" cuando se provee onReintentar', () => {
    render(<EstadoError onReintentar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()
  })

  it('llama a onReintentar cuando se hace click en el botón', () => {
    const onReintentar = vi.fn()
    render(<EstadoError onReintentar={onReintentar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))
    expect(onReintentar).toHaveBeenCalledOnce()
  })
})
