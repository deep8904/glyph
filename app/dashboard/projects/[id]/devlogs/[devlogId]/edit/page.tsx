import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { DevlogForm } from '@/components/dashboard/DevlogForm'
import type { Project, DevlogPost } from '@/lib/supabase/types'

export default async function EditDevlogPage({
  params,
}: {
  params: Promise<{ id: string; devlogId: string }>
}) {
  const { id, devlogId } = await params
  const { user, displayName, email, username, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  // Ownership is checked on both the project and the devlog; the
  // updateDevlog server action and RLS re-check it on save.
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, slug')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle<Pick<Project, 'id' | 'title' | 'slug'>>()
  if (!project) notFound()

  const { data: devlog } = await supabase
    .from('devlog_posts')
    .select('id, slug, title, content, published_at')
    .eq('id', devlogId)
    .eq('project_id', project.id)
    .eq('author_id', user.id)
    .maybeSingle<Pick<DevlogPost, 'id' | 'slug' | 'title' | 'content' | 'published_at'>>()
  if (!devlog) notFound()

  const published = !!devlog.published_at && new Date(devlog.published_at) <= new Date()

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Edit Devlog">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Edit Devlog</h1>
        <p className="text-sm text-gray-500 mb-8">
          An update for <span className="font-medium text-gray-700">{project.title}</span>. The devlog&apos;s URL stays the same.
        </p>
        <DevlogForm
          projectId={project.id}
          authorId={user.id}
          username={username}
          projectSlug={project.slug}
          existing={{ id: devlog.id, slug: devlog.slug, title: devlog.title, content: devlog.content, published }}
        />
      </div>
    </AppShell>
  )
}
