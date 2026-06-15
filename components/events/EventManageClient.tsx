'use client'

import { useState, useTransition } from 'react'
import { Check, X, Loader2, Users, Presentation } from 'lucide-react'
import { updateEventStatus, acceptDemoSlot } from '@/app/actions/events'

type Rsvp = { id: string; status: string; profiles: { username: string; display_name: string | null } | null }
type DemoSlot = { id: string; accepted: boolean; slot_time: string | null; projects: { title: string } | null; profiles: { username: string; display_name: string | null } | null }
type Event = { id: string; status: string; rsvp_count: number }

const STATUS_COLORS: Record<string, string> = {
  going: 'bg-green-50 text-green-700',
  maybe: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function EventManageClient({ event, rsvps, demoSlots }: { event: Event; rsvps: Rsvp[]; demoSlots: DemoSlot[] }) {
  const [evtStatus, setEvtStatus] = useState(event.status)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [acceptedSlots, setAcceptedSlots] = useState<Record<string, boolean>>(
    Object.fromEntries(demoSlots.map((s) => [s.id, s.accepted]))
  )

  const handleStatusChange = (status: 'published' | 'cancelled' | 'completed') => {
    startTransition(async () => {
      const result = await updateEventStatus(event.id, status)
      if (result?.error) setError(result.error)
      else setEvtStatus(status)
    })
  }

  const handleAcceptSlot = (slotId: string) => {
    startTransition(async () => {
      const result = await acceptDemoSlot(slotId, event.id)
      if (result?.error) setError(result.error)
      else setAcceptedSlots((prev) => ({ ...prev, [slotId]: true }))
    })
  }

  const going = rsvps.filter((r) => r.status === 'going')
  const maybe = rsvps.filter((r) => r.status === 'maybe')

  return (
    <div className="space-y-8">
      {/* Status controls */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-3">Event Status</div>
        <div className="flex flex-wrap gap-2">
          {evtStatus !== 'published' && (
            <button onClick={() => handleStatusChange('published')} disabled={pending} className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60">
              Publish
            </button>
          )}
          {evtStatus === 'published' && (
            <button onClick={() => handleStatusChange('completed')} disabled={pending} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
              Mark Completed
            </button>
          )}
          {evtStatus !== 'cancelled' && (
            <button onClick={() => handleStatusChange('cancelled')} disabled={pending} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
              Cancel Event
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs font-mono text-red-500">{error}</p>}
      </div>

      {/* RSVPs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-indigo-500" />
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400">RSVPs ({going.length} going, {maybe.length} maybe)</h2>
        </div>
        {rsvps.length === 0 ? (
          <p className="text-sm text-gray-400">No RSVPs yet.</p>
        ) : (
          <div className="space-y-2">
            {rsvps.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-2.5">
                <span className="text-sm text-gray-900">{r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous'}</span>
                <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Demo slots */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Presentation className="h-4 w-4 text-indigo-500" />
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400">Demo Slot Requests ({demoSlots.length})</h2>
        </div>
        {demoSlots.length === 0 ? (
          <p className="text-sm text-gray-400">No demo slot requests yet.</p>
        ) : (
          <div className="space-y-2">
            {demoSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">{slot.projects?.title ?? 'Unknown project'}</span>
                  <span className="ml-2 text-[11px] font-mono text-gray-400">by {slot.profiles?.display_name ?? slot.profiles?.username}</span>
                </div>
                {acceptedSlots[slot.id] ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-green-600"><Check className="h-3 w-3" /> Accepted</span>
                ) : (
                  <button onClick={() => handleAcceptSlot(slot.id)} disabled={pending} className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
                    {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Accept
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
