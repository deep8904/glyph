'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify, stripDangerousUnicode } from '@/lib/utils'

type ActionResult = { error: string } | { success: true; slug?: string }

export async function createStudio(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const name = stripDangerousUnicode((formData.get('name') as string ?? '').trim())
    const description = stripDangerousUnicode((formData.get('description') as string ?? '').trim())
    const website = (formData.get('website') as string ?? '').trim()
    const location = stripDangerousUnicode((formData.get('location') as string ?? '').trim())
    const size = formData.get('size') as string ?? 'solo'
    const founded_year_raw = formData.get('founded_year') as string

    if (!name) return { error: 'Studio name is required.' }
    if (name.length > 200) return { error: 'Name must be 200 characters or fewer.' }
    if (description.length > 5000) return { error: 'Description must be 5000 characters or fewer.' }
    if (location.length > 100) return { error: 'Location must be 100 characters or fewer.' }
    if (!['solo', '2-10', '11-50', '50+'].includes(size)) return { error: 'Invalid size.' }

    const founded_year = founded_year_raw ? parseInt(founded_year_raw, 10) : null
    if (founded_year && (founded_year < 1970 || founded_year > 2100)) return { error: 'Invalid founding year.' }

    // Check user doesn't already own a studio
    const { data: existing } = await supabase
      .from('studio_members')
      .select('studio_id, studios!studio_id(name)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .maybeSingle()
    if (existing) return { error: 'You already own a studio. Manage it from your dashboard.' }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let attempt = 0
    while (true) {
      const { data: taken } = await supabase.from('studios').select('id').eq('slug', slug).maybeSingle()
      if (!taken) break
      attempt++
      slug = `${baseSlug}-${attempt}`
      if (attempt > 10) return { error: 'Could not generate a unique slug. Try a different name.' }
    }

    const { data: studio, error: insertErr } = await supabase
      .from('studios')
      .insert({ slug, name, description: description || null, website: website || null, location: location || null, size, founded_year })
      .select('id, slug')
      .single()

    if (insertErr || !studio) return { error: 'Failed to create studio. Please try again.' }

    const { error: memberErr } = await supabase
      .from('studio_members')
      .insert({ studio_id: studio.id, user_id: user.id, role: 'owner' })

    if (memberErr) {
      // Don't leave an orphaned, ownerless studio behind — the create
      // wasn't fully successful, so undo the half of it that landed.
      await supabase.from('studios').delete().eq('id', studio.id)
      return { error: 'Failed to create studio. Please try again.' }
    }

    return { success: true, slug: studio.slug }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function updateStudio(studioId: string, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: member } = await supabase
      .from('studio_members')
      .select('role')
      .eq('studio_id', studioId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!member || !['owner', 'admin'].includes(member.role)) return { error: 'Not authorized.' }

    const name = stripDangerousUnicode((formData.get('name') as string ?? '').trim())
    const description = stripDangerousUnicode((formData.get('description') as string ?? '').trim())
    const website = (formData.get('website') as string ?? '').trim()
    const location = stripDangerousUnicode((formData.get('location') as string ?? '').trim())
    const size = formData.get('size') as string ?? 'solo'

    if (!name) return { error: 'Studio name is required.' }
    if (name.length > 200) return { error: 'Name too long.' }
    if (description.length > 5000) return { error: 'Description too long.' }
    if (location.length > 100) return { error: 'Location too long.' }

    const { error } = await supabase
      .from('studios')
      .update({ name, description: description || null, website: website || null, location: location || null, size })
      .eq('id', studioId)

    if (error) return { error: 'Failed to update studio.' }
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function addStudioProject(studioId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: member } = await supabase.from('studio_members').select('role').eq('studio_id', studioId).eq('user_id', user.id).maybeSingle()
    if (!member || !['owner', 'admin'].includes(member.role)) return { error: 'Not authorized.' }

    const { data: project } = await supabase.from('projects').select('owner_id').eq('id', projectId).maybeSingle()
    if (!project || project.owner_id !== user.id) return { error: 'You can only add your own projects.' }

    const { error } = await supabase.from('studio_projects').insert({ studio_id: studioId, project_id: projectId })
    if (error) {
      if (error.code === '23505') return { error: 'Project already added to this studio.' }
      return { error: 'Failed to add project.' }
    }

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function removeStudioProject(studioId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: member } = await supabase.from('studio_members').select('role').eq('studio_id', studioId).eq('user_id', user.id).maybeSingle()
    if (!member || !['owner', 'admin'].includes(member.role)) return { error: 'Not authorized.' }

    await supabase.from('studio_projects').delete().eq('studio_id', studioId).eq('project_id', projectId)
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
