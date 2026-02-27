import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'TrámiteSAT — Guía paso a paso para tus trámites del SAT',
    template: '%s — TrámiteSAT',
  },
  description: 'Guía interactiva para realizar tus trámites del SAT paso a paso. RFC, e.firma, declaración anual y más.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TrámiteSAT',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'TrámiteSAT',
    locale: 'es_MX',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A2E44',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={inter.variable} suppressHydrationWarning>
      {/* Inline script to apply dark class before first paint — prevents FOUC */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('tramitesat-tema');var d=document.documentElement;if(t==='oscuro'||(t!=='claro'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark')}}catch(e){}})()`,
        }}
      />
      <body className="bg-slate-50 dark:bg-slate-950 font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
