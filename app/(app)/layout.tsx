import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/app/shell/Navbar'
import { LeftSidebar, MobileBottomNav } from '@/components/app/shell/LeftSidebar'
import { RightSidebar } from '@/components/app/shell/RightSidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[var(--color-glyph-black)]">
      <Navbar profile={profile} />

      <div className="flex pt-14">
        <LeftSidebar profile={profile} />

        {/* Center content */}
        <main className="min-w-0 flex-1 lg:ml-[220px] xl:mr-[280px]">
          <div className="mx-auto max-w-2xl px-4 py-6">
            {children}
          </div>
        </main>

        <RightSidebar />
      </div>

      <MobileBottomNav profile={profile} />
    </div>
  )
}
