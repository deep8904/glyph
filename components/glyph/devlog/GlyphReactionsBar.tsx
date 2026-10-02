'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { REACTION_TYPES } from '@/lib/supabase/types'
import type { Reaction } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

type ReactionCount = { type: Reaction['reaction_type']; count: number; reacted: boolean }

/**
 * Same reactions contract as the legacy bar — toggle insert/delete on `reactions`, a `reaction`
 * notification on insert (never for a self-reaction), optimistic count update, one active reaction
 * lit Ember, everything else quiet outline. Not a big engagement bar — a small, dated response
 * strip that matches the log-entry scale of the rest of the page.
 */
export function GlyphReactionsBar({ devlogPostId, devlogAuthorId, currentUserId, initialCounts }: {
  devlogPostId: string
  devlogAuthorId: string
  currentUserId: string | null
  initialCounts: ReactionCount[]
}) {
  const router = useRouter()
  const [counts, setCounts] = useState(initialCounts)
  const [pending, setPending] = useState<Reaction['reaction_type'] | null>(null)

  const toggle = async (type: Reaction['reaction_type']) => {
    if (!currentUserId || pending) return
    setPending(type)
    const supabase = createClient()
    const existing = counts.find((c) => c.type === type)
    const hasReacted = existing?.reacted ?? false

    setCounts((prev) => prev.map((c) => (c.type === type ? { ...c, count: hasReacted ? c.count - 1 : c.count + 1, reacted: !c.reacted } : c)))

    if (hasReacted) {
      await supabase.from('reactions').delete().eq('user_id', currentUserId).eq('devlog_post_id', devlogPostId).eq('reaction_type', type)
    } else {
      await supabase.from('reactions').insert({ user_id: currentUserId, devlog_post_id: devlogPostId, reaction_type: type })
      if (devlogAuthorId !== currentUserId) {
        await supabase.from('notifications').insert({ recipient_id: devlogAuthorId, actor_id: currentUserId, type: 'reaction', entity_type: 'devlog_post', entity_id: devlogPostId })
      }
    }
    setPending(null)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const count = counts.find((c) => c.type === type)
        const reacted = count?.reacted ?? false
        const total = count?.count ?? 0
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            disabled={!currentUserId || pending === type}
            aria-pressed={reacted}
            aria-label={total > 0 ? `${label}, ${total}` : label}
            title={label}
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-small outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember disabled:pointer-events-none sm:min-h-9 sm:min-w-0',
              reacted ? 'border-ember-line bg-ember-quiet text-ember-ink' : currentUserId ? 'border-hair-strong bg-panel text-ink-2 hover:bg-sunken' : 'border-hair bg-panel text-ink-3'
            )}
          >
            <span aria-hidden>{emoji}</span>
            {total > 0 && <span className="font-mono text-micro font-medium tabular-nums">{total}</span>}
          </button>
        )
      })}
      {!currentUserId && <span className="text-small text-ink-3">
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">Sign in</Link> to react
      </span>}
    </div>
  )
}
