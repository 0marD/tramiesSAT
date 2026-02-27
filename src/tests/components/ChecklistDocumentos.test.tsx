import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChecklistDocumentos } from '@/components/tramite/ChecklistDocumentos'
import type { Documento } from '@/types/tramite'

const documentos: Documento[] = [
  { id: 'doc-1', nombre: 'INE vigente', descripcion: 'Tu credencial para votar', obligatorio: true },
  { id: 'doc-2', nombre: 'CURP', descripcion: 'Tu clave única de identidad', obligatorio: true },
]

describe('ChecklistDocumentos', () => {
  it('renderiza todos los documentos', () => {
    render(<ChecklistDocumentos documentos={documentos} onTodosListos={vi.fn()} />)
    expect(screen.getByText('INE vigente')).toBeInTheDocument()
    expect(screen.getByText('CURP')).toBeInTheDocument()
  })

  it('el documento tiene aria-checked=false inicialmente', () => {
    render(<ChecklistDocumentos documentos={documentos} onTodosListos={vi.fn()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(cb => expect(cb).toHaveAttribute('aria-checked', 'false'))
  })

  it('hace click en un documento y lo marca como checked', () => {
    render(<ChecklistDocumentos documentos={documentos} onTodosListos={vi.fn()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]!)
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true')
  })

  it('hace click de nuevo en un documento marcado y lo deselecciona', () => {
    render(<ChecklistDocumentos documentos={documentos} onTodosListos={vi.fn()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]!)
    fireEvent.click(checkboxes[0]!)
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'false')
  })

  it('el botón principal está deshabilitado cuando no todos los docs están marcados', () => {
    render(<ChecklistDocumentos documentos={documentos} onTodosListos={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Ya tengo todo/ })).toBeDisabled()
  })

  it('el botón principal está habilitado cuando todos los docs están marcados', () => {
    render(<ChecklistDocumentos documentos={documentos} onTodosListos={vi.fn()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(cb => fireEvent.click(cb))
    expect(screen.getByRole('button', { name: /Ya tengo todo/ })).not.toBeDisabled()
  })

  it('llama a onTodosListos cuando el botón es clickeado con todos marcados', () => {
    const onTodosListos = vi.fn()
    render(<ChecklistDocumentos documentos={documentos} onTodosListos={onTodosListos} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(cb => fireEvent.click(cb))
    fireEvent.click(screen.getByRole('button', { name: /Ya tengo todo/ }))
    expect(onTodosListos).toHaveBeenCalledOnce()
  })
})
