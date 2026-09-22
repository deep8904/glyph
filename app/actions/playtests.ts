'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { stripDangerousUnicode, isHttpsUrl } from '@/lib/utils'

/*
 * Lifecycle rules (capacity, who may change a session, valid transitions, the
 * tester counter, notifications) are enforced in the database by migration 032.
 * These actions validate input and surface the database's own messages
 * (SQLSTATE P0001); they no longer read-modify-write counters.
 */
type DbError = { code?: string; message: string } | null
function friendly(error: DbError, fallback: string): string {
  if (!error) return fallback
  if (error.code === 'P0001') return error.message
  if (error.code === '23505') return 'You already have a sign-up for this playtest.'
  return fallback
}

export type PlaytestRequestInput = {
  project_id: string
  build_url: string
  build_type: 'browser' | 'download' | 'steam_key'
  platforms: string[]
  description: string
  focus_areas: string[]
  requested_testers: number
}

export async function createPlaytestRequest(input: PlaytestRequestInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const buildUrl = (input.build_url ?? '').trim()
  if (!buildUrl || buildUrl.length > 500) return { error: 'Build link required (max 500 chars).' }
  // Browser and download builds are rendered as links, so they must be https.
  if (input.build_type !== 'steam_key' && !isHttpsUrl(buildUrl)) return { error: 'Build link must be a full https:// URL.' }
  if (!input.description || input.description.length > 5000) return { error: 'Description required (max 5000 chars).' }
  if (!['browser', 'download', 'steam_key'].includes(input.build_type)) return { error: 'Invalid build type.' }
  if (input.requested_testers < 1 || input.requested_testers > 50) return { error: 'Requested testers must be 1–50.' }

  // Verify project ownership
  const { data: project } = await supabase.from('projects').select('id').eq('id', input.project_id).eq('owner_id', user.id).maybeSingle()
  if (!project) return { error: 'Project not found or not yours.' }

  // Max 5 active requests per user
  const { count } = await supabase.from('playtest_requests').select('id', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'open')
  if ((count ?? 0) >= 5) return { error: 'You can have at most 5 open playtest requests at a time.' }

  const { error } = await supabase.from('playtest_requests').insert({
    project_id: input.project_id,
    author_id: user.id,
    build_url: stripDangerousUnicode(buildUrl),
    build_type: input.build_type,
    platforms: input.platforms,
    description: stripDangerousUnicode(input.description.trim()),
    focus_areas: input.focus_areas,
    requested_testers: input.requested_testers,
  })

  if (error) return { error: 'Could not create the playtest. Try again.' }
  redirect('/dashboard/playtests')
}

export async function requestPlaytestSession(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to sign up as a tester.' }

  // Open/full/closed, own game, private project, blocks, the 3-active-session
  // limit and duplicates are all enforced by playtest_sessions_guard.
  const { data: session, error } = await supabase
    .from('playtest_sessions')
    .insert({ request_id: requestId, tester_id: user.id })
    .select('id')
    .single()
  if (error || !session) return { error: friendly(error, 'Could not sign you up. Try again.') }

  revalidatePath(`/playtests/${requestId}`)
  return { ok: true, sessionId: session.id }
}

/** A tester who withdrew may sign up again while the playtest is open. */
export async function resignupPlaytestSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }

  const { data, error } = await supabase
    .from('playtest_sessions')
    .update({ status: 'requested' })
    .eq('id', sessionId)
    .eq('tester_id', user.id)
    .select('request_id')
  if (error) return { error: friendly(error, 'Could not sign you up again. Try again.') }
  if (!data || data.length === 0) return { error: 'Sign-up not found.' }

  revalidatePath(`/playtests/${data[0].request_id}`)
  return { ok: true }
}

export async function updateSessionStatus(sessionId: string, status: 'accepted' | 'skipped') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }
  if (status !== 'accepted' && status !== 'skipped') return { error: 'Invalid decision.' }

  // Only the playtest's developer can decide (RLS + guard); capacity is checked in the guard.
  const { data, error } = await supabase
    .from('playtest_sessions')
    .update({ status })
    .eq('id', sessionId)
    .select('request_id')
  if (error) return { error: friendly(error, 'Could not save your decision. Try again.') }
  if (!data || data.length === 0) return { error: 'Sign-up not found or not yours to decide.' }

  revalidatePath('/dashboard/playtests')
  revalidatePath(`/playtests/${data[0].request_id}`)
  return { ok: true }
}

export async function withdrawPlaytestSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }

  const { data, error } = await supabase
    .from('playtest_sessions')
    .update({ status: 'withdrawn' })
    .eq('id', sessionId)
    .eq('tester_id', user.id)
    .select('request_id')
  if (error) return { error: friendly(error, 'Could not withdraw. Try again.') }
  if (!data || data.length === 0) return { error: 'Sign-up not found.' }

  revalidatePath(`/playtests/${data[0].request_id}`)
  revalidatePath('/dashboard/playtests')
  return { ok: true }
}

/** Developer closes sign-ups, or reopens (it becomes 'full' automatically if capacity is already reached). */
export async function setPlaytestOpen(requestId: string, open: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }

  const { data, error } = await supabase
    .from('playtest_requests')
    .update({ status: open ? 'open' : 'closed' })
    .eq('id', requestId)
    .eq('author_id', user.id)
    .select('id')
  if (error) return { error: 'Could not update the playtest. Try again.' }
  if (!data || data.length === 0) return { error: 'Playtest not found.' }

  revalidatePath('/dashboard/playtests')
  revalidatePath(`/playtests/${requestId}`)
  return { ok: true }
}

export async function submitPlaytestFeedback(input: {
  sessionId: string
  ratings: Record<string, number>
  text_responses: Record<string, string>
  time_spent_minutes: number | null
  is_private: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }

  const { data: session } = await supabase
    .from('playtest_sessions')
    .select('request_id, tester_id, status')
    .eq('id', input.sessionId)
    .maybeSingle()
  if (!session || session.tester_id !== user.id) return { error: 'Session not found.' }
  if (session.status === 'completed') return { error: 'You already submitted feedback for this session.' }
  if (session.status !== 'accepted') return { error: 'Feedback can only be submitted once you have been accepted.' }

  for (const v of Object.values(input.ratings)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1 || v > 10) return { error: 'Ratings must be 1–10.' }
  }
  const text: Record<string, string> = {}
  for (const [k, v] of Object.entries(input.text_responses)) {
    if (typeof v !== 'string' || v.length > 2000) return { error: 'Text responses max 2000 chars each.' }
    if (v.trim()) text[k] = stripDangerousUnicode(v.trim())
  }
  const minutes = input.time_spent_minutes
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 9999)) return { error: 'Time spent must be 1–9999 minutes.' }

  // The database completes the session and notifies the developer when this
  // row is inserted (playtest_feedback_after); there is exactly one feedback per session.
  const { error } = await supabase.from('playtest_feedback').insert({
    session_id: input.sessionId,
    ratings: input.ratings,
    text_responses: text,
    time_spent_minutes: minutes,
    is_private: input.is_private,
  })
  if (error) return { error: friendly(error, 'Could not submit your feedback. Try again.') }

  revalidatePath('/dashboard/playtests')
  redirect(`/playtests/${session.request_id}`)
}
