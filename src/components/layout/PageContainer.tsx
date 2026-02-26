interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main
      className={`flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full ${className}`}
    >
      {children}
    </main>
  )
}
