'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

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
    <Button
      onClick={handleToggle}
      loading={loading}
      aria-pressed={following}
      variant={following ? 'secondary' : 'primary'}
    >
      {!loading && (following ? <Check aria-hidden strokeWidth={1.75} className="size-4" /> : <UserPlus aria-hidden strokeWidth={1.75} className="size-4" />)}
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
