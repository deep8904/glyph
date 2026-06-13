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
  engine: string | null
  genre: string | null
  stage: string | null
  cover_url: string | null
  is_primary: boolean
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

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined
): string | null {
  if (!value) return null
  return list.find((o) => o.value === value)?.label ?? value
}
