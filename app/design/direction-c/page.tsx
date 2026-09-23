import { notFound } from 'next/navigation'
import { GAMES, DEVLOGS, ATTENTION, stageTint } from '../_proto/fixtures'

export const metadata = { title: 'Direction C — Console', robots: { index: false, follow: false } }

/* ────────────────────────────────────────────────────────────────────────
   DIRECTION C — "Console": Raycast/Linear polish + game identity.
   Three columns (nav · content · contextual rail) to use the full canvas,
   compact polished identity, command search, keyboard affordances, layered
   panel depth via fine borders + subtle shadow. Dev-only, locally scoped. ── */

const V = {
  '--c-canvas': '#eceef1',
  '--c-panel': '#ffffff',
  '--c-fg': '#16171a',
  '--c-fg2': '#565a63',
  '--c-fg3': '#8b909a',
  '--c-line': '#e2e4e8',
  '--c-accent': '#bd5a2c',
  '--c-sel': '#eef1f5',
} as React.CSSProperties

function Thumb({ g, size = 'h-11 w-16' }: { g: (typeof GAMES)[number]; size?: string }) {
  if (g.cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={g.cover} alt="" className={`${size} shrink-0 rounded-[7px] object-cover`} style={{ boxShadow: '0 0 0 1px rgba(20,20,25,.06)' }} />
  }
  return <span className={`${size} grid shrink-0 place-items-center rounded-[7px] text-[13px] font-bold`} style={{ background: '#e4e6ea', color: stageTint[g.stage] }}>{g.title.charAt(0)}</span>
}

function CNav({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex h-8 items-center gap-2.5 rounded-[7px] px-2 text-[13px] font-medium" style={active ? { background: 'var(--c-panel)', color: 'var(--c-fg)', boxShadow: '0 1px 1px rgba(20,20,25,.05)' } : { color: 'var(--c-fg2)' }}>
      <span className="size-[14px] rounded-[4px]" style={{ background: active ? 'var(--c-accent)' : 'var(--c-fg3)', opacity: active ? 1 : .5 }} />{label}
    </div>
  )
}

export default function DirectionC() {
  if (process.env.NODE_ENV === 'production') notFound()
  const [feature, ...rest] = GAMES

  return (
    <div className="min-h-dvh" style={{ ...V, background: 'var(--c-canvas)', color: 'var(--c-fg)', fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      <div className="flex">
        {/* Nav */}
        <aside className="sticky top-0 hidden h-dvh w-[196px] shrink-0 flex-col gap-0.5 px-2.5 py-3 lg:flex">
          <div className="flex items-center gap-2 px-2 pb-3">
            <span className="grid size-6 place-items-center rounded-[6px] text-[13px] font-bold text-white" style={{ background: 'var(--c-fg)' }}>G</span>
            <span className="text-[14px] font-semibold tracking-tight">Glyph</span>
          </div>
          <CNav label="Home" /><CNav label="Explore" active /><CNav label="Following" /><CNav label="Opportunities" />
          <p className="px-2 pb-1 pt-5 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--c-fg3)' }}>Projects</p>
          <CNav label="Emberfall Keep" /><CNav label="Northwind" />
        </aside>

        {/* Content panel */}
        <main className="min-w-0 flex-1 py-3 pr-3">
          <div className="overflow-hidden rounded-[14px]" style={{ background: 'var(--c-panel)', boxShadow: '0 1px 2px rgba(20,20,25,.05), 0 0 0 1px rgba(20,20,25,.05)' }}>
            {/* Command bar */}
            <div className="flex items-center gap-3 border-b px-4 py-2.5" style={{ borderColor: 'var(--c-line)' }}>
              <div className="flex h-8 flex-1 items-center gap-2 rounded-[8px] px-3 text-[13px]" style={{ background: 'var(--c-canvas)', color: 'var(--c-fg3)' }}>
                <span className="size-3.5 rounded-full" style={{ boxShadow: 'inset 0 0 0 1.5px var(--c-fg3)' }} />Search or jump to a project…
                <kbd className="ml-auto rounded-[5px] px-1.5 py-0.5 font-mono text-[10px]" style={{ background: 'var(--c-panel)', color: 'var(--c-fg2)', boxShadow: '0 0 0 1px var(--c-line)' }}>⌘K</kbd>
              </div>
              <div className="flex items-center rounded-[8px] p-0.5 text-[12.5px] font-medium" style={{ background: 'var(--c-canvas)' }}>
                {['Games', 'Builders', 'Devlogs'].map((t, i) => <span key={t} className="grid h-7 place-items-center rounded-[6px] px-2.5" style={i === 0 ? { background: 'var(--c-panel)', boxShadow: '0 1px 1px rgba(20,20,25,.06)' } : { color: 'var(--c-fg2)' }}>{t}</span>)}
              </div>
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between px-4 pt-4">
              <h1 className="text-[15px] font-semibold">Explore games</h1>
              <span className="font-mono text-[11px]" style={{ color: 'var(--c-fg3)' }}>{GAMES.length} active · newest first</span>
            </div>

            {/* Dense polished list with media */}
            <div className="px-2 py-2">
              {GAMES.map((g, i) => (
                <div key={g.title} className="flex items-center gap-3 rounded-[9px] px-2 py-2" style={i === 0 ? { background: 'var(--c-sel)' } : undefined}>
                  <Thumb g={g} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-semibold tracking-[-0.01em]">{g.title}</h3>
                      <span className="rounded-[4px] px-1.5 font-mono text-[10px] font-medium" style={{ background: 'var(--c-canvas)', color: stageTint[g.stage] }}>{g.stage}</span>
                      {g.playtest && <span className="font-mono text-[10.5px] font-medium" style={{ color: 'var(--c-accent)' }}>● playtest</span>}
                    </div>
                    <p className="truncate text-[12.5px]" style={{ color: 'var(--c-fg2)' }}>{g.pitch}</p>
                  </div>
                  <div className="hidden w-40 shrink-0 font-mono text-[11px] sm:block" style={{ color: 'var(--c-fg3)' }}>{g.dev}</div>
                  <div className="hidden w-24 shrink-0 text-right font-mono text-[11px] sm:block" style={{ color: 'var(--c-fg3)' }}>{g.engine}</div>
                  <div className="w-16 shrink-0 text-right font-mono text-[11px]" style={{ color: 'var(--c-fg3)' }}>{g.updated}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Devlog panel below */}
          <div className="mt-3 overflow-hidden rounded-[14px]" style={{ background: 'var(--c-panel)', boxShadow: '0 1px 2px rgba(20,20,25,.05), 0 0 0 1px rgba(20,20,25,.05)' }}>
            <div className="border-b px-4 py-2.5 text-[15px] font-semibold" style={{ borderColor: 'var(--c-line)' }}>Recent progress</div>
            <div className="divide-y" style={{ borderColor: 'var(--c-line)' }}>
              {DEVLOGS.map((d) => (
                <a key={d.title} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[13.5px] font-semibold">{d.title}</h4>
                    <p className="truncate font-mono text-[11px]" style={{ color: 'var(--c-fg3)' }}>{d.project} · {d.dev}</p>
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--c-fg3)' }}>{d.when}</span>
                </a>
              ))}
            </div>
          </div>
        </main>

        {/* Contextual right rail */}
        <aside className="sticky top-0 hidden h-dvh w-[312px] shrink-0 space-y-3 py-3 pr-3 xl:block">
          {/* Spotlight */}
          <div className="overflow-hidden rounded-[14px]" style={{ background: 'var(--c-panel)', boxShadow: '0 1px 2px rgba(20,20,25,.05), 0 0 0 1px rgba(20,20,25,.05)' }}>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={feature.cover!} alt="" className="aspect-[16/10] w-full object-cover" />
              <span className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-white" style={{ background: 'var(--c-accent)' }}>In playtest now</span>
            </div>
            <div className="p-3.5">
              <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{feature.title}</h3>
              <p className="mt-0.5 font-mono text-[11px]" style={{ color: 'var(--c-fg3)' }}>{feature.stage} · {feature.engine} · {feature.genre}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--c-fg2)' }}>{feature.pitch}</p>
              <div className="mt-3 flex gap-2">
                <button className="h-8 flex-1 rounded-[8px] text-[12.5px] font-semibold text-white" style={{ background: 'var(--c-accent)' }}>Join playtest</button>
                <button className="h-8 rounded-[8px] px-3 text-[12.5px] font-semibold" style={{ background: 'var(--c-canvas)' }}>Follow</button>
              </div>
            </div>
          </div>
          {/* Your queue */}
          <div className="rounded-[14px] p-3.5" style={{ background: 'var(--c-panel)', boxShadow: '0 1px 2px rgba(20,20,25,.05), 0 0 0 1px rgba(20,20,25,.05)' }}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13.5px] font-semibold">Needs you</h3>
              <span className="rounded-full px-1.5 font-mono text-[10px] font-medium text-white" style={{ background: 'var(--c-accent)' }}>{ATTENTION.length}</span>
            </div>
            <div className="space-y-1.5">
              {ATTENTION.map((a) => (
                <div key={a.who} className="rounded-[9px] p-2" style={{ background: 'var(--c-canvas)' }}>
                  <p className="text-[12.5px] leading-snug"><span className="font-semibold">{a.who}</span> {a.what}</p>
                  <p className="mt-0.5 flex items-center justify-between font-mono text-[10.5px]" style={{ color: 'var(--c-fg3)' }}>{a.when}<span style={{ color: 'var(--c-accent)' }}>{a.action}</span></p>
                </div>
              ))}
            </div>
          </div>
          {/* Filters */}
          <div className="rounded-[14px] p-3.5" style={{ background: 'var(--c-panel)', boxShadow: '0 1px 2px rgba(20,20,25,.05), 0 0 0 1px rgba(20,20,25,.05)' }}>
            <h3 className="mb-2 text-[13.5px] font-semibold">Filter</h3>
            <div className="flex flex-wrap gap-1.5">
              {['Playtesting', 'Alpha', 'Beta', 'Godot', 'Unity', 'RPG', 'Horror'].map((t) => (
                <span key={t} className="rounded-full px-2.5 py-1 text-[12px] font-medium" style={{ background: 'var(--c-canvas)', color: 'var(--c-fg2)' }}>{t}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
