'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createEvent } from '@/app/actions/events'
import { EVENT_TYPES } from '@/lib/supabase/types'

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelCls}>Event Title *</label>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Indie Dev Meetup — Berlin" maxLength={200} required />
      </div>

      <div>
        <label className={labelCls}>Event Type *</label>
        <select className={selectCls} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Description *</label>
        <textarea className={`${inputCls} resize-none`} rows={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will happen at this event? What should people bring or expect?" required />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{description.length}/5000</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Start Date & Time *</label>
          <input type="datetime-local" className={inputCls} value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>End Date & Time *</label>
          <input type="datetime-local" className={inputCls} value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className={labelCls}>Venue (optional)</label>
        <input className={inputCls} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Impact Hub, Floor 3" maxLength={200} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>City *</label>
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" maxLength={100} required />
        </div>
        <div>
          <label className={labelCls}>State / Region</label>
          <input className={inputCls} value={state} onChange={(e) => setState(e.target.value)} placeholder="Optional" maxLength={100} />
        </div>
        <div>
          <label className={labelCls}>Country *</label>
          <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Germany" maxLength={100} required />
        </div>
      </div>

      <div>
        <label className={labelCls}>Capacity (optional)</label>
        <input type="number" min={1} className={inputCls} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Leave blank for unlimited" />
      </div>

      {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
        <button type="button" onClick={() => router.push('/events')} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300">
          Cancel
        </button>
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish Event
        </button>
      </div>
    </form>
  )
}
