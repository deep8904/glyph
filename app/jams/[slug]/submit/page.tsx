import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
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
    <DiscoveryFrame label="Jams">
      {() => (
        <div className="max-w-2xl">
          <Link href={`/jams/${slug}`} className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← {jam.title}</Link>
          <h1 className="mt-1 text-h1 font-semibold text-fg">Submit a project</h1>
          <p className="mb-6 mt-1 max-w-prose text-small text-fg-secondary">Enter one of your Glyph projects in <strong className="font-medium text-fg">{jam.title}</strong>. The entry is your project itself — voters open its project page — so keep it up to date. You can change your submission until the jam ends.</p>
          {typedProjects.length === 0 ? (
            <EmptyState kind="first-use" title="You need a project to enter" description="Jam entries are Glyph projects." action={<Button asChild variant="primary" size="sm"><Link href="/dashboard/projects/new">Create a project</Link></Button>} />
          ) : (
            <JamSubmitForm jamId={jam.id} jamSlug={slug} projects={typedProjects} />
          )}
        </div>
      )}
    </DiscoveryFrame>
  )
}
