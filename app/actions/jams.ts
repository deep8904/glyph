'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugify, stripDangerousUnicode } from '@/lib/utils'

export type JamInput = {
  title: string
  description: string
  theme: string
  start_at: string
  end_at: string
  voting_start_at: string
  voting_end_at: string
  rules: string
  max_team_size: number
  allow_existing_assets: boolean
}

export async function createGameJam(input: JamInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!input.title || input.title.length > 200) return { error: 'Title required (max 200 chars).' }
  if (!input.description || input.description.length > 10000) return { error: 'Description required (max 10000 chars).' }
  if (input.rules && input.rules.length > 20000) return { error: 'Rules max 20000 chars.' }
  if (!input.start_at || !input.end_at || !input.voting_start_at || !input.voting_end_at) return { error: 'All dates required.' }

  const start = new Date(input.start_at)
  const end = new Date(input.end_at)
  const voteStart = new Date(input.voting_start_at)
  const voteEnd = new Date(input.voting_end_at)

  if ([start, end, voteStart, voteEnd].some((d) => isNaN(d.getTime()))) return { error: 'Invalid dates.' }
  if (end <= start) return { error: 'End must be after start.' }
  if (voteStart < end) return { error: 'Voting must start after the jam ends.' }
  if (voteEnd <= voteStart) return { error: 'Voting end must be after voting start.' }
  if (input.max_team_size < 1 || input.max_team_size > 20) return { error: 'Team size 1–20.' }

  const slug = slugify(input.title)
  if (!slug || slug.length < 2) return { error: 'Title too short to generate a valid slug.' }

  const { error } = await supabase.from('game_jams').insert({
    host_id: user.id,
    title: stripDangerousUnicode(input.title.trim()),
    slug,
    description: stripDangerousUnicode(input.description.trim()),
    theme: input.theme ? stripDangerousUnicode(input.theme.trim().slice(0, 200)) : null,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    voting_start_at: voteStart.toISOString(),
    voting_end_at: voteEnd.toISOString(),
    rules: input.rules ? stripDangerousUnicode(input.rules.trim()) : null,
    max_team_size: input.max_team_size,
    allow_existing_assets: input.allow_existing_assets,
    admin_approved: false,
  })

  if (error?.code === '23505') return { error: 'A jam with that title slug already exists. Choose a different title.' }
  if (error) return { error: error.message }

  redirect('/jams')
}

export async function submitJamEntry(input: {
  jam_id: string
  project_id: string
  submission_url: string
  submission_notes: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to submit.' }

  if (input.submission_url && input.submission_url.length > 500) return { error: 'URL max 500 chars.' }
  if (input.submission_notes && input.submission_notes.length > 2000) return { error: 'Notes max 2000 chars.' }

  const { data: jam } = await supabase.from('game_jams').select('status, end_at, admin_approved').eq('id', input.jam_id).maybeSingle()
  if (!jam) return { error: 'Jam not found.' }
  if (!jam.admin_approved) return { error: 'Jam not yet approved.' }
  if (jam.status !== 'running') return { error: 'Submissions are not open.' }

  const { data: project } = await supabase.from('projects').select('id').eq('id', input.project_id).eq('owner_id', user.id).maybeSingle()
  if (!project) return { error: 'Project not found or not yours.' }

  const { error } = await supabase.from('jam_entries').insert({
    jam_id: input.jam_id,
    project_id: input.project_id,
    team_lead_id: user.id,
    submission_url: input.submission_url || null,
    submission_notes: input.submission_notes ? stripDangerousUnicode(input.submission_notes.trim()) : null,
  })
  if (error?.code === '23505') return { error: 'You already submitted this project.' }
  if (error) return { error: error.message }

  revalidatePath(`/jams/${jam}`)
  return { ok: true }
}

export async function castJamVote(input: {
  entry_id: string
  category: 'overall' | 'innovation' | 'fun' | 'theme' | 'visuals' | 'audio'
  score: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to vote.' }

  if (input.score < 1 || input.score > 5) return { error: 'Score must be 1–5.' }

  const { data: entry } = await supabase.from('jam_entries').select('team_lead_id, jam_id').eq('id', input.entry_id).maybeSingle()
  if (!entry) return { error: 'Entry not found.' }
  if (entry.team_lead_id === user.id) return { error: "You can't vote on your own entry." }

  const { data: jam } = await supabase.from('game_jams').select('status').eq('id', entry.jam_id).maybeSingle()
  if (!jam || jam.status !== 'voting') return { error: 'Voting is not open.' }

  const { data: existing } = await supabase.from('jam_votes').select('id').eq('entry_id', input.entry_id).eq('voter_id', user.id).eq('category', input.category).maybeSingle()

  if (existing) {
    await supabase.from('jam_votes').update({ score: input.score }).eq('id', existing.id)
  } else {
    await supabase.from('jam_votes').insert({ entry_id: input.entry_id, voter_id: user.id, category: input.category, score: input.score })
  }

  // Update votes_count
  const { count } = await supabase.from('jam_votes').select('id', { count: 'exact', head: true }).eq('entry_id', input.entry_id)
  await supabase.from('jam_entries').update({ votes_count: Math.round((count ?? 0) / 6) }).eq('id', input.entry_id)

  return { ok: true }
}
