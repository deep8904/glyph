'use client'

import { useState, useTransition } from 'react'
import { Shield, BellOff, ShieldOff, Bell } from 'lucide-react'
import { blockUser, unblockUser, muteUser, unmuteUser } from '@/app/actions/moderation'
import { reportContent } from '@/app/actions/admin'
import { MODERATION_REASONS } from '@/lib/supabase/types'

type Props = {
  targetId: string
  targetUsername: string
  isBlocked: boolean
  isMuted: boolean
  entityType?: string
  entityId?: string
}

export function BlockMuteButtons({ targetId, targetUsername, isBlocked: initialBlocked, isMuted: initialMuted, entityType, entityId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [muted, setMuted] = useState(initialMuted)
  const [message, setMessage] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')

  function handleBlock() {
    startTransition(async () => {
      const result = blocked ? await unblockUser(targetId) : await blockUser(targetId)
      if ('error' in result) { setMessage(result.error) }
      else { setBlocked(!blocked); setMessage(blocked ? 'User unblocked.' : `@${targetUsername} blocked.`) }
    })
  }

  function handleMute() {
    startTransition(async () => {
      const result = muted ? await unmuteUser(targetId) : await muteUser(targetId)
      if ('error' in result) { setMessage(result.error) }
      else { setMuted(!muted); setMessage(muted ? 'User unmuted.' : `@${targetUsername} muted.`) }
    })
  }

  function handleReport() {
    if (!reportReason || !entityType || !entityId) return
    startTransition(async () => {
      const result = await reportContent(entityType, entityId, reportReason, reportDesc)
      if ('error' in result) { setMessage(result.error) }
      else { setShowReport(false); setMessage('Report submitted. Thank you.') }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleBlock}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono transition-colors disabled:opacity-50 ${
            blocked ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
          aria-pressed={blocked}
        >
          {blocked ? <ShieldOff className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
          {blocked ? 'Unblock' : 'Block'}
        </button>
        <button
          onClick={handleMute}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono transition-colors disabled:opacity-50 ${
            muted ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
          aria-pressed={muted}
        >
          {muted ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
          {muted ? 'Unmute' : 'Mute'}
        </button>
        {entityType && entityId && (
          <button
            onClick={() => setShowReport(!showReport)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono text-gray-600 hover:border-gray-300 transition-colors"
          >
            Report
          </button>
        )}
      </div>

      {showReport && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Report Content</p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition"
          >
            <option value="">Select a reason…</option>
            {MODERATION_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <textarea
            value={reportDesc}
            onChange={(e) => setReportDesc(e.target.value)}
            placeholder="Additional details (optional)"
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              disabled={!reportReason || isPending}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              Submit Report
            </button>
            <button
              onClick={() => setShowReport(false)}
              className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:border-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="text-xs text-gray-500 font-mono" role="alert" aria-live="polite">{message}</p>
      )}
    </div>
  )
}
