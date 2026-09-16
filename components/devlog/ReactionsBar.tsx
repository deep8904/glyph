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
    <div className="flex flex-wrap gap-2">
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const count = counts.find((c) => c.type === type)
        const reacted = count?.reacted ?? false
        const total = count?.count ?? 0
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            disabled={!currentUserId || pending === type}
            title={label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-200 disabled:pointer-events-none ${
              reacted
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : currentUserId
                ? 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                : 'border-gray-100 bg-white text-gray-500 cursor-default'
            }`}
          >
            <span>{emoji}</span>
            {total > 0 && <span className="text-xs font-mono font-medium">{total}</span>}
          </button>
        )
      })}
      {!currentUserId && (
        <span className="self-center text-xs text-gray-400 font-mono">
          Sign in to react
        </span>
      )}
    </div>
  )
}
