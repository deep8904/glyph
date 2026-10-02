'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GButton } from '@/components/glyph/ui/primitives'

/**
 * Same follow/unfollow data contract as the legacy button — direct `follows` insert/delete, a
 * follow notification on insert, `router.refresh()` after — rebuilt with new Glyph presentation.
 * Follow is the one Ember action on a non-owner profile; once following, it becomes a quiet outline
 * state (not a second Ember affirmation) so the page never shows two equivalent primaries.
 */
export function GlyphFollowButton({ targetId, currentUserId, initialFollowing }: { targetId: string; currentUserId: string | null; initialFollowing: boolean }) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  if (!currentUserId || currentUserId === targetId) return null

  const handleToggle = async () => {
    setLoading(true)
    const supabase = createClient()
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('followed_id', targetId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, followed_id: targetId })
      await supabase.from('notifications').insert({ recipient_id: targetId, actor_id: currentUserId, type: 'follow', entity_type: 'profile', entity_id: targetId })
      setFollowing(true)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <GButton onClick={handleToggle} disabled={loading} aria-pressed={following} variant={following ? 'outline' : 'ember'} size="md">
      {!loading && (following ? <Check aria-hidden strokeWidth={1.75} className="size-4" /> : <UserPlus aria-hidden strokeWidth={1.75} className="size-4" />)}
      {following ? 'Following' : 'Follow'}
    </GButton>
  )
}
