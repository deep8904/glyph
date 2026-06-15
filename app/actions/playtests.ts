'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

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

  if (!input.build_url || input.build_url.length > 500) return { error: 'Build URL required (max 500 chars).' }
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
    build_url: stripDangerousUnicode(input.build_url.trim()),
    build_type: input.build_type,
    platforms: input.platforms,
    description: stripDangerousUnicode(input.description.trim()),
    focus_areas: input.focus_areas,
    requested_testers: input.requested_testers,
  })

  if (error) return { error: error.message }
  redirect('/dashboard/playtests')
}

export async function requestPlaytestSession(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to request a playtest session.' }

  // Max 3 concurrent sessions per tester
  const { count } = await supabase
    .from('playtest_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('tester_id', user.id)
    .in('status', ['requested', 'accepted'])
  if ((count ?? 0) >= 3) return { error: 'You can have at most 3 active sessions at a time.' }

  // Can't test your own request
  const { data: req } = await supabase.from('playtest_requests').select('author_id').eq('id', requestId).maybeSingle()
  if (!req) return { error: 'Playtest request not found.' }
  if (req.author_id === user.id) return { error: 'You cannot test your own game.' }

  const { error } = await supabase.from('playtest_sessions').insert({ request_id: requestId, tester_id: user.id })
  if (error?.code === '23505') return { error: 'You already have a session for this playtest.' }
  if (error) return { error: error.message }
  return { ok: true }
}

export async function updateSessionStatus(sessionId: string, status: 'accepted' | 'skipped') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: session } = await supabase.from('playtest_sessions').select('request_id, tester_id').eq('id', sessionId).maybeSingle()
  if (!session) return { error: 'Session not found.' }

  const { data: req } = await supabase.from('playtest_requests').select('author_id').eq('id', session.request_id).maybeSingle()
  if (!req || req.author_id !== user.id) return { error: 'Not authorized to update this session.' }

  const { error } = await supabase.from('playtest_sessions').update({ status }).eq('id', sessionId)
  if (error) return { error: error.message }
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
  if (!user) return { error: 'Unauthorized' }

  const { data: session } = await supabase.from('playtest_sessions').select('tester_id, status').eq('id', input.sessionId).maybeSingle()
  if (!session || session.tester_id !== user.id) return { error: 'Session not found.' }
  if (session.status !== 'accepted') return { error: 'Session must be accepted before submitting feedback.' }

  // Validate ratings: 1-10
  for (const [, v] of Object.entries(input.ratings)) {
    if (typeof v !== 'number' || v < 1 || v > 10) return { error: 'Ratings must be 1–10.' }
  }

  // Validate text responses length
  for (const [, v] of Object.entries(input.text_responses)) {
    if (typeof v !== 'string' || v.length > 2000) return { error: 'Text responses max 2000 chars each.' }
  }

  const { error: feedbackError } = await supabase.from('playtest_feedback').insert({
    session_id: input.sessionId,
    ratings: input.ratings,
    text_responses: input.text_responses,
    time_spent_minutes: input.time_spent_minutes,
    is_private: input.is_private,
  })
  if (feedbackError) return { error: feedbackError.message }

  await supabase.from('playtest_sessions').update({ status: 'completed' }).eq('id', input.sessionId)

  redirect('/dashboard/playtests')
}
