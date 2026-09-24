'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X, Menu } from 'lucide-react'
import { ProjectMark } from '@/components/project/ProjectMark'
import { DevlogRow } from '@/components/devlog/DevlogRow'
import { Button } from '@/components/ui/Button'

// This page is generated from the finished product's own language, not a marketing template:
// flat canvas (no gradient backdrop, no floating card chrome), the same type/token system as the
// signed-in app, and a real fragment of the actual product — Nova Calder's Emberfall Keep, the
// demo project used throughout Glyph's own design review — rendered with the live ProjectMark and
// DevlogRow components, not a hand-drawn mockup. Its links go to the real page.

const NAV_LINKS = [
  { href: '#loop', label: 'How it works' },
  { href: '#free', label: 'Pricing' },
]

const LOOP = [
  { n: '01', title: 'Build', desc: 'Give your game a real page: identity, stage, and what it is — before it has a cover, a trailer, or a store listing.' },
  { n: '02', title: 'Document', desc: 'Post devlogs as you go. The dated record of the work becomes the thing people follow.' },
  { n: '03', title: 'Involve', desc: 'Bring in playtesters for structured feedback, and collaborators for roles you can’t fill alone.' },
  { n: '04', title: 'Discover', desc: 'Find other developers, projects, jams and events — Glyph groups what’s here by what you can do with it.' },
  { n: '05', title: 'Grow', desc: 'A professional identity built from the actual work, not a follower count.' },
]

const HERO_PROJECT = {
  username: 'demo-nova',
  authorName: 'Nova Calder',
  projectTitle: 'Emberfall Keep',
  projectSlug: 'emberfall-keep',
}
// Fixed ISO timestamps, not computed from Date.now() — this is a Client Component, so a
// module-scope Date.now() call re-evaluates on the server render and again on client hydration a
// few milliseconds apart, and DevlogRow prints the exact dateTime attribute: a real hydration
// mismatch, not a cosmetic one.
const HERO_DEVLOGS = [
  {
    title: "Alpha Build is Live — Here's What Changed",
    slug: 'alpha-build-live',
    publishedAt: '2026-09-10T16:00:00.000Z',
    preview: 'After 40 days of development, the first three floors of Emberfall Keep are playable. No account required — just click and go on itch.io.',
  },
  {
    title: 'Combat Redesign — Why We Threw Away 3 Months of Work',
    slug: 'combat-redesign-threw-away-3-months',
    publishedAt: '2026-09-05T16:00:00.000Z',
    preview: 'The original combat system was stamina-based with a momentum meter that charged on dodges and depleted on hits. Sounds cool. Felt awful.',
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
    <div className="min-h-dvh bg-canvas font-sans text-fg">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="reveal-hero reveal-hero-1 text-h3 font-semibold tracking-tight text-fg">
            Glyph<span className="text-accent">°</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-small font-medium text-fg-secondary hover:text-fg">{l.label}</a>
            ))}
            <Link href="/explore" className="text-small font-medium text-fg-secondary hover:text-fg">Explore</Link>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            {isAuthed ? (
              <Button asChild variant="primary" size="sm"><Link href="/dashboard">Dashboard <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" /></Link></Button>
            ) : (
              <>
                <Link href="/login" className="text-small font-medium text-fg-secondary hover:text-fg">Log in</Link>
                <Button asChild variant="primary" size="sm"><Link href="/signup">Sign up</Link></Button>
              </>
            )}
          </div>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex min-h-11 min-w-11 items-center justify-center text-fg-secondary hover:text-fg md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-line bg-surface px-4 pb-6 md:hidden">
            <nav className="flex flex-col">
              {[...NAV_LINKS, { href: '/explore', label: 'Explore' }].map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="border-b border-line-subtle py-4 text-small font-medium text-fg-secondary hover:text-fg">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-3">
              {isAuthed ? (
                <Button asChild variant="primary" onClick={() => setMenuOpen(false)}><Link href="/dashboard">Dashboard</Link></Button>
              ) : (
                <>
                  <Button asChild variant="secondary" onClick={() => setMenuOpen(false)}><Link href="/login">Log in</Link></Button>
                  <Button asChild variant="primary" onClick={() => setMenuOpen(false)}><Link href="/signup">Sign up</Link></Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main-content">
        <div className="mx-auto max-w-6xl space-y-24 px-4 py-16 sm:px-6 sm:py-20 lg:space-y-32 lg:py-28">
          {/* Hero */}
          <section className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="reveal-hero reveal-hero-2">
              <h1 className="text-display font-semibold tracking-[-0.02em] text-fg sm:text-[3.25rem] sm:leading-[1.05]">
                The professional home for a game <span className="text-accent">while it&rsquo;s being built.</span>
              </h1>
              <p className="mt-5 max-w-md text-body leading-relaxed text-fg-secondary">
                Post devlogs, find playtesters, and meet other developers — one place for the work that happens before launch. Always free for developers.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button asChild variant="primary" size="lg"><Link href="/signup">Create your profile</Link></Button>
                <a href="#loop" className="inline-flex items-center gap-1.5 text-small font-medium text-fg-secondary hover:text-fg">
                  See how it works <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
                </a>
              </div>
            </div>

            {/* A real fragment of the product — the same ProjectMark and DevlogRow used
                throughout Glyph, showing the actual demo project. The links work. */}
            <div className="reveal-hero reveal-hero-3">
              <p className="mb-2 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">A project page, as it looks on Glyph</p>
              <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-raised">
                <Link href={`/p/${HERO_PROJECT.username}/${HERO_PROJECT.projectSlug}`}>
                  <ProjectMark
                    title={HERO_PROJECT.projectTitle}
                    id={HERO_PROJECT.projectSlug}
                    engine="godot"
                    genre="Action-RPG"
                    stage="alpha"
                    className="rounded-none border-0"
                  />
                </Link>
                <div className="px-5 pb-2 pt-4">
                  <p className="font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Development history</p>
                </div>
                <ul className="divide-y divide-line-subtle border-t border-line-subtle px-5">
                  {HERO_DEVLOGS.map((d) => (
                    <DevlogRow
                      key={d.slug}
                      variant="listing"
                      devlog={{ ...d, projectTitle: HERO_PROJECT.projectTitle, projectSlug: HERO_PROJECT.projectSlug, username: HERO_PROJECT.username, authorName: HERO_PROJECT.authorName, avatarUrl: null }}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* The problem, stated plainly — no invented stat */}
          <section className="max-w-2xl">
            <h2 className="text-h1 font-semibold tracking-tight text-fg text-balance">
              Your workflow is scattered across half a dozen platforms. None of them were built for a developer who is still building.
            </h2>
            <p className="mt-4 text-body leading-relaxed text-fg-secondary">
              Reddit, Discord, itch.io, X, a spreadsheet of playtesters — each does one thing. Glyph is the one place that understands the shape of pre-launch work: a project page, a dated record of progress, and the people who can help.
            </p>
          </section>

          {/* The core loop — an editorial list, not a bento grid or icon bubbles */}
          <section id="loop">
            <h2 className="text-h1 font-semibold tracking-tight text-fg">How it works</h2>
            <ul className="mt-8 divide-y divide-line-subtle border-y border-line-subtle">
              {LOOP.map((item) => (
                <li key={item.n} className="flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:gap-8">
                  <span className="shrink-0 font-mono text-small text-fg-muted sm:w-10">{item.n}</span>
                  <div className="min-w-0">
                    <h3 className="text-h3 font-semibold text-fg">{item.title}</h3>
                    <p className="mt-1 max-w-2xl text-body leading-relaxed text-fg-secondary">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Always free */}
          <section id="free" className="rounded-panel bg-fg p-8 text-center sm:p-14">
            <h2 className="text-h1 font-semibold tracking-tight text-white text-balance sm:text-[2.5rem]">
              Individual developers never pay.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-body leading-relaxed text-white/70">
              Profiles, project pages, devlogs, playtesting, events and the collaboration board are permanently free. Glyph is funded by studios and publishers — not by the developers it exists to serve.
            </p>
            <div className="mt-8">
              <Button asChild variant="primary" size="lg" className="bg-white text-fg hover:bg-white/90"><Link href="/signup">Create your free profile</Link></Button>
            </div>
          </section>

          {/* Who this is for — same section pattern as "How it works": a kicker, then a lead
              statement at the same weight as every other section head, so this reads as a closing
              beat rather than an orphaned trailing paragraph. */}
          <section className="max-w-2xl border-t border-line-subtle pt-16">
            <p className="font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Who this is for</p>
            <h2 className="mt-2 text-h1 font-semibold tracking-tight text-fg text-balance">
              The developer who is still in the middle of it — the solo dev working nights and weekends, the team of two on their first project.
            </h2>
            <p className="mt-4 text-body leading-relaxed text-fg-secondary">This isn&rsquo;t a platform for games that already shipped. It&rsquo;s for the work that&rsquo;s still happening.</p>
          </section>
        </div>

        <footer className="border-t border-line bg-surface-muted">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div className="col-span-2">
                <span className="text-h3 font-semibold tracking-tight text-fg">Glyph<span className="text-accent">°</span></span>
                <p className="mt-2 max-w-xs text-small text-fg-secondary">Always free for developers. The professional home for a game while it&rsquo;s being built.</p>
              </div>
              <div>
                <h4 className="font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Browse</h4>
                <ul className="mt-3 space-y-2 text-small text-fg-secondary">
                  <li><Link href="/explore" className="hover:text-fg">Explore</Link></li>
                  <li><Link href="/search" className="hover:text-fg">Search</Link></li>
                  <li><Link href="/collaborate" className="hover:text-fg">Collaborate</Link></li>
                  <li><Link href="/playtests/browse" className="hover:text-fg">Playtests</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">More</h4>
                <ul className="mt-3 space-y-2 text-small text-fg-secondary">
                  <li><Link href="/jams" className="hover:text-fg">Jams</Link></li>
                  <li><Link href="/events" className="hover:text-fg">Events</Link></li>
                  <li><Link href="/publishers" className="hover:text-fg">Publishers</Link></li>
                </ul>
              </div>
            </div>
            <p className="mt-10 border-t border-line pt-6 text-micro text-fg-muted">© 2026 Glyph. Built for indie developers.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
