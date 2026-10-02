import { Search } from 'lucide-react'
import { GButton } from '@/components/glyph/ui/primitives'

/**
 * A quiet retrieval bar, not a marketing search box — icon + input + inline submit, showing the
 * actual term already searched (not a placeholder pretending nothing has happened yet). This is
 * the one page the approved ⌘K command menu's typed-query submit actually lands on, so its form
 * contract (name="q", GET to /search) must stay exact.
 */
export function GlyphSearchMasthead({ q, type, stage }: { q: string; type: string; stage: string | null }) {
  return (
    <div>
      <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
        {q ? <>Search results for <span className="text-ember-ink">&ldquo;{q}&rdquo;</span></> : 'Search'}
      </h1>
      <form action="/search" method="get" role="search" className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search aria-hidden strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            aria-label="Search developers, projects, studios and opportunities"
            placeholder="Search developers, projects, studios, opportunities"
            maxLength={100}
            autoFocus={!q}
            className="h-11 w-full rounded-[10px] border border-hair-strong bg-panel pl-10 pr-3.5 text-body text-ink outline-none transition-colors placeholder:text-ink-3 focus-visible:border-ember focus-visible:ring-2 focus-visible:ring-ember"
          />
        </div>
        {type !== 'all' && <input type="hidden" name="type" value={type} />}
        {stage && <input type="hidden" name="stage" value={stage} />}
        <GButton type="submit" variant="ember" size="md" className="h-11 shrink-0">Search</GButton>
      </form>
    </div>
  )
}
