'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Popover } from 'radix-ui'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { addToShortlist, removeFromShortlist } from '@/app/actions/publisher'
import { GButton } from '@/components/glyph/ui/primitives'
import { cn } from '@/lib/utils'

type Shortlist = { id: string; name: string; items: string[] }

/**
 * New Glyph publisher shortlist interaction — same server actions and behavior contract as the
 * legacy button (private/publisher-only rendering decided by the caller, pending state, error
 * announcement, pressed/saved state, empty-shortlist guidance, keyboard/focus via Radix Popover),
 * rebuilt on Radix directly with no legacy presentation import.
 */
export function GlyphShortlistButton({ projectId, shortlists }: { projectId: string; shortlists: Shortlist[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (shortlists.length === 0) {
    return <p className="text-body text-ink-2">To save this project, first <Link href="/dashboard/publisher" className="font-medium text-ember-ink underline-offset-4 hover:underline">create a shortlist</Link>.</p>
  }

  const handleToggle = (shortlistId: string, alreadyIn: boolean) => {
    setError('')
    startTransition(async () => {
      const result = alreadyIn ? await removeFromShortlist(shortlistId, projectId) : await addToShortlist(shortlistId, projectId)
      if ('error' in result) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <GButton variant="outline" size="md"><Bookmark aria-hidden strokeWidth={1.75} className="size-4" /> Shortlist</GButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-50 w-64 rounded-[12px] border border-hair bg-panel p-1 text-ink shadow-g2 data-[state=open]:animate-[ui-pop-in_150ms_ease-out]"
        >
          <div role="group" aria-label="Choose a shortlist">
            {shortlists.map((sl) => {
              const alreadyIn = sl.items.includes(projectId)
              return (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => handleToggle(sl.id, alreadyIn)}
                  disabled={pending}
                  aria-pressed={alreadyIn}
                  className={cn('flex min-h-11 w-full items-center justify-between gap-2 rounded-[9px] px-3 text-left text-body text-ink outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember disabled:opacity-60')}
                >
                  <span className="truncate">{sl.name}</span>
                  {alreadyIn ? <BookmarkCheck aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-ember-ink" /> : <Bookmark aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-ink-3" />}
                  <span className="sr-only">{alreadyIn ? ' (saved — select to remove)' : ' (select to save)'}</span>
                </button>
              )
            })}
            {error && <p role="alert" className="px-3 py-1 text-small text-gdanger">{error}</p>}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
