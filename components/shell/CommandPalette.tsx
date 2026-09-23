'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as D, VisuallyHidden } from 'radix-ui'
import { Compass, Home, Bell, Settings, Search, FolderPlus, PenLine, User, ArrowRight, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type Cmd = { id: string; label: string; hint?: string; icon: typeof Home; run: (r: ReturnType<typeof useRouter>) => void; keywords?: string }

/**
 * ⌘K command palette (Console-supported pillar of the art direction). Fast keyboard-first
 * navigation and creation over EXISTING routes only — no new backend. Free-text falls through to
 * the existing /search route. Radix Dialog gives the focus trap, Escape, and focus restoration;
 * arrow keys + Enter drive selection. Signed-out visitors get the public subset.
 */
export function CommandPalette({ signedIn, username }: { signedIn: boolean; username?: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const reset = () => { setQ(''); setActive(0) }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); reset(); setOpen((o) => !o) }
    }
    const onOpen = () => { reset(); setOpen(true) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('glyph:command', onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('glyph:command', onOpen) }
  }, [])

  const commands = useMemo<Cmd[]>(() => {
    const base: Cmd[] = [
      { id: 'explore', label: 'Explore games', icon: Compass, run: (r) => r.push('/explore'), keywords: 'discover browse projects' },
      { id: 'search', label: 'Search developers, projects, devlogs', icon: Search, run: (r) => r.push('/search'), keywords: 'find' },
    ]
    if (signedIn) return [
      { id: 'home', label: 'Home', icon: Home, run: (r) => r.push('/feed'), keywords: 'feed following' },
      ...base,
      { id: 'new-project', label: 'Create a project', hint: 'Create', icon: FolderPlus, run: (r) => r.push('/dashboard/projects/new'), keywords: 'new game add' },
      { id: 'new-devlog', label: 'Write a devlog', hint: 'Create', icon: PenLine, run: (r) => r.push('/dashboard/projects'), keywords: 'post update new' },
      { id: 'notifications', label: 'Notifications', icon: Bell, run: (r) => r.push('/notifications'), keywords: 'alerts' },
      { id: 'profile', label: 'Your profile', icon: User, run: (r) => username && r.push(`/dev/${username}`), keywords: 'me' },
      { id: 'settings', label: 'Settings', icon: Settings, run: (r) => r.push('/settings'), keywords: 'account preferences' },
    ]
    return [...base, { id: 'signin', label: 'Sign in', icon: User, run: (r) => r.push('/login') }]
  }, [signedIn, username])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return commands
    return commands.filter((c) => (c.label + ' ' + (c.keywords ?? '')).toLowerCase().includes(t))
  }, [q, commands])

  const hasQuery = q.trim().length > 0
  const total = filtered.length + (hasQuery ? 1 : 0) // +1 for the "search for" fallback row
  // Clamp at render (no effect) so a shrinking list keeps a valid selection.
  const act = total === 0 ? 0 : Math.min(active, total - 1)

  const runAt = (i: number) => {
    if (hasQuery && i === filtered.length) { router.push(`/search?q=${encodeURIComponent(q.trim())}`); setOpen(false); return }
    const c = filtered[i]
    if (c) { c.run(router); setOpen(false) }
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((act + 1) % total) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((act - 1 + total) % total) }
    else if (e.key === 'Enter') { e.preventDefault(); runAt(act) }
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${act}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [act])

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Portal>
        <D.Overlay data-ui-overlay className="fixed inset-0 z-50 bg-overlay" />
        <D.Content
          data-ui-pop
          aria-label="Command menu"
          onOpenAutoFocus={(e) => { e.preventDefault() }}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-panel border border-line bg-surface-elevated shadow-dialog focus:outline-none"
        >
          <VisuallyHidden.Root><D.Title>Command menu</D.Title></VisuallyHidden.Root>
          <div className="flex items-center gap-2.5 border-b border-line px-4">
            <Search aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-fg-muted" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0) }}
              onKeyDown={onInputKey}
              placeholder="Search or jump to…"
              aria-label="Search or jump to"
              className="h-12 flex-1 bg-transparent text-body text-fg placeholder:text-fg-muted focus:outline-none"
            />
            <kbd className="rounded-badge bg-surface-muted px-1.5 py-0.5 font-mono text-micro text-fg-muted">esc</kbd>
          </div>
          <div ref={listRef} role="listbox" aria-label="Commands" className="max-h-[52vh] overflow-y-auto p-1.5">
            {filtered.length === 0 && !hasQuery && <p className="px-3 py-6 text-center text-small text-fg-muted">No commands.</p>}
            {filtered.map((c, i) => (
              <button
                key={c.id}
                data-idx={i}
                role="option"
                aria-selected={act === i}
                onMouseMove={() => setActive(i)}
                onClick={() => runAt(i)}
                className={cn('flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left', act === i ? 'bg-surface-muted' : '')}
              >
                <c.icon aria-hidden strokeWidth={1.75} className={cn('size-4 shrink-0', act === i ? 'text-accent' : 'text-fg-muted')} />
                <span className="flex-1 truncate text-body text-fg">{c.label}</span>
                {c.hint && <span className="rounded-badge bg-surface-muted px-1.5 py-0.5 font-mono text-micro text-fg-muted">{c.hint}</span>}
                {act === i && <CornerDownLeft aria-hidden strokeWidth={1.75} className="size-3.5 text-fg-muted" />}
              </button>
            ))}
            {hasQuery && (
              <button
                data-idx={filtered.length}
                role="option"
                aria-selected={act === filtered.length}
                onMouseMove={() => setActive(filtered.length)}
                onClick={() => runAt(filtered.length)}
                className={cn('flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left', act === filtered.length ? 'bg-surface-muted' : '')}
              >
                <Search aria-hidden strokeWidth={1.75} className={cn('size-4 shrink-0', act === filtered.length ? 'text-accent' : 'text-fg-muted')} />
                <span className="flex-1 truncate text-body text-fg">Search Glyph for “<span className="font-medium">{q.trim()}</span>”</span>
                <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5 text-fg-muted" />
              </button>
            )}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
