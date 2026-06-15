export type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  location: string | null
  avatar_url: string | null
  primary_role: string | null
  primary_engine: string | null
  experience_level: string | null
  collaboration_status: string
  github_url: string | null
  itchio_url: string | null
  twitter_url: string | null
  website_url: string | null
  is_onboarded: boolean
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  owner_id: string
  title: string
  short_description: string | null
  long_description: string | null
  slug: string | null
  engine: string | null
  genre: string | null
  stage: string | null
  cover_url: string | null
  cover_image_url: string | null
  tags: string[]
  screenshots: string[]
  external_links: Record<string, string>
  visibility: 'public' | 'unlisted' | 'private'
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type DevlogPost = {
  id: string
  project_id: string
  author_id: string
  slug: string
  title: string
  content: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export type Reaction = {
  id: string
  user_id: string
  devlog_post_id: string
  reaction_type: 'like' | 'helpful' | 'inspiring' | 'question'
  created_at: string
}

export type Comment = {
  id: string
  author_id: string
  devlog_post_id: string
  parent_comment_id: string | null
  content: string
  created_at: string
  updated_at: string
}

// Shared option lists for onboarding selects and label lookups.
export const ROLES = [
  { value: 'programmer', label: 'Programmer' },
  { value: 'artist', label: 'Artist' },
  { value: 'designer', label: 'Designer' },
  { value: 'composer', label: 'Composer / Audio' },
  { value: 'writer', label: 'Writer / Narrative' },
  { value: 'generalist', label: 'Generalist' },
] as const

export const ENGINES = [
  { value: 'unity', label: 'Unity' },
  { value: 'unreal', label: 'Unreal' },
  { value: 'godot', label: 'Godot' },
  { value: 'gamemaker', label: 'GameMaker' },
  { value: 'custom', label: 'Custom / In-house' },
  { value: 'other', label: 'Other' },
] as const

export const EXPERIENCE_LEVELS = [
  { value: 'student', label: 'Student' },
  { value: 'hobbyist', label: 'Hobbyist' },
  { value: 'indie', label: 'Indie' },
  { value: 'professional', label: 'Professional' },
] as const

export const PROJECT_STAGES = [
  { value: 'concept', label: 'Concept' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'released', label: 'Released' },
] as const

export const COLLAB_STATUS = [
  { value: 'open', label: 'Open to Collaborate' },
  { value: 'selective', label: 'Selectively Open' },
  { value: 'closed', label: 'Not Available' },
] as const

export const REACTION_TYPES = [
  { type: 'like' as const, emoji: '❤️', label: 'Like' },
  { type: 'helpful' as const, emoji: '💡', label: 'Helpful' },
  { type: 'inspiring' as const, emoji: '🔥', label: 'Inspiring' },
  { type: 'question' as const, emoji: '🤔', label: 'Question' },
]

// ── V4 Types ──────────────────────────────────────────────────

export type PlaytestRequest = {
  id: string
  project_id: string
  author_id: string
  build_url: string
  build_type: 'browser' | 'download' | 'steam_key'
  platforms: string[]
  description: string
  focus_areas: string[]
  requested_testers: number
  current_testers: number
  status: 'open' | 'closed' | 'full'
  created_at: string
  updated_at: string
}

export type PlaytestSession = {
  id: string
  request_id: string
  tester_id: string
  status: 'requested' | 'accepted' | 'completed' | 'skipped'
  created_at: string
  updated_at: string
}

export type PlaytestFeedback = {
  id: string
  session_id: string
  ratings: Record<string, number>
  text_responses: Record<string, string>
  time_spent_minutes: number | null
  is_private: boolean
  usefulness_rating: number | null
  created_at: string
}

export type Event = {
  id: string
  host_id: string
  title: string
  description: string
  city: string
  state: string | null
  country: string
  lat: number | null
  lng: number | null
  venue: string | null
  start_at: string
  end_at: string
  capacity: number | null
  rsvp_count: number
  cover_image_url: string | null
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  type: 'meetup' | 'showcase' | 'jam_meetup' | 'talk' | 'workshop'
  created_at: string
  updated_at: string
}

export type EventRsvp = {
  id: string
  event_id: string
  user_id: string
  status: 'going' | 'maybe' | 'cancelled'
  created_at: string
}

export type CollaborationPost = {
  id: string
  project_id: string | null
  author_id: string
  post_type: 'seeking_collaborator' | 'available_to_collaborate'
  role_needed: string | null
  role_offered: string | null
  contract_type: 'full_time' | 'part_time' | 'freelance' | 'rev_share' | 'volunteer'
  compensation_range: string | null
  time_commitment: string | null
  remote_allowed: boolean
  location: string | null
  description: string
  status: 'open' | 'filled' | 'closed'
  expires_at: string
  created_at: string
  updated_at: string
}

export type CollaborationApplication = {
  id: string
  post_id: string
  applicant_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export type GameJam = {
  id: string
  host_id: string
  title: string
  slug: string
  description: string
  theme: string | null
  start_at: string
  end_at: string
  voting_start_at: string
  voting_end_at: string
  rules: string | null
  prizes: Record<string, string> | null
  max_team_size: number
  allow_existing_assets: boolean
  status: 'upcoming' | 'running' | 'voting' | 'completed' | 'cancelled'
  admin_approved: boolean
  created_at: string
  updated_at: string
}

export type JamEntry = {
  id: string
  jam_id: string
  project_id: string
  team_lead_id: string
  submission_url: string | null
  submission_notes: string | null
  submitted_at: string
  ranking: number | null
  votes_count: number
}

export type JamVote = {
  id: string
  entry_id: string
  voter_id: string
  category: 'overall' | 'innovation' | 'fun' | 'theme' | 'visuals' | 'audio'
  score: number
  created_at: string
}

export const EVENT_TYPES = [
  { value: 'meetup', label: 'Meetup' },
  { value: 'showcase', label: 'Game Showcase' },
  { value: 'jam_meetup', label: 'Jam Meetup' },
  { value: 'talk', label: 'Talk / Keynote' },
  { value: 'workshop', label: 'Workshop' },
] as const

export const CONTRACT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'rev_share', label: 'Revenue Share' },
  { value: 'volunteer', label: 'Volunteer' },
] as const

export const BUILD_TYPES = [
  { value: 'browser', label: 'Browser / Web' },
  { value: 'download', label: 'Download' },
  { value: 'steam_key', label: 'Steam Key' },
] as const

export const JAM_VOTE_CATEGORIES = [
  { value: 'overall', label: 'Overall' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'fun', label: 'Fun' },
  { value: 'theme', label: 'Theme' },
  { value: 'visuals', label: 'Visuals' },
  { value: 'audio', label: 'Audio' },
] as const

export const FEEDBACK_CATEGORIES = [
  { key: 'gameplay', label: 'Gameplay' },
  { key: 'controls', label: 'Controls' },
  { key: 'ui_clarity', label: 'UI Clarity' },
  { key: 'tutorial_clarity', label: 'Tutorial' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'visual_style', label: 'Visual Style' },
  { key: 'audio', label: 'Audio' },
  { key: 'fun_factor', label: 'Fun Factor' },
  { key: 'replay_interest', label: 'Replay Interest' },
] as const

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined
): string | null {
  if (!value) return null
  return list.find((o) => o.value === value)?.label ?? value
}
