import { vi } from 'vitest'

export const mockSetTema = vi.fn()

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    tema: 'sistema',
    temaEfectivo: 'claro',
    setTema: mockSetTema,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))
