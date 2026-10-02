'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from 'radix-ui'
import { Search, Compass, Home, Bell, CornerDownLeft } from 'lucide-react'
import { CREATE_ITEMS } from '@/lib/shell/nav'
import { cn } from '@/lib/utils'

type Item = { id: string; label: string; hint?: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>; run: (r: ReturnType<typeof useRouter>) => void }

const CREATE_NAV: Item[] = CREATE_ITEMS.map((c) => ({ id: `create:${c.href}`, label: `Create — ${c.label}`, hint: c.description, icon: c.icon ?? Compass, run: (r: ReturnType<typeof useRouter>) => r.push(c.href) }))

/**
 * Command/search palette with a real combobox+listbox pattern: the input owns combobox semantics
 * (aria-expanded / aria-controls / aria-activedescendant / aria-autocomplete), options carry stable
 * ids and aria-selected, no interactive element nests inside role="option", and Escape restores
 * focus to whatever held it before ⌘K (falling back to the trigger). ⌘K or "/" opens; ↑/↓ move,
 * Enter activates, Esc closes; empty submit runs a full-text search at /search?q=.
 */
export function CommandMenu({ signedIn = false }: { signedIn?: boolean }) {
  const router = useRouter()
  const uid = React.useId()
  const listId = `${uid}-list`
  const optId = (i: number) => `${uid}-opt-${i}`

  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [active, setActive] = React.useState(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const prevFocus = React.useRef<HTMLElement | null>(null)

  const navItems = React.useMemo<Item[]>(() => [
    { id: 'home', label: 'Home', hint: signedIn ? 'Your feed' : 'Glyph home', icon: Home, run: (r) => r.push(signedIn ? '/feed' : '/') },
    { id: 'explore', label: 'Explore', hint: 'Discover games', icon: Compass, run: (r) => r.push('/explore') },
    ...(signedIn ? [{ id: 'notifications', label: 'Notifications', icon: Bell, run: (r: ReturnType<typeof useRouter>) => r.push('/notifications') }] : []),
    ...(signedIn ? CREATE_NAV : []),
  ], [signedIn])

  // Capture the previously-focused element only on a real closed→open transition, so a second
  // onOpenChange fired after the dialog has already moved focus inward can't overwrite it.
  const openMenu = React.useCallback(() => {
    setOpen((prev) => {
      if (!prev) prevFocus.current = (document.activeElement as HTMLElement) ?? null
      return true
    })
    setQ(''); setActive(0)
  }, [])

  const restoreFocus = React.useCallback(() => {
    const el = prevFocus.current
    const valid = !!el && el.isConnected && el !== document.body && el !== document.documentElement
      && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0
    ;(valid ? el : triggerRef.current)?.focus()
  }, [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea/i.test((e.target as HTMLElement)?.tagName ?? ''))) {
        e.preventDefault(); openMenu()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMenu])

  const filtered = q.trim() ? navItems.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : navItems
  const searchRow: Item | null = q.trim() ? { id: 'search', label: `Search “${q.trim()}”`, icon: Search, run: (r) => r.push(`/search?q=${encodeURIComponent(q.trim())}`) } : null
  const rows: Item[] = [...(searchRow ? [searchRow] : []), ...filtered]
  const activeClamped = Math.min(active, Math.max(rows.length - 1, 0))

  const go = (i = activeClamped) => { const it = rows[i]; if (!it) return; setOpen(false); it.run(router) }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go() }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        aria-label="Search and commands"
        aria-keyshortcuts="Meta+K Control+K"
        className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-[10px] border border-hair bg-panel text-small text-ink-3 outline-none transition-colors hover:border-hair-strong hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ember sm:h-9 sm:w-auto sm:justify-start sm:px-3"
      >
        <Search aria-hidden strokeWidth={1.75} className="size-4" />
        <span className="hidden sm:inline">Search Glyph</span>
        <kbd className="ml-2 hidden rounded border border-hair px-1 font-mono text-[10px] text-ink-3 sm:inline">⌘K</kbd>
      </button>

      <Dialog.Root open={open} onOpenChange={(v) => (v ? openMenu() : setOpen(false))}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-[ui-fade-in_150ms_ease-out]" />
          <Dialog.Content
            onKeyDown={onKeyDown}
            onCloseAutoFocus={(e) => { e.preventDefault(); restoreFocus() }}
            className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-[14px] border border-hair bg-panel text-ink shadow-g3 data-[state=open]:animate-[ui-pop-in_150ms_ease-out]"
          >
            <Dialog.Title className="sr-only">Search and commands</Dialog.Title>
            <Dialog.Description className="sr-only">Search games and developers, or jump to a destination. Use arrow keys to move, Enter to select, Escape to close.</Dialog.Description>
            <div className="flex items-center gap-3 border-b border-hair px-4">
              <Search aria-hidden strokeWidth={1.75} className="size-[18px] shrink-0 text-ink-3" />
              <input
                autoFocus
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0) }}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={rows.length ? optId(activeClamped) : undefined}
                aria-label="Search games and developers, or jump to"
                placeholder="Search games and developers, or jump to…"
                className="h-14 w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
              />
            </div>
            <ul id={listId} role="listbox" aria-label="Results" className="max-h-[52vh] overflow-y-auto p-2">
              {rows.length === 0 && <li className="px-3 py-6 text-center text-small text-ink-3">No matches. Press Enter to search.</li>}
              {rows.map((it, i) => (
                <li
                  key={it.id}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === activeClamped}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(i)}
                  className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-[9px] px-3 py-2 text-small', i === activeClamped ? 'bg-ember-quiet text-ink' : 'text-ink-2')}
                >
                  <it.icon aria-hidden strokeWidth={1.75} className={cn('size-4 shrink-0', i === activeClamped ? 'text-ember' : 'text-ink-3')} />
                  <span className="min-w-0 flex-1 truncate text-ink">{it.label}</span>
                  {it.hint && <span className="hidden truncate text-micro text-ink-3 sm:inline">{it.hint}</span>}
                  {i === activeClamped && <CornerDownLeft aria-hidden strokeWidth={1.75} className="size-3.5 shrink-0 text-ink-3" />}
                </li>
              ))}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
