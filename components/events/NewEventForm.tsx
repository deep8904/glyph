'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/app/actions/events'
import { EVENT_TYPES } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'

export function NewEventForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [venue, setVenue] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [capacity, setCapacity] = useState('')
  const [type, setType] = useState<'meetup' | 'showcase' | 'jam_meetup' | 'talk' | 'workshop'>('meetup')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createEvent({ title, description, city, state, country, venue, start_at: startAt, end_at: endAt, capacity, type })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section aria-labelledby="ev-what" className="space-y-4">
        <h2 id="ev-what" className="text-h3 font-semibold text-fg">What it is</h2>
        <Field label="Title" required>{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Indie Dev Meetup — Berlin" maxLength={200} />}</Field>
        <Field label="Kind" required>{(p) => <Select {...p} value={type} onChange={(e) => setType(e.target.value as typeof type)}>{EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>}</Field>
        <Field label="Description" required hint={`${description.length}/5000`}>{(p) => <Textarea {...p} rows={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will happen? What should people bring or expect?" />}</Field>
      </section>

      <section aria-labelledby="ev-when" className="space-y-4 border-t border-line pt-6">
        <h2 id="ev-when" className="text-h3 font-semibold text-fg">When and where</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" required>{(p) => <Input {...p} type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />}</Field>
          <Field label="Ends" required>{(p) => <Input {...p} type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />}</Field>
        </div>
        <Field label="Venue" hint="Optional.">{(p) => <Input {...p} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Impact Hub, Floor 3" maxLength={200} />}</Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" required>{(p) => <Input {...p} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" maxLength={100} />}</Field>
          <Field label="State or region" hint="Optional.">{(p) => <Input {...p} value={state} onChange={(e) => setState(e.target.value)} maxLength={100} />}</Field>
          <Field label="Country" required>{(p) => <Input {...p} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Germany" maxLength={100} />}</Field>
        </div>
        <Field label="Capacity" hint="Optional. Leave blank for unlimited." className="max-w-48">{(p) => <Input {...p} type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />}</Field>
      </section>

      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-small text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.push('/events')}>Cancel</Button>
        <Button type="submit" variant="primary" loading={pending}>Publish event</Button>
      </div>
    </form>
  )
}
