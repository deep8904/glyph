'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function MarkAllReadButton({ recipientId }: { recipientId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleMarkAll = async () => {
    setLoading(true)
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', recipientId)
      .is('read_at', null)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleMarkAll}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
      Mark all read
    </button>
  )
}
