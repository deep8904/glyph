import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserCircle, Key, Bell, AlertTriangle } from 'lucide-react'

const SETTINGS_NAV = [
  { href: '/settings/profile', label: 'Profile', Icon: UserCircle },
  { href: '/settings/account', label: 'Account', Icon: Key },
  { href: '/settings/notifications', label: 'Notifications', Icon: Bell },
  { href: '/settings/danger', label: 'Danger Zone', Icon: AlertTriangle },
]

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
            <Link href="/dashboard" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Settings</span>
          </div>

          <div className="flex flex-col sm:flex-row flex-1 min-h-0">
            {/* Settings sidebar nav */}
            <nav className="sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 px-4 py-5 sm:py-8 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible">
              {SETTINGS_NAV.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 shrink-0" /> {label}
                </Link>
              ))}
            </nav>

            {/* Page content */}
            <div className="flex-1 min-w-0 px-5 py-6 sm:px-8 sm:py-8 md:px-10">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
