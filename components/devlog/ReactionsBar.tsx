'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { REACTION_TYPES } from '@/lib/supabase/types'
import type { Reaction } from '@/lib/supabase/types'

type ReactionCount = { type: Reaction['reaction_type']; count: number; reacted: boolean }

export function ReactionsBar({
  devlogPostId,
  devlogAuthorId,
  currentUserId,
  initialCounts,
}: {
  devlogPostId: string
  devlogAuthorId: string
  currentUserId: string | null
  initialCounts: ReactionCount[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [counts, setCounts] = useState<ReactionCount[]>(initialCounts)
  const [pending, setPending] = useState<Reaction['reaction_type'] | null>(null)

  const toggle = async (type: Reaction['reaction_type']) => {
    if (!currentUserId || pending) return
    setPending(type)

    const existing = counts.find((c) => c.type === type)
    const hasReacted = existing?.reacted ?? false

    // Optimistic update
    setCounts((prev) =>
      prev.map((c) =>
        c.type === type
          ? { ...c, count: hasReacted ? c.count - 1 : c.count + 1, reacted: !c.reacted }
          : c
      )
    )

    if (hasReacted) {
      await supabase
        .from('reactions')
        .delete()
        .eq('user_id', currentUserId)
        .eq('devlog_post_id', devlogPostId)
        .eq('reaction_type', type)
    } else {
      await supabase.from('reactions').insert({
        user_id: currentUserId,
        devlog_post_id: devlogPostId,
        reaction_type: type,
      })
      if (devlogAuthorId !== currentUserId) {
        await supabase.from('notifications').insert({
          recipient_id: devlogAuthorId,
          actor_id: currentUserId,
          type: 'reaction',
          entity_type: 'devlog_post',
          entity_id: devlogPostId,
        })
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
            className={`inline-flex h-10 items-center gap-2 rounded-control border px-3 text-small transition-colors duration-150 disabled:pointer-events-none pointer-coarse:h-11 ${
              reacted
                ? 'border-accent-line bg-accent-subtle text-link'
                : currentUserId
                ? 'border-line-strong bg-surface text-fg-secondary hover:bg-surface-muted'
                : 'border-line bg-surface text-fg-muted'
            }`}
          >
            <span aria-hidden>{emoji}</span>
            {total > 0 && <span className="font-mono text-micro font-medium">{total}</span>}
          </button>
        )
      })}
      {!currentUserId && <span className="text-small text-fg-muted">Sign in to react</span>}
    </div>
  )
}
