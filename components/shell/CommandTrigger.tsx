'use client'

import { Search } from 'lucide-react'

/**
 * The header's search affordance — opens the ⌘K command palette rather than being a separate
 * search field (one retrieval surface, less chrome; Raycast/Linear lesson). Dispatches a custom
 * event the palette listens for, so trigger and keyboard shortcut share one implementation.
 */
export function CommandTrigger() {
  const open = () => window.dispatchEvent(new Event('glyph:command'))
  return (
    <>
      <button
        type="button"
        onClick={open}
        className="hidden h-9 w-56 items-center gap-2 rounded-control border border-line bg-surface px-3 text-small text-fg-muted transition-colors hover:border-line-strong hover:text-fg-secondary md:flex lg:w-72"
      >
        <Search aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="rounded-badge bg-surface-muted px-1.5 py-0.5 font-mono text-micro">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={open}
        aria-label="Search"
        className="inline-flex size-11 items-center justify-center rounded-control text-fg-secondary hover:bg-surface-muted hover:text-fg md:hidden"
      >
        <Search aria-hidden strokeWidth={1.75} className="size-5" />
      </button>
    </>
  )
}
