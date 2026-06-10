'use client'

import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function FollowButton({
  targetUserId,
  currentUserId,
  isFollowing: initialIsFollowing,
  onCountChange,
}: {
  targetUserId: string
  currentUserId: string | null
  isFollowing: boolean
  onCountChange?: (delta: number) => void
}) {
  const [following, setFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)

  if (!currentUserId || currentUserId === targetUserId) return null

  async function toggle() {
    setLoading(true)
    const supabase = createClient()

    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId!)
        .eq('following_id', targetUserId)
      setFollowing(false)
      onCountChange?.(-1)
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUserId!, following_id: targetUserId })
      setFollowing(true)
      onCountChange?.(1)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 font-sans text-sm font-medium transition disabled:opacity-50 ${
        following
          ? 'border border-[var(--color-glyph-border-hi)] bg-[var(--color-glyph-surface-2)] text-[var(--color-glyph-text-2)] hover:border-red-500/40 hover:text-red-400'
          : 'bg-[var(--color-glyph-orange)] text-white hover:bg-[#ff5c27]'
      }`}
    >
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
