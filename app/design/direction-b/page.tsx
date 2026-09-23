import { notFound } from 'next/navigation'
import { GAMES, DEVLOGS, DEVELOPER, stageTint } from '../_proto/fixtures'

export const metadata = { title: 'Direction B — Showcase', robots: { index: false, follow: false } }

/* ────────────────────────────────────────────────────────────────────────
   DIRECTION B — "Showcase": Behance editorial + developer structure.
   Top-bar nav (media gets the full width), full-bleed hero, large asymmetric
   media grid with overlaid project titles, expressive display type. The work
   is the content; chrome recedes. Dev-only, locally scoped styling. ───────── */

const V = {
  '--b-canvas': '#f7f6f3',
  '--b-fg': '#141416',
  '--b-fg2': '#57575e',
  '--b-fg3': '#93939b',
  '--b-line': '#e6e5e0',
  '--b-accent': '#c05a2c',
} as React.CSSProperties

function Media({ g, className = '', ratio = 'aspect-[4/3]' }: { g: (typeof GAMES)[number]; className?: string; ratio?: string }) {
  if (g.cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={g.cover} alt="" className={`${ratio} w-full object-cover ${className}`} />
  }
  return (
    <div className={`${ratio} flex w-full items-center justify-center ${className}`} style={{ background: '#e9e9ec' }}>
      <span className="px-6 text-center text-[26px] font-semibold leading-tight tracking-tight" style={{ color: '#40414c' }}>{g.title}</span>
    </div>
  )
}

/** Behance-style tile: big media, title + creator overlaid at the bottom on a scrim. */
function ShowTile({ g, ratio, big = false }: { g: (typeof GAMES)[number]; ratio: string; big?: boolean }) {
  return (
    <article className="group relative overflow-hidden rounded-[14px]" style={{ boxShadow: '0 2px 4px rgba(20,20,25,.06)' }}>
      <Media g={g} ratio={ratio} className="transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
      <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: 'linear-gradient(0deg, rgba(8,8,10,.85) 0%, rgba(8,8,10,.35) 55%, transparent 100%)' }}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className={`truncate font-semibold tracking-[-0.02em] text-white ${big ? 'text-[26px]' : 'text-[17px]'}`}>{g.title}</h3>
            <p className="mt-0.5 truncate text-[12.5px] text-white/70">{g.dev} · {g.genre}</p>
          </div>
          <span className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium backdrop-blur-sm" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>{g.stage}</span>
        </div>
      </div>
      {g.playtest && <span className="absolute left-3 top-3 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-white" style={{ background: 'var(--b-accent)' }}>Playtest open</span>}
    </article>
  )
}

export default function DirectionB() {
  if (process.env.NODE_ENV === 'production') notFound()
  const [feature, ...rest] = GAMES

  return (
    <div className="min-h-dvh" style={{ ...V, background: 'var(--b-canvas)', color: 'var(--b-fg)', fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20" style={{ background: 'rgba(247,246,243,.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--b-line)' }}>
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-7 px-6">
          <span className="text-[17px] font-bold tracking-tight">Glyph</span>
          <nav className="hidden items-center gap-6 text-[13.5px] font-medium md:flex" style={{ color: 'var(--b-fg2)' }}>
            <span style={{ color: 'var(--b-fg)' }}>Explore</span><span>Following</span><span>Opportunities</span><span>Jams</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-9 w-[240px] items-center gap-2 rounded-full px-4 text-[13px]" style={{ background: '#fff', color: 'var(--b-fg3)', boxShadow: '0 0 0 1px var(--b-line)' }}>
              <span className="size-3.5 rounded-full" style={{ boxShadow: 'inset 0 0 0 1.5px var(--b-fg3)' }} />Search
            </div>
            <button className="h-9 rounded-full px-4 text-[13px] font-semibold text-white" style={{ background: 'var(--b-fg)' }}>Share your game</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://picsum.photos/seed/nova-avatar/64" alt="" className="size-9 rounded-full object-cover" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 py-8">
        {/* Editorial masthead */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-[44px] font-semibold leading-none tracking-[-0.03em]">What&rsquo;s being built</h1>
            <p className="mt-2 text-[15px]" style={{ color: 'var(--b-fg2)' }}>Games in progress from indie developers — newest work first.</p>
          </div>
          <div className="hidden gap-2 md:flex">
            {['All', 'Playtesting', 'RPG', 'Horror', 'Co-op'].map((t, i) => (
              <span key={t} className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium" style={i === 0 ? { background: 'var(--b-fg)', color: '#fff' } : { background: '#fff', color: 'var(--b-fg2)', boxShadow: '0 0 0 1px var(--b-line)' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Hero: full-bleed feature with overlaid identity */}
        <div className="mb-4"><ShowTile g={feature} ratio="aspect-[21/9]" big /></div>

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="md:col-span-2 md:row-span-2"><ShowTile g={rest[0]} ratio="aspect-square" big /></div>
          <ShowTile g={rest[1]} ratio="aspect-[4/3]" />
          <ShowTile g={rest[2]} ratio="aspect-[4/3]" />
          <ShowTile g={rest[3]} ratio="aspect-[4/3]" />
          <ShowTile g={rest[4]} ratio="aspect-[4/3]" />
          <ShowTile g={rest[5]} ratio="aspect-[4/3]" />
          <ShowTile g={rest[6]} ratio="aspect-[4/3]" />
        </div>

        {/* Editorial progress strip */}
        <section className="mt-16">
          <h2 className="mb-5 text-[26px] font-semibold tracking-[-0.02em]">Latest devlogs</h2>
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {DEVLOGS.map((d) => (
              <a key={d.title} className="group flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://picsum.photos/seed/${d.title.slice(0, 8)}/240/180`} alt="" className="h-[92px] w-[124px] shrink-0 rounded-[10px] object-cover" />
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--b-accent)' }}>{d.project}</p>
                  <h3 className="mt-0.5 text-[16px] font-semibold leading-snug tracking-[-0.01em]">{d.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--b-fg2)' }}>{d.excerpt}</p>
                  <p className="mt-1 font-mono text-[11px]" style={{ color: 'var(--b-fg3)' }}>{d.dev} · {d.when}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Project + Profile + Dashboard previews in this language */}
        <div className="mt-16 grid gap-6 border-t pt-10 lg:grid-cols-3" style={{ borderColor: 'var(--b-line)' }}>
          <div>
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--b-fg3)' }}>PROJECT</p>
            <ShowTile g={feature} ratio="aspect-[16/10]" />
            <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.02em]">{feature.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--b-fg2)' }}>{feature.pitch}</p>
            <div className="mt-3 flex items-center gap-2 font-mono text-[11px]" style={{ color: stageTint[feature.stage] }}>{feature.stage}<span style={{ color: 'var(--b-fg3)' }}>· {feature.engine} · {feature.genre} · {feature.dev}</span></div>
          </div>
          <div>
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--b-fg3)' }}>PROFILE</p>
            <div className="overflow-hidden rounded-[14px]" style={{ background: '#fff', boxShadow: '0 0 0 1px var(--b-line)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://picsum.photos/seed/nova-cover/600/200" alt="" className="h-24 w-full object-cover" />
              <div className="p-4 pt-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://picsum.photos/seed/nova-avatar/120" alt="" className="-mt-8 size-16 rounded-full object-cover ring-4" style={{ '--tw-ring-color': '#fff' } as React.CSSProperties} />
                <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">{DEVELOPER.name}</h3>
                <p className="font-mono text-[11.5px]" style={{ color: 'var(--b-fg3)' }}>@{DEVELOPER.handle} · {DEVELOPER.role} · {DEVELOPER.location}</p>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--b-fg2)' }}>{DEVELOPER.bio}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--b-fg3)' }}>DASHBOARD</p>
            <div className="rounded-[14px] p-4" style={{ background: '#fff', boxShadow: '0 0 0 1px var(--b-line)' }}>
              <h3 className="text-[18px] font-semibold tracking-[-0.015em]">Keep building</h3>
              <div className="mt-3 flex gap-3 rounded-[10px] p-2" style={{ background: 'var(--b-canvas)' }}>
                <div className="w-24 overflow-hidden rounded-[8px]"><Media g={feature} ratio="aspect-video" /></div>
                <div className="min-w-0"><p className="text-[14px] font-semibold">{feature.title}</p><p className="text-[12px]" style={{ color: 'var(--b-fg2)' }}>Last devlog 13d ago</p><button className="mt-1.5 h-7 rounded-[7px] px-2.5 text-[12px] font-semibold text-white" style={{ background: 'var(--b-accent)' }}>Write devlog</button></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
