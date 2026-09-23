import { notFound } from 'next/navigation'
import { GAMES, DEVLOGS, DEVELOPER, ATTENTION, stageTint } from '../_proto/fixtures'

export const metadata = { title: 'Direction A — Studio', robots: { index: false, follow: false } }

/* ────────────────────────────────────────────────────────────────────────
   DIRECTION A — "Studio": Apple/macOS clarity + developer-tool precision.
   Off-white canvas, refined grouped sidebar, App-Store feature card + media
   shelves, one restrained warm accent, subtle material depth. Dev-only.
   All styling is local (scoped CSS vars on the root) so it never touches the
   production token system. ──────────────────────────────────────────────── */

const V = {
  '--a-canvas': '#f4f4f1',
  '--a-surface': '#ffffff',
  '--a-raise': '#ffffff',
  '--a-fg': '#191a1c',
  '--a-fg2': '#5b5d63',
  '--a-fg3': '#9a9ca3',
  '--a-line': '#e7e7e2',
  '--a-line2': '#eeeeea',
  '--a-cool': '#edeef1',
  '--a-accent': '#bd5b2e',
  '--a-accent-weak': '#f6ece4',
} as React.CSSProperties

function Cover({ g, className = '', h = 'aspect-video' }: { g: (typeof GAMES)[number]; className?: string; h?: string }) {
  if (g.cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={g.cover} alt="" className={`${h} w-full object-cover ${className}`} />
  }
  return (
    <div className={`${h} flex w-full flex-col justify-between p-3 ${className}`} style={{ background: 'var(--a-cool)' }}>
      <span className="font-mono text-[11px]" style={{ color: stageTint[g.stage] }}>{g.stage}</span>
      <span className="text-[22px] font-semibold leading-tight tracking-tight" style={{ color: '#3b4557' }}>{g.title}</span>
      <span className="font-mono text-[11px]" style={{ color: '#7c8091' }}>{g.engine} · {g.genre}</span>
    </div>
  )
}

function NavItem({ label, active, badge }: { label: string; active?: boolean; badge?: string }) {
  return (
    <div
      className="flex h-9 items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] font-medium"
      style={active ? { background: 'var(--a-surface)', color: 'var(--a-fg)', boxShadow: '0 1px 2px rgba(20,20,25,.06), 0 0 0 1px rgba(20,20,25,.04)' } : { color: 'var(--a-fg2)' }}
    >
      <span className="size-[15px] rounded-[5px]" style={{ background: active ? 'var(--a-accent)' : 'var(--a-fg3)', opacity: active ? 1 : 0.55 }} />
      {label}
      {badge && <span className="ml-auto rounded-full px-1.5 font-mono text-[10px]" style={{ background: 'var(--a-accent-weak)', color: 'var(--a-accent)' }}>{badge}</span>}
    </div>
  )
}

export default function DirectionA() {
  if (process.env.NODE_ENV === 'production') notFound()
  const [feature, ...rest] = GAMES
  const shelf = rest.slice(0, 6)

  return (
    <div className="min-h-dvh" style={{ ...V, background: 'var(--a-canvas)', color: 'var(--a-fg)', fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 flex-col px-3 py-4 lg:flex" style={{ background: 'var(--a-canvas)' }}>
          <div className="flex items-center gap-2 px-2.5 pb-4">
            <span className="grid size-7 place-items-center rounded-[8px] text-[15px] font-bold text-white" style={{ background: 'var(--a-fg)' }}>G</span>
            <span className="text-[15px] font-semibold tracking-tight">Glyph</span>
          </div>
          <div className="space-y-0.5">
            <NavItem label="Home" />
            <NavItem label="Explore" active />
            <NavItem label="Following" />
            <NavItem label="Opportunities" badge="3" />
          </div>
          <p className="px-2.5 pb-1.5 pt-6 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--a-fg3)' }}>Your work</p>
          <div className="space-y-0.5">
            <NavItem label="Emberfall Keep" />
            <NavItem label="Northwind" />
          </div>
          <button className="mt-4 flex h-9 items-center justify-center gap-2 rounded-[9px] text-[13.5px] font-semibold text-white" style={{ background: 'var(--a-accent)', boxShadow: '0 1px 2px rgba(189,91,46,.35)' }}>
            <span className="text-[16px] leading-none">+</span> New project
          </button>
          <div className="mt-auto flex items-center gap-2.5 rounded-[10px] p-2" style={{ background: 'var(--a-surface)', boxShadow: '0 0 0 1px rgba(20,20,25,.04)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://picsum.photos/seed/nova-avatar/64" alt="" className="size-8 rounded-full object-cover" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12.5px] font-medium">Nova Calder</p>
              <p className="truncate font-mono text-[10.5px]" style={{ color: 'var(--a-fg3)' }}>@demo-nova</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-6 py-5 xl:px-10">
          <div className="mx-auto max-w-[1180px] space-y-14">

            {/* Toolbar */}
            <div className="flex items-center gap-4">
              <h1 className="text-[30px] font-semibold tracking-[-0.02em]">Explore</h1>
              <div className="ml-1 flex h-8 items-center rounded-[9px] p-0.5 text-[13px] font-medium" style={{ background: 'var(--a-cool)' }}>
                {['Games', 'Builders', 'Devlogs'].map((t, i) => (
                  <span key={t} className="grid h-7 place-items-center rounded-[7px] px-3" style={i === 0 ? { background: 'var(--a-surface)', color: 'var(--a-fg)', boxShadow: '0 1px 2px rgba(20,20,25,.08)' } : { color: 'var(--a-fg2)' }}>{t}</span>
                ))}
              </div>
              <div className="ml-auto flex h-9 w-[280px] items-center gap-2 rounded-[10px] px-3 text-[13px]" style={{ background: 'var(--a-surface)', color: 'var(--a-fg3)', boxShadow: '0 0 0 1px rgba(20,20,25,.05)' }}>
                <span className="size-3.5 rounded-full" style={{ boxShadow: 'inset 0 0 0 1.5px var(--a-fg3)' }} />
                Search games, builders…
                <kbd className="ml-auto rounded-[5px] px-1.5 py-0.5 font-mono text-[10px]" style={{ background: 'var(--a-cool)', color: 'var(--a-fg2)' }}>⌘K</kbd>
              </div>
            </div>

            {/* Feature card — App Store editorial hero */}
            <section>
              <div className="relative overflow-hidden rounded-[20px]" style={{ boxShadow: '0 1px 2px rgba(20,20,25,.06), 0 24px 48px -24px rgba(20,20,25,.28)' }}>
                <Cover g={feature} h="aspect-[21/8]" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,10,12,.82) 0%, rgba(10,10,12,.5) 42%, rgba(10,10,12,0) 72%)' }} />
                <div className="absolute inset-0 flex flex-col justify-center gap-3 p-9 text-white" style={{ maxWidth: 620 }}>
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: '#f4b48a' }}>
                    <span className="size-1.5 rounded-full" style={{ background: '#f4b48a' }} /> In playtest now
                  </span>
                  <h2 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.025em]">{feature.title}</h2>
                  <p className="text-[15px] leading-relaxed text-white/80">{feature.pitch}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button className="h-10 rounded-[10px] px-5 text-[13.5px] font-semibold" style={{ background: 'white', color: '#191a1c' }}>View project</button>
                    <span className="font-mono text-[12px] text-white/65">{feature.stage} · {feature.engine} · {feature.genre} · {feature.dev}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Media shelf */}
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h3 className="text-[18px] font-semibold tracking-[-0.01em]">Fresh builds</h3>
                <a className="text-[13px] font-medium" style={{ color: 'var(--a-accent)' }}>Browse all →</a>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-3">
                {shelf.map((g) => (
                  <article key={g.title} className="group">
                    <div className="overflow-hidden rounded-[14px]" style={{ boxShadow: '0 1px 2px rgba(20,20,25,.05), 0 0 0 1px rgba(20,20,25,.04)' }}>
                      <Cover g={g} />
                    </div>
                    <div className="mt-2.5 flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-[14.5px] font-semibold tracking-[-0.01em]">{g.title}</h4>
                        <p className="truncate text-[12.5px]" style={{ color: 'var(--a-fg2)' }}>{g.dev} · {g.genre}</p>
                      </div>
                      {g.playtest && <span className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium" style={{ background: 'var(--a-accent-weak)', color: 'var(--a-accent)' }}>Playtest</span>}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Two-column: builders + progress */}
            <section className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <h3 className="mb-4 text-[18px] font-semibold tracking-[-0.01em]">Builders to know</h3>
                <div className="space-y-1">
                  {GAMES.slice(1, 5).map((g, i) => (
                    <div key={g.handle} className="flex items-center gap-3 rounded-[12px] p-2.5" style={{ background: i === 0 ? 'var(--a-surface)' : 'transparent', boxShadow: i === 0 ? '0 0 0 1px rgba(20,20,25,.04)' : 'none' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://picsum.photos/seed/${g.handle}-av/72`} alt="" className="size-10 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium">{g.dev}</p>
                        <p className="truncate text-[12.5px]" style={{ color: 'var(--a-fg2)' }}>Building <span style={{ color: 'var(--a-fg)' }}>{g.title}</span> · {g.engine}</p>
                      </div>
                      <button className="h-8 rounded-[8px] px-3 text-[12.5px] font-semibold" style={{ background: 'var(--a-cool)', color: 'var(--a-fg)' }}>Follow</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-[18px] font-semibold tracking-[-0.01em]">Recent progress</h3>
                <div className="divide-y" style={{ borderColor: 'var(--a-line2)' }}>
                  {DEVLOGS.map((d) => (
                    <a key={d.title} className="block py-3.5">
                      <h4 className="text-[14.5px] font-semibold leading-snug tracking-[-0.01em]">{d.title}</h4>
                      <p className="mt-0.5 font-mono text-[11.5px]" style={{ color: 'var(--a-fg3)' }}>{d.project} · {d.dev} · {d.when}</p>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--a-fg2)' }}>{d.excerpt}</p>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* Compact section previews so reviewers see Project / Profile / Dashboard in this language */}
            <div className="grid gap-6 border-t pt-10 lg:grid-cols-3" style={{ borderColor: 'var(--a-line)' }}>
              {/* Project */}
              <ProtoCard label="PROJECT">
                <div className="overflow-hidden rounded-[12px]"><Cover g={feature} /></div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium" style={{ background: 'var(--a-accent-weak)', color: 'var(--a-accent)' }}>Alpha</span>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--a-fg3)' }}>Godot · Action-RPG</span>
                </div>
                <h4 className="mt-1.5 text-[20px] font-semibold tracking-[-0.015em]">{feature.title}</h4>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--a-fg2)' }}>{feature.pitch}</p>
                <div className="mt-3 flex gap-2">
                  <button className="h-8 rounded-[8px] px-3 text-[12.5px] font-semibold text-white" style={{ background: 'var(--a-accent)' }}>Join playtest</button>
                  <button className="h-8 rounded-[8px] px-3 text-[12.5px] font-semibold" style={{ background: 'var(--a-cool)' }}>Follow</button>
                </div>
              </ProtoCard>
              {/* Profile */}
              <ProtoCard label="PROFILE">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://picsum.photos/seed/nova-avatar/96" alt="" className="size-14 rounded-full object-cover" />
                  <div>
                    <h4 className="text-[19px] font-semibold tracking-[-0.015em]">{DEVELOPER.name}</h4>
                    <p className="font-mono text-[11.5px]" style={{ color: 'var(--a-fg3)' }}>@{DEVELOPER.handle} · {DEVELOPER.role}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#2f6f57' }}><span className="size-1.5 rounded-full" style={{ background: '#2f6f57' }} />Open to collaborate</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--a-fg2)' }}>{DEVELOPER.bio}</p>
                <p className="mt-3 mb-1.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--a-fg3)' }}>Current work</p>
                <div className="flex gap-2.5 rounded-[10px] p-2" style={{ background: 'var(--a-cool)' }}>
                  <div className="w-20 overflow-hidden rounded-[8px]"><Cover g={feature} /></div>
                  <div><p className="text-[13.5px] font-semibold">{feature.title}</p><p className="text-[12px]" style={{ color: 'var(--a-fg2)' }}>Alpha · updated 13d ago</p></div>
                </div>
              </ProtoCard>
              {/* Dashboard */}
              <ProtoCard label="DASHBOARD">
                <p className="text-[13px]" style={{ color: 'var(--a-fg2)' }}>Good evening, Nova.</p>
                <h4 className="text-[19px] font-semibold tracking-[-0.015em]">2 things need you</h4>
                <div className="mt-3 space-y-2">
                  {ATTENTION.map((a) => (
                    <div key={a.who} className="rounded-[10px] p-2.5" style={{ background: 'var(--a-surface)', boxShadow: '0 0 0 1px rgba(20,20,25,.05)', borderLeft: '2px solid var(--a-accent)' }}>
                      <p className="text-[13px]"><span className="font-semibold">{a.who}</span> {a.what}</p>
                      <p className="mt-0.5 flex items-center justify-between font-mono text-[11px]" style={{ color: 'var(--a-fg3)' }}>{a.when}<span style={{ color: 'var(--a-accent)' }}>{a.action} →</span></p>
                    </div>
                  ))}
                </div>
              </ProtoCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function ProtoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--a-fg3)' }}>{label}</p>
      <div className="rounded-[16px] p-4" style={{ background: 'var(--a-surface)', boxShadow: '0 1px 2px rgba(20,20,25,.05), 0 0 0 1px rgba(20,20,25,.04)' }}>{children}</div>
    </div>
  )
}
