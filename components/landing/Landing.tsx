'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  X,
  Menu,
  MessageCircle,
  FileText,
  Joystick,
  MapPin,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react'

/*
  Glyph landing — rebuilt ground-up.
  Direction: warm editorial "paper" canvas, playful game-dev console energy,
  highlighter-sticker accents on the words that carry the pitch, and a
  monochrome bento grid that spends its one bit of color on the warm accent.
  The signature gesture is the handheld-console product window in the hero.
*/

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
]

// The platforms an indie dev juggles today — shown crossed out, then replaced by Glyph.
const SCATTERED = ['Reddit', 'Discord', 'Twitter / X', 'itch.io', 'ArtStation', 'LinkedIn', 'Meetup']

const STEPS = [
  {
    n: '01',
    title: 'Claim your page',
    desc: 'Skills, engine, current project. Your developer page is public and searchable from the first day.',
  },
  {
    n: '02',
    title: 'Build in public',
    desc: 'Post devlogs, request playtesters, browse your city’s events, and find people to build with.',
  },
  {
    n: '03',
    title: 'Arrive with a crowd',
    desc: 'Collect real feedback and grow an audience so you launch to a community already behind you.',
  },
]

// A highlighter "sticker" behind a run of text — the page's recurring accent gesture.
function Mark({
  children,
  tone = 'accent',
}: {
  children: React.ReactNode
  tone?: 'accent' | 'lav' | 'green'
}) {
  const bg =
    tone === 'accent'
      ? 'bg-accent-subtle text-accent-hover'
      : tone === 'lav'
        ? 'bg-info-subtle text-info'
        : 'bg-success-subtle text-success'
  return <span className={`mark-hl ${bg}`}>{children}</span>
}

// The hero's centerpiece: a stylized handheld console whose "screen" is a real Glyph project page.
function ConsoleWindow() {
  return (
    <div className="relative">
      {/* floating tester chips — small proof-of-life dots around the device */}
      <div className="absolute -left-3 top-10 z-20 hidden rounded-pill border border-line-subtle bg-white px-3 py-1.5 text-[11px] font-medium text-fg shadow-[var(--elev-popover)] sm:flex sm:items-center sm:gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success" /> 3 testers joined
      </div>
      <div className="absolute -right-2 bottom-16 z-20 hidden rounded-pill border border-line-subtle bg-white px-3 py-1.5 text-[11px] font-medium text-fg shadow-[var(--elev-popover)] sm:flex sm:items-center sm:gap-1.5">
        <MessageCircle className="h-3 w-3 text-accent" /> Devlog #14
      </div>

      {/* device body */}
      <div className="rounded-[2rem] border border-line-strong/60 bg-surface-muted p-3 shadow-[var(--elev-dialog)]">
        <div className="rounded-[1.4rem] border border-line-subtle bg-white overflow-hidden">
          {/* screen chrome */}
          <div className="flex items-center gap-1.5 border-b border-line-subtle bg-surface-muted/70 px-4 h-8">
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="ml-2 font-mono text-[10px] text-fg-muted">glyph.dev/p/mira/hollow-tide</span>
          </div>

          {/* project identity */}
          <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-fg text-xs font-semibold text-white">HT</div>
              <div>
                <p className="text-sm font-semibold text-fg leading-tight">Hollow Tide</p>
                <p className="font-mono text-[10px] text-fg-muted">Mira Kasprzak · Godot</p>
              </div>
            </div>
            <span className="rounded-pill bg-accent-subtle px-2.5 py-1 text-[10px] font-semibold text-accent-hover">Alpha</span>
          </div>

          {/* pixel screenshot */}
          <div className="px-4 pt-3">
            <p className="font-mono text-[10px] text-fg-muted mb-2">DEVLOG #14 · 3 DAYS AGO</p>
            <svg viewBox="0 0 400 168" className="w-full rounded-lg border border-line-subtle" role="img" aria-label="Pixel-art platformer scene: a character mid-jump between floating platforms">
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fdf2ea" />
                  <stop offset="100%" stopColor="#f3d9c4" />
                </linearGradient>
              </defs>
              <rect width="400" height="168" fill="url(#sky)" />
              <circle cx="336" cy="34" r="16" fill="#f3d9c4" />
              <rect x="0" y="140" width="400" height="28" fill="#181925" />
              <rect x="44" y="118" width="60" height="10" rx="2" fill="#e48b59" />
              <rect x="170" y="92" width="52" height="10" rx="2" fill="#e48b59" />
              <rect x="280" y="114" width="60" height="10" rx="2" fill="#e48b59" />
              <g transform="translate(198,70)">
                <rect x="-6" y="4" width="12" height="14" rx="2" fill="#181925" />
                <circle cx="0" cy="-3" r="6.5" fill="#181925" />
              </g>
            </svg>
            <p className="mt-3 text-[13px] leading-relaxed text-fg-secondary">Reworked the dash-attack hitbox and added screen shake.</p>
          </div>

          {/* playtest bar */}
          <div className="mt-3 flex items-center justify-between border-t border-line-subtle bg-surface-muted/60 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-fg">Playtest open</p>
              <p className="font-mono text-[10px] text-fg-muted">Combat feel · 20 min</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <span className="h-5 w-5 rounded-full border-2 border-white bg-accent-line" />
                <span className="h-5 w-5 rounded-full border-2 border-white bg-accent" />
                <span className="h-5 w-5 rounded-full border-2 border-white bg-accent-hover" />
              </div>
              <span className="text-xs font-semibold text-accent-hover">Join</span>
            </div>
          </div>
        </div>

        {/* device controls */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="grid grid-cols-3 grid-rows-3 gap-0.5">
            <span />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-line-strong" />
            <span />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-fg" />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-line-strong" />
            <span />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-line-strong" />
            <span />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-accent" />
            <span className="h-3.5 w-3.5 rounded-full bg-fg" />
          </div>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: FileText,
    title: 'Project pages & devlogs',
    desc: 'Document your build in public. Structured updates, a real history, and an audience before the game ships.',
    span: 'sm:col-span-2',
    dark: true,
  },
  {
    icon: Joystick,
    title: 'Structured playtesting',
    desc: 'Request testers and collect feedback by category — gameplay, controls, UI, difficulty.',
    span: '',
  },
  {
    icon: MapPin,
    title: 'Local events & jams',
    desc: 'City meetups and game jams with RSVP and demo slots. Find your scene.',
    span: '',
  },
  {
    icon: Users,
    title: 'Collaboration board',
    desc: 'Full-time, freelance, rev-share and volunteer roles — each tied to a real project page.',
    span: 'sm:col-span-2',
  },
]

export function Landing({ isAuthed }: { isAuthed: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
    <div className="min-h-screen bg-paper bg-dotgrid font-sans text-fg">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-line-subtle/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-1 text-xl font-semibold tracking-tight text-fg">
            Glyph<span className="text-accent leading-none">°</span>
          </div>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-fg-secondary transition-colors hover:text-fg">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {isAuthed ? (
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-pill bg-fg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-fg-secondary transition-colors hover:text-fg">
                  Log in
                </Link>
                <Link href="/signup" className="inline-flex items-center justify-center rounded-pill bg-fg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
                  Sign up
                </Link>
              </>
            )}
          </div>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-11 w-11 -mr-2 items-center justify-center text-fg-secondary transition-colors hover:text-fg lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-line-subtle bg-paper px-5 pb-6 sm:px-8 lg:hidden">
            <nav className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-line-subtle py-4 text-sm font-medium text-fg-secondary transition-colors hover:text-fg"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-3">
              {isAuthed ? (
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-pill bg-fg px-5 py-3.5 text-sm font-medium text-white">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center rounded-pill border border-line px-5 py-3.5 text-sm font-medium text-fg-secondary">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center rounded-pill bg-fg px-5 py-3.5 text-sm font-medium text-white">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* ── Hero ── */}
        <section className="grid items-center gap-12 pt-14 pb-16 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24">
          <div className="reveal-hero reveal-hero-1">
            <span className="pixel-kicker inline-flex items-center gap-2 rounded-pill border border-accent-line bg-accent-subtle px-3 py-1 text-[11px] font-medium text-accent-hover">
              <Sparkles className="h-3 w-3" /> Always free for developers
            </span>
            <h1 className="mt-6 text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
              The home base for
              <br className="hidden sm:block" /> games <Mark>still in</Mark> the{' '}
              <Mark tone="lav">making</Mark>.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-fg-secondary sm:text-lg">
              For developers who are still building. Post devlogs, find playtesters, meet other indies, and grow an audience — all in one place, before you launch.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-7 py-3.5 text-sm font-semibold text-fg-on-accent transition-colors hover:bg-accent-hover">
                Create your profile <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-secondary transition-colors hover:text-fg">
                See how it works
              </a>
            </div>
          </div>
          <div className="reveal-hero reveal-hero-5 mx-auto w-full max-w-md lg:mx-0">
            <ConsoleWindow />
          </div>
        </section>

        {/* ── Scattered platforms → one Glyph ── */}
        <section className="border-y border-line-subtle py-8">
          <p className="pixel-kicker mb-5 text-center text-[11px] text-fg-muted">
            Your workflow today lives in seven different tabs
          </p>
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee items-center gap-3">
              {[...SCATTERED, ...SCATTERED].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="whitespace-nowrap rounded-pill border border-line-subtle bg-white/70 px-4 py-2 text-sm font-medium text-fg-muted line-through decoration-danger/50"
                >
                  {name}
                </span>
              ))}
            </div>
            {/* edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper to-transparent" />
          </div>
          <p className="mt-5 text-center text-sm text-fg-secondary">
            <span className="font-semibold text-fg">Glyph replaces all of them</span> with one page built for a game developer’s pre-launch workflow.
          </p>
        </section>

        {/* ── Features bento ── */}
        <section id="features" className="scroll-mt-20 py-16 sm:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="pixel-kicker mb-3 text-[11px] text-accent-hover">What you get</p>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Everything you need before launch. Nothing you don’t.
            </h2>
          </div>
          <div className="grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* identity card — spans full width on lg, leads the grid */}
            <div className="group flex flex-col justify-between rounded-panel border border-line-subtle bg-white p-7 transition-shadow hover:shadow-[var(--elev-raised)] sm:col-span-2 lg:col-span-1">
              <div>
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-accent-subtle text-accent-hover">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">Developer profile</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  Your public identity. Skills, engine, tools, current project, and devlog history — one link that says everything.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent-hover">
                See an example <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>

            {FEATURES.map(({ icon: Icon, title, desc, span, dark }) => (
              <div
                key={title}
                className={`group flex flex-col justify-between rounded-panel border p-7 transition-shadow ${span} ${
                  dark
                    ? 'border-transparent bg-surface-inverse text-fg-on-inverse'
                    : 'border-line-subtle bg-white hover:shadow-[var(--elev-raised)]'
                }`}
              >
                <div>
                  <div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${dark ? 'bg-white/10 text-white' : 'bg-accent-subtle text-accent-hover'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={`text-lg font-semibold tracking-tight ${dark ? 'text-white' : ''}`}>{title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-fg-on-inverse-secondary' : 'text-fg-muted'}`}>{desc}</p>
                </div>
              </div>
            ))}

            {/* publisher discovery — closes the grid */}
            <div className="group flex flex-col justify-between rounded-panel border border-line-subtle bg-white p-7 transition-shadow hover:shadow-[var(--elev-raised)]">
              <div>
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-accent-subtle text-accent-hover">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">Publisher discovery</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  A profile publishers can actually evaluate — real devlog history, playtest results, and team makeup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="pixel-kicker mb-3 text-[11px] text-accent-hover">How it works</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Up and running in minutes.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-panel border border-line-subtle bg-white p-7">
                <span className="font-mono text-2xl font-semibold text-accent">{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Always free ── */}
        <section id="pricing" className="scroll-mt-20 pb-16 sm:pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-surface-inverse px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-[90px]" />
            <div className="relative mx-auto max-w-2xl">
              <p className="pixel-kicker mb-4 text-[11px] text-accent-line">The model, not a trial</p>
              <h2 className="text-3xl font-semibold tracking-tight text-white text-balance sm:text-4xl">
                Individual developers <Mark>never pay</Mark>.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fg-on-inverse-secondary">
                Profiles, project pages, devlogs, playtesting, events, and the collaboration board are permanently free. Glyph is funded by studios and publishers — not the people it’s built to serve.
              </p>
              <Link href="/signup" className="mt-8 inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-8 py-4 text-sm font-semibold text-fg-on-accent transition-colors hover:bg-accent-hover">
                Create free profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-line-subtle bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 text-lg font-semibold tracking-tight text-fg">
                Glyph<span className="text-accent">°</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-fg-muted">Your home base before launch. Always free for developers.</p>
            </div>
            <div>
              <h4 className="pixel-kicker mb-3 text-[10px] text-fg-muted">Platform</h4>
              <ul className="space-y-2 text-sm text-fg-secondary">
                <li><a href="#features" className="transition-colors hover:text-accent-hover">Features</a></li>
                <li><a href="#how-it-works" className="transition-colors hover:text-accent-hover">How it works</a></li>
                <li><a href="#pricing" className="transition-colors hover:text-accent-hover">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="pixel-kicker mb-3 text-[10px] text-fg-muted">Browse</h4>
              <ul className="space-y-2 text-sm text-fg-secondary">
                <li><Link href="/explore" className="transition-colors hover:text-accent-hover">Explore</Link></li>
                <li><Link href="/collaborate" className="transition-colors hover:text-accent-hover">Collaborate</Link></li>
                <li><Link href="/playtests/browse" className="transition-colors hover:text-accent-hover">Playtests</Link></li>
                <li><Link href="/publishers" className="transition-colors hover:text-accent-hover">Publishers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="pixel-kicker mb-3 text-[10px] text-fg-muted">Account</h4>
              <ul className="space-y-2 text-sm text-fg-secondary">
                <li><Link href="/login" className="transition-colors hover:text-accent-hover">Log in</Link></li>
                <li><Link href="/signup" className="transition-colors hover:text-accent-hover">Sign up</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-line/60 pt-6 text-xs text-fg-muted">
            © 2026 Glyph. Built for indie developers.
          </div>
        </div>
      </footer>
    </div>
  )
}
