interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main
      className={`flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full ${className}`}
    >
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 duration-300">
        {children}
      </div>
    </main>
  )
}
