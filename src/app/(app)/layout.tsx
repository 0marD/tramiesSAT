import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
