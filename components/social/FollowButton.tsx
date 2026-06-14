'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, UserMinus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function FollowButton({
  targetId,
  currentUserId,
  initialFollowing,
}: {
  targetId: string
  currentUserId: string | null
  initialFollowing: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  if (!currentUserId || currentUserId === targetId) return null

  const handleToggle = async () => {
    setLoading(true)
    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('followed_id', targetId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUserId,
        followed_id: targetId,
      })
      // Notify the followed user
      await supabase.from('notifications').insert({
        recipient_id: targetId,
        actor_id: currentUserId,
        type: 'follow',
        entity_type: 'profile',
        entity_id: targetId,
      })
      setFollowing(true)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none ${
        following
          ? 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-600'
          : 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 shadow-lg shadow-indigo-600/20'
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
