'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

const MAX_FEATURED = 3
const MAX_CONTENT = 50000

// Owner-only edit. Slug is deliberately never changed: /p/<user>/<project>/<slug>
// is the devlog's permanent URL (comments, reactions, notifications and
// featured links all point at it). Publish state can move draft -> published
// (stamps published_at once) or published -> draft; already-published posts
// keep their original published_at so timeline order does not shift on edit.
export async function updateDevlog(
  devlogId: string,
  input: { title: string; content: string; published: boolean }
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const title = stripDangerousUnicode(input.title.trim())
  const content = stripDangerousUnicode(input.content.trim())
  if (!title) return { error: 'Title is required.' }
  if (title.length > 200) return { error: 'Title must be under 200 characters.' }
  if (!content) return { error: 'Content is required.' }
  if (content.length > MAX_CONTENT) return { error: `Content must be under ${MAX_CONTENT.toLocaleString()} characters.` }

  const { data: devlog } = await supabase
    .from('devlog_posts')
    .select('id, author_id, project_id, published_at, projects!inner(owner_id)')
    .eq('id', devlogId)
    .maybeSingle<{ id: string; author_id: string; project_id: string; published_at: string | null; projects: { owner_id: string } }>()
  if (!devlog || devlog.author_id !== user.id || devlog.projects.owner_id !== user.id) {
    return { error: 'Not authorized.' }
  }

  let published_at: string | null
  if (!input.published) published_at = null
  else published_at = devlog.published_at ?? new Date().toISOString()

  const { error } = await supabase
    .from('devlog_posts')
    .update({ title, content, published_at })
    .eq('id', devlogId)
    .eq('author_id', user.id)
  if (error) return { error: 'Failed to save changes.' }

  revalidatePath('/p')
  revalidatePath('/dev')
  return { ok: true }
}

export async function setDevlogFeatured(devlogId: string, featured: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: devlog } = await supabase
    .from('devlog_posts')
    .select('id, author_id, project_id')
    .eq('id', devlogId)
    .maybeSingle()
  if (!devlog || devlog.author_id !== user.id) return { error: 'Not authorized.' }

  if (featured) {
    const { count } = await supabase
      .from('devlog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .eq('is_featured', true)
    if ((count ?? 0) >= MAX_FEATURED) {
      return { error: `You can feature at most ${MAX_FEATURED} devlogs. Unfeature one first.` }
    }
  }

  const { error } = await supabase.from('devlog_posts').update({ is_featured: featured }).eq('id', devlogId)
  if (error) return { error: error.message }

  revalidatePath('/dev')
  return { ok: true }
}
