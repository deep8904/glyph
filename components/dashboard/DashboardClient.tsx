'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  UserCircle,
  Folder,
  Joystick,
  Calendar,
  Handshake,
  Rss,
  Plus,
  LogOut,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Profile', Icon: UserCircle, active: true },
  { label: 'My Projects', Icon: Folder },
  { label: 'Playtests', Icon: Joystick },
  { label: 'Events', Icon: Calendar },
  { label: 'Collaborate', Icon: Handshake },
  { label: 'Feed', Icon: Rss },
]

const EMPTY_STATES = [
  { Icon: Folder, title: 'Your Projects', label: 'No projects yet.', action: 'Get started' },
  { Icon: Calendar, title: 'Upcoming Events', label: 'No events on your calendar.', action: 'Get started' },
  { Icon: Handshake, title: 'Open Collaborations', label: 'No collaborations yet.', action: 'Get started' },
]

export function DashboardClient({
  displayName,
  email,
  username,
  missing,
}: {
  displayName: string
  email: string
  username: string
  missing: string[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initial = (displayName || 'D').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-352 mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow overflow-hidden flex border border-white relative min-h-[80vh]">

          {/* Sidebar */}
          <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-gray-100 bg-gray-50/40">
            <div className="px-7 py-8">
              <Link href="/" className="flex items-center gap-1 text-xl font-semibold tracking-tighter text-gray-900">
                Glyph<span className="text-indigo-600 leading-none">°</span>
              </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1">
              {NAV_ITEMS.map(({ label, Icon, active }) => (
                <a
                  key={label}
                  href="#"
                  className={
                    'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ' +
                    (active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </a>
              ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-100">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-mono font-semibold">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName || '—'}</p>
                  <p className="text-[11px] text-gray-400 font-mono truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </aside>

          {/* Main content */}
          <section className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-gray-100">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400">Dashboard</span>
              <button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
                <Plus className="h-4 w-4" /> New Project
              </button>
            </div>

            <div className="flex-1 px-6 md:px-10 py-8 space-y-8 overflow-y-auto">
              {/* Welcome card */}
              <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white p-8 md:p-12">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] pointer-events-none" />
                <div className="relative z-10 max-w-xl">
                  <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-3">
                    Welcome to Glyph, {displayName.split(' ')[0]}.
                  </h1>
                  <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-8">
                    Your profile is live. Share it, keep it current, and start documenting what you&apos;re building.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/dev/${username}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20"
                    >
                      View your public profile <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-gray-200 hover:bg-white/10 transition-all duration-300">
                      Browse Community
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete-your-profile prompt */}
              {missing.length > 0 && (
                <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Complete your profile</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    A fuller profile gets more collaboration requests. Still missing:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missing.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-indigo-600"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty-state cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {EMPTY_STATES.map(({ Icon, title, label, action }) => (
                  <div key={title} className="flex flex-col rounded-3xl bg-white border border-gray-100 shadow-sm p-8">
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-gray-400 mb-6">{title}</h3>
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-gray-500 mb-4">{label}</p>
                      <a href="#" className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 uppercase tracking-wider hover:text-indigo-700 transition-colors">
                        {action} <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
