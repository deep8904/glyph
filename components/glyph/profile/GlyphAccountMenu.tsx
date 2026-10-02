'use client'

import { useState, useTransition } from 'react'
import { BellOff, Bell, MoreHorizontal, Shield, ShieldOff } from 'lucide-react'
import { blockUser, unblockUser, muteUser, unmuteUser } from '@/app/actions/moderation'
import { GMenu, GMenuTrigger, GMenuContent, GMenuItem } from '@/components/glyph/ui/primitives'
import { cn } from '@/lib/utils'

/**
 * Block / mute for a non-owner viewer — same server actions and optimistic-state contract as the
 * legacy menu (report is omitted here, matching the profile's original usage, which never passed
 * an entity to report). The outcome is announced via an accessible live region instead of the
 * legacy visual toast.
 */
export function GlyphAccountMenu({ targetId, targetUsername, isBlocked: initialBlocked, isMuted: initialMuted }: { targetId: string; targetUsername: string; isBlocked: boolean; isMuted: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [muted, setMuted] = useState(initialMuted)
  const [message, setMessage] = useState('')

  const handleBlock = () => {
    startTransition(async () => {
      const result = blocked ? await unblockUser(targetId) : await blockUser(targetId)
      if ('error' in result) setMessage(result.error)
      else { setBlocked(!blocked); setMessage(blocked ? 'User unblocked.' : `@${targetUsername} blocked.`) }
    })
  }
  const handleMute = () => {
    startTransition(async () => {
      const result = muted ? await unmuteUser(targetId) : await muteUser(targetId)
      if ('error' in result) setMessage(result.error)
      else { setMuted(!muted); setMessage(muted ? 'User unmuted.' : `@${targetUsername} muted.`) }
    })
  }

  return (
    <>
      <GMenu>
        <GMenuTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            aria-label={`More actions for @${targetUsername}`}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-hair-strong bg-panel text-ink-2 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember disabled:opacity-50 sm:size-9"
          >
            <MoreHorizontal aria-hidden strokeWidth={1.75} className="size-4" />
          </button>
        </GMenuTrigger>
        <GMenuContent align="end">
          <GMenuItem onSelect={handleMute} className="min-h-11">
            {muted ? <Bell aria-hidden strokeWidth={1.75} className="size-4 text-ink-3" /> : <BellOff aria-hidden strokeWidth={1.75} className="size-4 text-ink-3" />}
            {muted ? 'Unmute' : 'Mute'} @{targetUsername}
          </GMenuItem>
          <GMenuItem onSelect={handleBlock} className={cn('min-h-11', !blocked && 'text-gdanger data-[highlighted]:text-gdanger')}>
            {blocked ? <ShieldOff aria-hidden strokeWidth={1.75} className="size-4" /> : <Shield aria-hidden strokeWidth={1.75} className="size-4" />}
            {blocked ? 'Unblock' : 'Block'} @{targetUsername}
          </GMenuItem>
        </GMenuContent>
      </GMenu>
      <p role="status" aria-live="polite" className="sr-only">{message}</p>
    </>
  )
}
