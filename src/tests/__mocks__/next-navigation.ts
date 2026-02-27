import { vi } from 'vitest'

export const mockPush = vi.fn()
export const mockBack = vi.fn()
export const mockPathname = vi.fn(() => '/')

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => mockPathname(),
  useSearchParams: () => ({ get: () => null }),
}))
