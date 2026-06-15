'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

export type EventInput = {
  title: string
  description: string
  city: string
  state: string
  country: string
  venue: string
  start_at: string
  end_at: string
  capacity: string
  type: 'meetup' | 'showcase' | 'jam_meetup' | 'talk' | 'workshop'
}

export async function createEvent(input: EventInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!input.title || input.title.length > 200) return { error: 'Title required (max 200 chars).' }
  if (!input.description || input.description.length > 5000) return { error: 'Description required (max 5000 chars).' }
  if (!input.city || input.city.length > 100) return { error: 'City required.' }
  if (!input.country || input.country.length > 100) return { error: 'Country required.' }
  if (!input.start_at || !input.end_at) return { error: 'Start and end times required.' }

  const start = new Date(input.start_at)
  const end = new Date(input.end_at)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: 'Invalid dates.' }
  if (end <= start) return { error: 'End must be after start.' }

  const cap = input.capacity ? parseInt(input.capacity) : null
  if (cap !== null && (isNaN(cap) || cap < 1)) return { error: 'Capacity must be a positive number.' }

  const { error } = await supabase.from('events').insert({
    host_id: user.id,
    title: stripDangerousUnicode(input.title.trim()),
    description: stripDangerousUnicode(input.description.trim()),
    city: stripDangerousUnicode(input.city.trim()),
    state: input.state ? stripDangerousUnicode(input.state.trim()) : null,
    country: stripDangerousUnicode(input.country.trim()),
    venue: input.venue ? stripDangerousUnicode(input.venue.trim()) : null,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    capacity: cap,
    type: input.type,
    status: 'published',
  })

  if (error) return { error: error.message }
  redirect('/events')
}

export async function rsvpToEvent(eventId: string, status: 'going' | 'maybe' | 'cancelled') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to RSVP.' }

  const { data: existing } = await supabase.from('event_rsvps').select('id, status').eq('event_id', eventId).eq('user_id', user.id).maybeSingle()

  if (existing) {
    await supabase.from('event_rsvps').update({ status }).eq('id', existing.id)
  } else {
    await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id, status })
  }

  // Update rsvp_count (going only)
  const { count } = await supabase.from('event_rsvps').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'going')
  await supabase.from('events').update({ rsvp_count: count ?? 0 }).eq('id', eventId)

  revalidatePath(`/events/${eventId}`)
  return { ok: true }
}

export async function requestDemoSlot(eventId: string, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to request a demo slot.' }

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('owner_id', user.id).maybeSingle()
  if (!project) return { error: 'Project not found or not yours.' }

  const { error } = await supabase.from('event_demo_slots').insert({ event_id: eventId, project_id: projectId, demoer_id: user.id })
  if (error?.code === '23505') return { error: 'You already requested a demo slot.' }
  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  return { ok: true }
}

export async function updateEventStatus(eventId: string, status: 'published' | 'cancelled' | 'completed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('events').update({ status }).eq('id', eventId).eq('host_id', user.id)
  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/events')
  return { ok: true }
}

export async function acceptDemoSlot(slotId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: event } = await supabase.from('events').select('host_id').eq('id', eventId).maybeSingle()
  if (!event || event.host_id !== user.id) return { error: 'Not authorized.' }

  await supabase.from('event_demo_slots').update({ accepted: true }).eq('id', slotId)
  revalidatePath(`/dashboard/events/${eventId}/manage`)
  return { ok: true }
}
