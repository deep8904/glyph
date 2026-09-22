'use client'

import { useState, useTransition } from 'react'
import { updateEventStatus, acceptDemoSlot } from '@/app/actions/events'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Section } from '@/components/ui/Section'
import { StatusText } from '@/components/workflow/StatusLabel'

type Rsvp = { id: string; status: string; profiles: { username: string; display_name: string | null } | null }
type DemoSlot = { id: string; accepted: boolean; slot_time: string | null; projects: { title: string } | null; profiles: { username: string; display_name: string | null } | null }
type Event = { id: string; status: string; rsvp_count: number }

const STATE: Record<string, { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }> = {
  draft: { label: 'Draft — not public', tone: 'attention' },
  published: { label: 'Published', tone: 'positive' },
  completed: { label: 'Finished', tone: 'negative' },
  cancelled: { label: 'Cancelled', tone: 'negative' },
}
const RSVP: Record<string, { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }> = {
  going: { label: 'Going', tone: 'positive' },
  maybe: { label: 'Maybe', tone: 'attention' },
  cancelled: { label: 'Cancelled', tone: 'negative' },
}

/** The host's view of one event: where it stands and what can change, who is coming, and which projects want to demo. */
export function EventManageClient({ event, rsvps, demoSlots }: { event: Event; rsvps: Rsvp[]; demoSlots: DemoSlot[] }) {
  const [evtStatus, setEvtStatus] = useState(event.status)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [acceptedSlots, setAcceptedSlots] = useState<Record<string, boolean>>(Object.fromEntries(demoSlots.map((s) => [s.id, s.accepted])))

  const handleStatusChange = (status: 'published' | 'cancelled' | 'completed') => {
    setError('')
    startTransition(async () => {
      const result = await updateEventStatus(event.id, status)
      if (result?.error) setError(result.error)
      else setEvtStatus(status)
    })
  }

  const handleAcceptSlot = (slotId: string) => {
    setError('')
    startTransition(async () => {
      const result = await acceptDemoSlot(slotId, event.id)
      if (result?.error) setError(result.error)
      else setAcceptedSlots((prev) => ({ ...prev, [slotId]: true }))
    })
  }

  const going = rsvps.filter((r) => r.status === 'going')
  const maybe = rsvps.filter((r) => r.status === 'maybe')
  const st = STATE[evtStatus] ?? { label: evtStatus, tone: 'neutral' as const }

  return (
    <div className="space-y-8">
      <Section id="ev-state" title="Status" action={<StatusText label={st.label} tone={st.tone} />}>
        <div className="flex flex-wrap gap-2">
          {evtStatus !== 'published' && <Button variant="primary" onClick={() => handleStatusChange('published')} disabled={pending}>Publish</Button>}
          {evtStatus === 'published' && <Button variant="secondary" onClick={() => handleStatusChange('completed')} disabled={pending}>Mark as finished</Button>}
          {evtStatus !== 'cancelled' && <Button variant="danger" onClick={() => handleStatusChange('cancelled')} disabled={pending}>Cancel event</Button>}
        </div>
        {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
      </Section>

      <Section id="ev-rsvps" title="RSVPs" description={`${going.length} going, ${maybe.length} maybe`}>
        {rsvps.length === 0 ? (
          <EmptyState kind="first-use" className="border-y-0 py-2" title="No RSVPs yet" description="People who respond appear here." />
        ) : (
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            {rsvps.map((r) => {
              const s = RSVP[r.status] ?? { label: r.status, tone: 'neutral' as const }
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-body text-fg">
                  <span>{r.profiles?.display_name ?? r.profiles?.username ?? 'Someone'}</span>
                  <StatusText label={s.label} tone={s.tone} />
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section id="ev-demos" title="Demo requests" count={demoSlots.length || undefined} description="Projects offered for a demo. Accepted ones are listed on the event page.">
        {demoSlots.length === 0 ? (
          <EmptyState kind="first-use" className="border-y-0 py-2" title="No demo requests yet" description="Developers can offer a project from the event page." />
        ) : (
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            {demoSlots.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block text-body font-medium text-fg [overflow-wrap:anywhere]">{slot.projects?.title ?? 'Unknown project'}</span>
                  <span className="block text-small text-fg-muted">by {slot.profiles?.display_name ?? slot.profiles?.username}</span>
                </span>
                {acceptedSlots[slot.id] ? <StatusText label="Accepted" tone="positive" /> : <Button size="sm" variant="primary" onClick={() => handleAcceptSlot(slot.id)} disabled={pending}>Accept</Button>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
