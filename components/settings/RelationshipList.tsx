'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { unblockUser, unmuteUser } from '@/app/actions/moderation'
import { Button } from '@/components/ui/Button'
import { FormStatus } from './FormStatus'
import { relativeTime } from '@/lib/utils'

export type Relationship = { userId: string; username: string; displayName: string | null; since: string }

/** People you blocked or muted, with the one-step undo. Uses the same actions as the profile menu; there is no second blocking system. */
export function RelationshipList({ kind, people }: { kind: 'block' | 'mute'; people: Relationship[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const verb = kind === 'block' ? 'Unblock' : 'Unmute'

  const undo = (p: Relationship) => {
    setError(''); setNotice('')
    startTransition(async () => {
      const r = kind === 'block' ? await unblockUser(p.userId) : await unmuteUser(p.userId)
      if ('error' in r) setError(r.error)
      else { setNotice(`${p.displayName || p.username} was ${kind === 'block' ? 'unblocked' : 'unmuted'}. Their content can appear for you again.`); router.refresh() }
    })
  }

  return (
    <div>
      {people.length === 0 ? (
        <p className="border-y border-line-subtle py-4 text-small text-fg-secondary">{kind === 'block' ? 'You have not blocked anyone.' : 'You have not muted anyone.'} You can do it from a developer&apos;s profile.</p>
      ) : (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
          {people.map((p) => {
            const name = p.displayName || p.username
            return (
              <li key={p.userId} className="flex items-center justify-between gap-3 py-2">
                <p className="min-w-0 text-small text-fg-secondary [overflow-wrap:anywhere]">
                  <Link href={`/dev/${p.username}`} className="font-medium text-fg hover:text-link">{name}</Link>
                  <span className="text-fg-muted"> @{p.username} · {kind === 'block' ? 'blocked' : 'muted'} {relativeTime(p.since)}</span>
                </p>
                <Button variant="secondary" size="sm" onClick={() => undo(p)} disabled={pending} aria-label={`${verb} ${name}`}>{verb}</Button>
              </li>
            )
          })}
        </ul>
      )}
      <FormStatus error={error} notice={notice} className="mt-2 min-h-5" />
    </div>
  )
}
