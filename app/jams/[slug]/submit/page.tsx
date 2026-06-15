import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { JamSubmitForm } from '@/components/jams/JamSubmitForm'
import type { Project } from '@/lib/supabase/types'

export default async function JamSubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/jams/${slug}/submit`)

  const { data: jam } = await supabase.from('game_jams').select('id, title, status, admin_approved').eq('slug', slug).maybeSingle()
  if (!jam || !jam.admin_approved) notFound()
  if (jam.status !== 'running') {
    redirect(`/jams/${slug}`)
  }

  const { data: projects } = await supabase.from('projects').select('id, title').eq('owner_id', user.id).order('created_at', { ascending: false })
  const typedProjects = (projects ?? []) as Pick<Project, 'id' | 'title'>[]

  return (
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Jams', href: '/jams' }, { label: jam.title, href: `/jams/${slug}` }, { label: 'Submit Entry' }]} />
      <PanelBody>
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">Submit Your Entry</h1>
          <p className="text-sm text-gray-500">Submit a project for <strong>{jam.title}</strong>. You can update your submission before the jam ends.</p>
        </div>
        {typedProjects.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            You need a project to submit. <a href="/dashboard/projects/new" className="text-indigo-600 hover:underline">Create one first →</a>
          </div>
        ) : (
          <JamSubmitForm jamId={jam.id} jamSlug={slug} projects={typedProjects} />
        )}
      </PanelBody>
    </PageShell>
  )
}
