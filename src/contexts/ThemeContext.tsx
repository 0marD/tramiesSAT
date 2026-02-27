'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Tema = 'claro' | 'oscuro' | 'sistema'

interface ThemeContextValue {
  tema: Tema
  setTema: (tema: Tema) => void
  temaEfectivo: 'claro' | 'oscuro'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'tramitesat-tema'

function resolverTemaEfectivo(tema: Tema): 'claro' | 'oscuro' {
  if (tema !== 'sistema') return tema
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<Tema>('sistema')
  const [temaEfectivo, setTemaEfectivo] = useState<'claro' | 'oscuro'>('claro')

  const aplicarTema = useCallback((nuevoTema: Tema) => {
    const efectivo = resolverTemaEfectivo(nuevoTema)
    setTemaEfectivo(efectivo)
    if (efectivo === 'oscuro') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY) as Tema | null
    const temaInicial: Tema = guardado === 'claro' || guardado === 'oscuro' || guardado === 'sistema'
      ? guardado
      : 'sistema'
    setTemaState(temaInicial)
    aplicarTema(temaInicial)
  }, [aplicarTema])

  useEffect(() => {
    if (tema !== 'sistema') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => aplicarTema('sistema')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [tema, aplicarTema])

  const setTema = useCallback((nuevoTema: Tema) => {
    setTemaState(nuevoTema)
    localStorage.setItem(STORAGE_KEY, nuevoTema)
    aplicarTema(nuevoTema)
  }, [aplicarTema])

  return (
    <ThemeContext.Provider value={{ tema, setTema, temaEfectivo }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
