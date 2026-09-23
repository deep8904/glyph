'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { error: string } | { success: true }

export type DeletionSummary = {
  blockers: { slug: string; name: string; others: number }[]
  projects: number; devlogs: number; comments: number; reactions: number
  followers: number; following: number
  collab_posts: number; applications: number
  playtest_requests: number; playtest_sessions: number
  studios_left: number; studios_closed: number
  publisher_account: boolean; contacts_sent: number; contacts_received: number; shortlists: number
  notifications: number; blocks: number; mutes: number
}

/**
 * Permanent account deletion. The database function delete_my_account() does the
 * work (removes the auth user; every table that references the profile cascades),
 * and refuses while the caller is the only owner of a studio that still has other
 * members. This action adds the two checks the database cannot see: the named
 * confirmation phrase, and — for accounts that have a password — re-authentication.
 */
export async function deleteMyAccount(input: { phrase: string; password?: string }): Promise<Result> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }

    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
    if (!profile) return { error: 'Profile not found.' }
    if (input.phrase.trim() !== `delete @${profile.username}`) return { error: 'The confirmation phrase does not match.' }

    const hasPassword = (user.identities ?? []).some((i) => i.provider === 'email')
    if (hasPassword) {
      if (!input.password) return { error: 'Enter your password to confirm it is you.' }
      const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email ?? '', password: input.password })
      if (authError) return { error: 'That password is not correct.' }
    }

    const { error } = await supabase.rpc('delete_my_account')
    if (error) return { error: error.code === 'P0001' ? error.message : 'Your account could not be deleted. Nothing was changed.' }

    await supabase.auth.signOut().catch(() => undefined)
    return { success: true }
  } catch {
    return { error: 'Your account could not be deleted. Nothing was changed.' }
  }
}

export type NotificationPrefs = { activity: boolean; collaboration: boolean; playtesting: boolean; studios: boolean; publisher: boolean }

export async function saveNotificationPreferences(prefs: NotificationPrefs): Promise<Result> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const clean = {
      activity: prefs.activity === true, collaboration: prefs.collaboration === true,
      playtesting: prefs.playtesting === true, studios: prefs.studios === true, publisher: prefs.publisher === true,
    }
    const { error } = await supabase.from('notification_preferences').upsert({ user_id: user.id, ...clean, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) return { error: 'Could not save your preferences. Try again.' }
    revalidatePath('/settings/notifications')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
