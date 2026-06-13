
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Gamepad2,
  Layers,
  UserSquare,
  FileText,
  Joystick,
  MapPin,
  Users,
  Tag,
  Code2,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  GitBranch,
} from 'lucide-react'

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('active')
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

const METRICS = [
  { label: 'Global Active', value: '250K', sublabel: 'Active indie developers globally', delay: 'delay-100' },
  { label: '2024 Record', value: '8,554', sublabel: 'Indie games on Steam in 2024 — highest ever', delay: 'delay-200' },
  { label: 'Revenue Share', value: '48%', sublabel: 'Of all Steam full-game revenue', delay: 'delay-300' },
  { label: 'Market Size', value: '$10.8B', sublabel: 'Projected indie market size by 2031', delay: 'delay-400' },
]

const STEPS = [
  {
    step: '01',
    title: 'Create your profile',
    desc: 'Add your skills, engine, and current project. Your developer page is public and searchable from day one.',
  },
  {
    step: '02',
    title: 'Start building in public',
    desc: 'Post devlogs, request playtesters, browse your city’s event calendar, and find collaboration opportunities.',
  },
  {
    step: '03',
    title: 'Grow before you launch',
    desc: 'Build an audience, collect real feedback, and arrive at your launch with a community already behind you.',
  },
]

export function Landing({ isAuthed }: { isAuthed: boolean }) {
  useReveal()

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      {/* Plasma background */}
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />

      {/* Glass slices overlay */}
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      {/* Main floating panel */}
      <main className="relative z-10 w-full max-w-352 mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow overflow-hidden flex flex-col border border-white relative">

          {/* Header */}
          <header className="flex items-center justify-between px-8 py-6 md:px-12 md:py-8 border-b border-gray-100/50 reveal">
            <div className="flex items-center gap-1 text-xl font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </div>
            <nav className="hidden lg:flex items-center gap-10 text-[10px] font-mono font-medium text-gray-500 uppercase tracking-widest">
              <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
              <a href="#community" className="hover:text-gray-900 transition-colors">Community</a>
              <a href="#events" className="hover:text-gray-900 transition-colors">Events</a>
              <a href="#jobs" className="hover:text-gray-900 transition-colors">Jobs</a>
            </nav>
            <div className="flex items-center gap-6">
              {isAuthed ? (
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
                  <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300">Sign Up</Link>
                </>
              )}
            </div>
          </header>

          <div className="px-8 md:px-16 lg:px-24 pb-24 pt-16 md:pt-24 space-y-32">

            {/* Hero */}
            <section className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="reveal mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/50 px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-indigo-600 shadow-sm backdrop-blur-md font-mono">
                <Gamepad2 className="h-3.5 w-3.5" /> Platform for Builders
              </div>
              <h1 className="reveal delay-100 text-5xl sm:text-6xl md:text-[80px] text-gray-900 leading-[1.05] font-light tracking-tighter text-balance mb-8">
                Your home base <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-cyan-500">before launch.</span>
              </h1>
              <p className="reveal delay-200 text-base md:text-lg text-gray-500 leading-relaxed max-w-2xl text-balance mb-12">
                Glyph is the platform for indie game developers who are still building. Create your profile, document your progress, find playtesters, discover local events, and connect with collaborators — all in one place, always free.
              </p>
              <div className="reveal delay-300 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
                  Create Your Profile<span className="text-xs font-mono opacity-70 ml-2">IT&apos;S FREE</span>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-8 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300">
                  See How It Works
                </a>
              </div>
            </section>

            {/* Problem */}
            <section className="grid md:grid-cols-2 gap-16 items-center">
              <div className="reveal space-y-6">
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 text-balance">
                  Your workflow is scattered across 7 platforms. None of them are built for you.
                </h2>
                <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                  Indie developers currently split across Reddit, Discord, Twitter/X, itch.io, ArtStation, LinkedIn, and Meetup. Each does one thing. None of them understands a game developer&apos;s pre-launch workflow.
                  <br /><br />
                  The result: isolation and lack of structured feedback.
                </p>
              </div>
              <div className="reveal delay-200 relative p-1 rounded-3xl bg-linear-to-b from-gray-100 to-white">
                <div className="bg-white rounded-[22px] p-10 md:p-14 shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <span className="text-7xl font-light tracking-tighter text-gray-900 mb-4">70%</span>
                  <p className="text-sm font-mono text-gray-500 uppercase tracking-widest leading-relaxed">
                    of indie projects <br /> never reach launch.
                  </p>
                </div>
              </div>
            </section>

            {/* Market stats */}
            <section id="community" className="space-y-12">
              <div className="reveal flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-xl">
                  <h2 className="text-2xl md:text-3xl font-light tracking-tight text-gray-900 mb-4">
                    The indie market is the biggest it has ever been. The infrastructure hasn&apos;t caught up.
                  </h2>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><ChevronLeft className="h-4 w-4" /></span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><ChevronRight className="h-4 w-4" /></span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {METRICS.map((m) => (
                  <div key={m.label} className={`relative flex flex-col p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300 reveal ${m.delay}`}>
                    <ArrowUpRight className="absolute top-5 right-5 h-4 w-4 text-gray-300" />
                    <span className="text-[10px] font-mono font-semibold tracking-widest text-gray-400 uppercase mb-4">{m.label}</span>
                    <span className="text-4xl md:text-5xl font-light tracking-tighter text-gray-900 mb-1">{m.value}</span>
                    <span className="text-xs font-medium text-gray-500">{m.sublabel}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Features bento */}
            <section id="features" className="space-y-12 bg-gray-50/50 -mx-8 md:-mx-16 lg:-mx-24 px-8 md:px-16 lg:px-24 py-24 border-y border-gray-100">
              <div className="reveal max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/50 px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-indigo-600 shadow-sm backdrop-blur-md font-mono">
                  <Layers className="h-3.5 w-3.5" /> Platform Tools
                </div>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 mb-4">
                  Everything you need before launch. Nothing you don&apos;t.
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(280px,auto)] gap-4 md:gap-6">
                {/* Developer Profile — 2 col */}
                <div className="group flex flex-col p-8 rounded-3xl bg-linear-to-br from-white to-gray-50/80 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal delay-100 md:col-span-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <UserSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Developer Profile</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">Your public identity. Skills, engine, tools, current project, devlog history, and collaboration availability — one link that says everything.</p>
                  <div className="mt-8 flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 uppercase tracking-wider">
                    View Example Profile <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                {/* Devlogs — 2 row, dark */}
                <div className="group flex flex-col p-8 rounded-3xl bg-indigo-900 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] transition-all duration-300 reveal delay-200 md:row-span-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white mb-6 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-white tracking-tight mb-3">Project Pages &amp; Devlogs</h3>
                  <p className="text-sm text-indigo-200/80 leading-relaxed max-w-sm flex-1">Document your build in public. Post structured updates, build an audience before your game ships, and keep a full history of your development process.</p>
                  <div className="mt-8 flex items-center gap-2 text-xs font-mono font-semibold text-indigo-300 uppercase tracking-wider">
                    Start a Devlog <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                {/* Playtesting */}
                <div className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal delay-300">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <Joystick className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Structured Playtesting</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">Request testers and collect feedback by category — gameplay, controls, UI, difficulty. Track how your game improves over time.</p>
                </div>
                {/* Events */}
                <div className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal delay-400">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Local Events &amp; Showcases</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">City-based meetups and game jams with RSVP and demo slots. Find your local developer community.</p>
                </div>
                {/* Collaboration — 2 col */}
                <div className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal delay-500 md:col-span-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Collaboration Board</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">Full-time, freelance, rev-share, and volunteer roles — every listing linked to a real project page so you know exactly what you&apos;re joining.</p>
                </div>
              </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="max-w-4xl mx-auto space-y-16">
              <div className="reveal text-center">
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900">Up and running in minutes.</h2>
              </div>
              <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {STEPS.map((item, i) => (
                  <div key={item.step} className={`reveal relative flex items-center justify-between md:justify-normal group ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-50 text-indigo-600 font-mono text-xs shrink-0 md:order-1 shadow-sm z-10 ${i % 2 === 1 ? 'md:translate-x-1/2' : 'md:-translate-x-1/2'}`}>
                      {item.step}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 md:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Always free */}
            <section id="events" className="reveal relative overflow-hidden rounded-[2.5rem] bg-gray-900 text-white p-10 md:p-16 lg:p-20 text-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-indigo-300 shadow-sm backdrop-blur-md font-mono">
                  <Tag className="h-3.5 w-3.5" /> Core features — free. Forever.
                </div>
                <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white text-balance">
                  Individual developers never pay. <br className="hidden md:block" />
                  <span className="text-gray-400">That&apos;s not a trial. That&apos;s the model.</span>
                </h2>
                <p className="text-gray-400 leading-relaxed max-w-2xl mx-auto text-base md:text-lg">
                  Developer profiles, project pages, devlogs, playtesting, local events, and the collaboration board are permanently free. Glyph is funded by studios, publishers, and ecosystem companies — not by the people it&apos;s built to serve.
                </p>
                <div className="pt-4">
                  <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    Create Free Profile
                  </Link>
                </div>
              </div>
            </section>

            {/* Community */}
            <section className="reveal max-w-3xl mx-auto text-center space-y-6 pb-12">
              <Code2 className="h-10 w-10 text-gray-300 mb-4 mx-auto" />
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-gray-900">
                Built for the developer who is still in the middle of it.
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                For the solo developer working nights and weekends. The team of two who just started their first project.
                <br /><br />
                This is not a platform for games that already succeeded. It&apos;s for the work that&apos;s still happening.
              </p>
            </section>
          </div>

          {/* Footer */}
          <footer id="jobs" className="mt-auto border-t border-gray-100 bg-gray-50/50 px-8 py-12 md:px-16 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2 lg:col-span-2 space-y-4">
                <div className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
                  Glyph<span className="text-indigo-600">°</span>
                </div>
                <p className="text-gray-500 max-w-xs">Always free for developers. Your home base before launch.</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">Platform</h4>
                <ul className="space-y-2 text-gray-500">
                  <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features</a></li>
                  <li><a href="#community" className="hover:text-indigo-600 transition-colors">Community</a></li>
                  <li><a href="#events" className="hover:text-indigo-600 transition-colors">Events</a></li>
                  <li><a href="#jobs" className="hover:text-indigo-600 transition-colors">Jobs</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company</h4>
                <ul className="space-y-2 text-gray-500">
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Press</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
              <div className="space-y-3 col-span-2 md:col-span-4 lg:col-span-1">
                <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">Connect</h4>
                <div className="flex gap-4 text-gray-400">
                  <a href="#" aria-label="X" className="hover:text-gray-900 transition-colors"><X className="h-5 w-5" /></a>
                  <a href="#" aria-label="Discord" className="hover:text-gray-900 transition-colors"><MessageCircle className="h-5 w-5" /></a>
                  <a href="#" aria-label="GitHub" className="hover:text-gray-900 transition-colors"><GitBranch className="h-5 w-5" /></a>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200/60 text-xs text-gray-400 font-mono">
              <p>© 2026 Glyph. Built for indie developers.</p>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                All systems operational
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
