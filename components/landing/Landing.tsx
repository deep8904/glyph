'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  UserSquare,
  FileText,
  Joystick,
  MapPin,
  Users,
  Building2,
  Code2,
  ArrowRight,
  X,
  Menu,
  MessageCircle,
  GitBranch,
} from 'lucide-react'

function useLenisSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])
}

function useGsapReveal(scope: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!scope.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const targets = gsap.utils.toArray<HTMLElement>('.reveal')

      if (reduceMotion) {
        gsap.set(targets, { opacity: 1, y: 0 })
        return
      }

      ScrollTrigger.batch(targets, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            overwrite: true,
          }),
      })
    }, scope)

    return () => ctx.revert()
  }, [scope])
}

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#community', label: 'Community' },
  { href: '#events', label: 'Events' },
  { href: '#jobs', label: 'Jobs' },
]

const METRICS = [
  { value: '250K', sublabel: 'Active indie developers globally' },
  { value: '8,554', sublabel: 'Indie games on Steam in 2024 — highest ever' },
  { value: '48%', sublabel: 'Of all Steam full-game revenue' },
  { value: '$10.8B', sublabel: 'Projected indie market size by 2031' },
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

// One coherent product moment — a real Glyph project page — rendered densely
// enough to read as an actual screenshot, not a wireframe. Static, no tabs:
// project identity, a devlog entry, and its playtest status, together.
function HeroProductWindow() {
  return (
    <div className="rounded-[1.75rem] bg-white border border-gray-100 shadow-2xl shadow-gray-300/40 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 h-9 px-4 bg-gray-50/80 border-b border-gray-100">
        <span className="h-2 w-2 rounded-full bg-gray-200" />
        <span className="h-2 w-2 rounded-full bg-gray-200" />
        <span className="h-2 w-2 rounded-full bg-gray-200" />
        <span className="ml-3 text-[11px] text-gray-400">glyph.dev/p/mira/hollow-tide</span>
      </div>

      {/* Project identity */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-display font-semibold text-sm">HT</div>
          <div>
            <p className="text-sm font-medium text-gray-900">Hollow Tide</p>
            <p className="text-xs text-gray-400">by Mira Kasprzak · Godot</p>
          </div>
        </div>
        <span className="rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-medium px-2.5 py-1">Alpha</span>
      </div>

      {/* Devlog entry */}
      <div className="px-5 pt-4 pb-4">
        <p className="text-[11px] text-gray-400 mb-2.5">Devlog #14 · 3 days ago</p>
        <svg viewBox="0 0 400 190" className="w-full rounded-xl border border-gray-100 mb-3" role="img" aria-label="Screenshot from a 2D platformer showing a character mid-jump between floating platforms">
          <defs>
            <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eef2ff" />
              <stop offset="100%" stopColor="#e0e7ff" />
            </linearGradient>
          </defs>
          <rect width="400" height="190" fill="url(#heroSky)" />
          <circle cx="335" cy="38" r="18" fill="#c7d2fe" />
          <path d="M0 128 Q60 104 130 124 T260 118 T400 130 V190 H0 Z" fill="#c7d2fe" opacity="0.6" />
          <rect x="0" y="156" width="400" height="34" fill="#312e81" />
          <rect x="40" y="130" width="64" height="12" rx="3" fill="#4f46e5" />
          <rect x="168" y="100" width="54" height="12" rx="3" fill="#4f46e5" />
          <rect x="276" y="126" width="64" height="12" rx="3" fill="#4f46e5" />
          <g transform="translate(196,74)">
            <rect x="-7" y="5" width="14" height="15" rx="3" fill="#1e1b4b" />
            <circle cx="0" cy="-2" r="7.5" fill="#1e1b4b" />
          </g>
        </svg>
        <p className="text-sm text-gray-700 leading-relaxed">Reworked the dash-attack hitbox and added screen shake.</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
          <span>12 comments</span>
          <span>34 views</span>
        </div>
      </div>

      {/* Playtest status */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
        <div>
          <p className="text-xs font-medium text-gray-900">Playtest request</p>
          <p className="text-[11px] text-gray-400">Combat feel + boss pacing · 20 min</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="h-6 w-6 rounded-full bg-indigo-200 border-2 border-white" />
            <div className="h-6 w-6 rounded-full bg-indigo-400 border-2 border-white" />
            <div className="h-6 w-6 rounded-full bg-indigo-600 border-2 border-white" />
          </div>
          <span className="text-xs font-medium text-indigo-600">7 signed up</span>
        </div>
      </div>
    </div>
  )
}

export function Landing({ isAuthed }: { isAuthed: boolean }) {
  const scopeRef = useRef<HTMLDivElement>(null)
  useGsapReveal(scopeRef)
  useLenisSmoothScroll()
  const [menuOpen, setMenuOpen] = useState(false)

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <div ref={scopeRef} className="min-h-screen relative overflow-x-hidden font-sans">
      {/* Backdrop */}
      <div className="fixed inset-0 z-0 bg-plasma bg-grain pointer-events-none" />

      {/* Main floating panel */}
      <main className="relative z-10 w-full max-w-[1760px] mx-auto px-3 sm:px-6 md:px-8 xl:px-12 py-6 md:py-10 min-h-screen flex flex-col">
        <div className="flex-1 bg-white rounded-[2.5rem] panel-shadow overflow-hidden flex flex-col border border-white relative">

          {/* Header */}
          <header className="border-b border-gray-100/50 reveal-hero reveal-hero-1">
            <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-12 md:py-8">
              {/* Logo — always visible */}
              <div className="flex items-center gap-1 text-xl font-display font-semibold tracking-tighter text-gray-900">
                Glyph<span className="text-indigo-600 leading-none">°</span>
              </div>
              {/* Desktop nav links — hidden on mobile */}
              <nav className="hidden lg:flex items-center gap-10 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                {NAV_LINKS.map((l) => (
                  <a key={l.href} href={l.href} className="hover:text-gray-900 transition-colors">{l.label}</a>
                ))}
              </nav>
              {/* Desktop auth actions — hidden on mobile */}
              <div className="hidden lg:flex items-center gap-6">
                {isAuthed ? (
                  <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300">
                    Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
                    <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300">Sign Up</Link>
                  </>
                )}
              </div>
              {/* Mobile hamburger — hidden on desktop */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="lg:hidden flex h-11 w-11 -mr-2 items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile dropdown — in normal flow (pushes content down), fully opaque, no overlap */}
            {menuOpen && (
              <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-5 sm:px-8 pb-6">
                <nav className="flex flex-col">
                  {NAV_LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="py-4 text-sm font-medium uppercase tracking-widest text-gray-600 hover:text-gray-900 border-b border-gray-100 transition-colors"
                    >
                      {l.label}
                    </a>
                  ))}
                </nav>
                <div className="border-t border-gray-100 pt-4 mt-2 flex flex-col gap-3">
                  {isAuthed ? (
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-3.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300">
                      Dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300">Log in</Link>
                      <Link href="/signup" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300">Sign Up</Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </header>

          <div className="px-5 sm:px-8 md:px-16 lg:px-24 pt-8 sm:pt-10 lg:pt-14 pb-16 sm:pb-24 space-y-20 sm:space-y-28 lg:space-y-32">

            {/* Hero */}
            <section className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-8 items-start">
              <div className="text-left lg:pt-2">
                <h1 className="reveal-hero reveal-hero-2 text-[40px] sm:text-6xl lg:text-[68px] text-gray-900 leading-[0.98] font-display tracking-tighter text-balance mb-5">
                  <span className="font-light">Your</span> <span className="font-semibold">home base</span>
                  <br />
                  <span className="font-semibold text-indigo-600">before launch.</span>
                </h1>
                <p className="reveal-hero reveal-hero-3 text-base md:text-lg text-gray-500 leading-relaxed max-w-md text-balance mb-8">
                  For developers who are still building. Post devlogs, find playtesters, and meet other indies — all in one place, always free.
                </p>
                <div className="reveal-hero reveal-hero-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
                    Create Your Profile
                  </Link>
                  <a href="#how-it-works" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    See how it works <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Product window — one coherent moment: a real project page */}
              <div className="reveal-hero reveal-hero-5 hidden lg:block lg:pl-6">
                <HeroProductWindow />
              </div>
            </section>

            {/* Problem */}
            <section className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="reveal space-y-6">
                <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-gray-900 text-balance">
                  Your workflow is scattered across 7 platforms. None of them are built for you.
                </h2>
                <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                  Indie developers currently split across Reddit, Discord, Twitter/X, itch.io, ArtStation, LinkedIn, and Meetup. Each does one thing. None of them understands a game developer&apos;s pre-launch workflow.
                  <br /><br />
                  The result: isolation and lack of structured feedback.
                </p>
              </div>
              <div className="reveal relative p-1 rounded-3xl bg-linear-to-b from-gray-100 to-white">
                <div className="bg-white rounded-[22px] p-8 sm:p-10 md:p-14 shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col items-center justify-center text-center">
                  <span className="text-6xl sm:text-7xl font-light tracking-tighter text-gray-900 mb-4">7</span>
                  <p className="text-sm text-gray-500 uppercase tracking-widest leading-relaxed">
                    platforms devs juggle <br /> before Glyph.
                  </p>
                </div>
              </div>
            </section>

            {/* Market stats */}
            <section id="community" className="space-y-10">
              <h2 className="reveal text-2xl md:text-3xl font-display font-medium tracking-tight text-gray-900 max-w-xl">
                The indie market is the biggest it has ever been. The infrastructure hasn&apos;t caught up.
              </h2>
              <dl className="reveal grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-gray-100 border-y border-gray-100">
                {METRICS.map((m) => (
                  <div key={m.sublabel} className="flex flex-col gap-2 py-6 px-6 first:pl-0">
                    <dd className="text-3xl md:text-4xl font-light tracking-tight text-gray-900">{m.value}</dd>
                    <dt className="text-sm text-gray-500 leading-snug">{m.sublabel}</dt>
                  </div>
                ))}
              </dl>
            </section>

            {/* Features bento */}
            <section id="features" className="space-y-12 bg-gray-50/50 -mx-5 sm:-mx-8 md:-mx-16 lg:-mx-24 px-5 sm:px-8 md:px-16 lg:px-24 py-16 sm:py-20 md:py-24 border-y border-gray-100">
              <div className="reveal max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-gray-900 mb-4">
                  Everything you need before launch. Nothing you don&apos;t.
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(260px,auto)] gap-4 md:gap-6">
                {/* Developer Profile — 2 col */}
                <div className="group flex flex-col p-8 rounded-3xl bg-linear-to-br from-white to-gray-50/80 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal sm:col-span-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <UserSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Developer Profile</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">Your public identity. Skills, engine, tools, current project, devlog history, and collaboration availability — one link that says everything.</p>
                  <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    View Example Profile <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                {/* Devlogs — 2 row, dark */}
                <div className="group flex flex-col p-8 rounded-3xl bg-indigo-900 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] transition-all duration-300 reveal lg:row-span-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white mb-6 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-white tracking-tight mb-3">Project Pages &amp; Devlogs</h3>
                  <p className="text-sm text-indigo-200/80 leading-relaxed max-w-sm flex-1">Document your build in public. Post structured updates, build an audience before your game ships, and keep a full history of your development process.</p>
                  <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    Start a Devlog <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                {/* Playtesting */}
                <div className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <Joystick className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Structured Playtesting</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">Request testers and collect feedback by category — gameplay, controls, UI, difficulty. Track how your game improves over time.</p>
                </div>
                {/* Events */}
                <div className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Local Events &amp; Showcases</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">City-based meetups and game jams with RSVP and demo slots. Find your local developer community.</p>
                </div>
                {/* Collaboration — 2 col */}
                <div className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal sm:col-span-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Collaboration Board</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">Full-time, freelance, rev-share, and volunteer roles — every listing linked to a real project page so you know exactly what you&apos;re joining.</p>
                </div>
                {/* Publisher discovery */}
                <div className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 reveal">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight mb-3">Publisher Discovery</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm flex-1">Studios get a profile publishers can actually evaluate — real devlog history, playtesting results, and team makeup.</p>
                </div>
              </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
              <div className="reveal text-center">
                <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-gray-900">Up and running in minutes.</h2>
              </div>
              <div className="relative space-y-8 sm:space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {STEPS.map((item, i) => (
                  <div key={item.step} className={`reveal relative flex items-center justify-between md:justify-normal group ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-50 shrink-0 md:order-1 shadow-sm z-10 ${i % 2 === 1 ? 'md:translate-x-1/2' : 'md:-translate-x-1/2'}`}>
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
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
            <section id="events" className="reveal relative overflow-hidden rounded-[2.5rem] bg-gray-900 text-white p-8 sm:p-12 md:p-16 lg:p-20 text-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white text-balance">
                  Individual developers never pay. <br className="hidden md:block" />
                  <span className="text-gray-400">That&apos;s not a trial. That&apos;s the model.</span>
                </h2>
                <p className="text-gray-400 leading-relaxed max-w-2xl mx-auto text-base md:text-lg">
                  Developer profiles, project pages, devlogs, playtesting, local events, and the collaboration board are permanently free. Glyph is funded by studios, publishers, and ecosystem companies — not by the people it&apos;s built to serve.
                </p>
                <div className="pt-4">
                  <Link href="/signup" className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    Create Free Profile
                  </Link>
                </div>
              </div>
            </section>

            {/* Community */}
            <section className="reveal max-w-3xl mx-auto text-center space-y-6 pb-12">
              <Code2 className="h-10 w-10 text-gray-300 mb-4 mx-auto" />
              <h2 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-gray-900">
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
          <footer id="jobs" className="mt-auto border-t border-gray-100 bg-gray-50/50 px-5 py-10 sm:px-8 sm:py-12 md:px-16 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
              <div className="sm:col-span-2 space-y-4">
                <div className="flex items-center gap-1 text-lg font-display font-semibold tracking-tighter text-gray-900">
                  Glyph<span className="text-indigo-600">°</span>
                </div>
                <p className="text-gray-500 max-w-xs">Always free for developers. Your home base before launch.</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Platform</h4>
                <ul className="space-y-2 text-gray-500">
                  <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features</a></li>
                  <li><a href="#community" className="hover:text-indigo-600 transition-colors">Community</a></li>
                  <li><a href="#events" className="hover:text-indigo-600 transition-colors">Events</a></li>
                  <li><a href="#jobs" className="hover:text-indigo-600 transition-colors">Jobs</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company</h4>
                <ul className="space-y-2 text-gray-500">
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Press</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
              <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Connect</h4>
                <div className="flex gap-4 text-gray-400">
                  <a href="#" aria-label="X" className="flex h-9 w-9 items-center justify-center hover:text-gray-900 transition-colors"><X className="h-5 w-5" /></a>
                  <a href="#" aria-label="Discord" className="flex h-9 w-9 items-center justify-center hover:text-gray-900 transition-colors"><MessageCircle className="h-5 w-5" /></a>
                  <a href="#" aria-label="GitHub" className="flex h-9 w-9 items-center justify-center hover:text-gray-900 transition-colors"><GitBranch className="h-5 w-5" /></a>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-200/60 text-xs text-gray-400 text-center md:text-left">
              <p>© 2026 Glyph. Built for indie developers.</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
