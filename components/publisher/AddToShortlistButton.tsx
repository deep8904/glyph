'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { addToShortlist, removeFromShortlist } from '@/app/actions/publisher'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'

type Shortlist = { id: string; name: string; items: string[] }

/** Publisher-only, private: save this (canonical) project into one of your own shortlists. */
export function AddToShortlistButton({ projectId, shortlists }: { projectId: string; shortlists: Shortlist[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (shortlists.length === 0) {
    return <p className="text-body text-fg-secondary">To save this project, first <Link href="/dashboard/publisher" className="font-medium text-link underline-offset-2 hover:underline">create a shortlist</Link>.</p>
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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary"><Bookmark aria-hidden strokeWidth={1.75} className="size-4" /> Shortlist</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1">
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
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-control px-3 text-left text-body text-fg hover:bg-surface-muted disabled:opacity-60"
              >
                <span className="truncate">{sl.name}</span>
                {alreadyIn ? <BookmarkCheck aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-link" /> : <Bookmark aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-fg-muted" />}
                <span className="sr-only">{alreadyIn ? ' (saved — select to remove)' : ' (select to save)'}</span>
              </button>
            )
          })}
          {error && <p role="alert" className="px-3 py-1 text-small text-danger">{error}</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
