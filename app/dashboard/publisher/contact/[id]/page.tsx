import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { ContactDeveloperForm } from '@/components/publisher/ContactDeveloperForm'
import { StatusText } from '@/components/workflow/StatusLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { relativeTime } from '@/lib/utils'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Contact a developer about one project: who, what, and the message — with the project always in view. */
export default async function ContactDeveloperPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ project?: string }> }) {
  const { id } = await params
  const { project: projectParam } = await searchParams
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()
  if (!UUID.test(id)) notFound()

  const { data: publisher } = await supabase.from('publisher_accounts').select('id, company_name, verified').eq('user_id', user.id).maybeSingle()
  if (!publisher) redirect('/dashboard/publisher/register')
  if (id === user.id) redirect('/dashboard/publisher')

  // Developers and their public projects are visible under the caller's RLS; a blocked or non-existent developer is simply not found.
  const { data: developer } = await supabase.from('discoverable_developers').select('id, username, display_name, avatar_url, bio, primary_role').eq('id', id).maybeSingle()
  if (!developer) notFound()

  let project: { id: string; title: string; slug: string } | null = null
  if (projectParam && UUID.test(projectParam)) {
    const { data } = await supabase.from('discoverable_projects').select('id, title, slug, owner_id').eq('id', projectParam).eq('owner_id', id).maybeSingle()
    if (data) project = { id: data.id, title: data.title, slug: data.slug }
  }

  let existing: { created_at: string; status: string } | null = null
  {
    let q = supabase.from('publisher_contacts').select('created_at, status').eq('publisher_id', publisher.id).eq('developer_id', id)
    q = project ? q.eq('project_id', project.id) : q.is('project_id', null)
    const { data } = await q.maybeSingle()
    existing = data
  }

  const name = developer.display_name ?? developer.username

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Publisher">
      <div className="max-w-xl">
        <Link href={project ? `/p/${developer.username}/${project.slug}` : '/dashboard/publisher'} className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← {project ? `Back to ${project.title}` : 'Publisher dashboard'}</Link>
        <h1 className="mt-1 text-h1 font-semibold text-fg [overflow-wrap:anywhere]">Contact {name}</h1>

        <MetadataBar
          className="mt-4 border-y border-line-subtle py-4"
          layout="stacked"
          items={[
            { label: 'From', value: publisher.company_name },
            { label: 'To', value: <><Link href={`/dev/${developer.username}`} className="text-link underline-offset-2 hover:underline">{name}</Link> <span className="text-fg-muted">@{developer.username}</span></> },
            { label: 'About', value: project ? <Link href={`/p/${developer.username}/${project.slug}`} className="text-link underline-offset-2 hover:underline">{project.title}</Link> : 'No specific project' },
          ]}
        />

        <div className="mt-6">
          {!publisher.verified ? (
            <EmptyState kind="restricted" title="Your account is not verified yet" description="You cannot contact developers until Glyph verifies your publisher account. You can keep shortlisting projects in the meantime." action={<Link href="/dashboard/publisher" className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Back to your publisher dashboard</Link>} />
          ) : existing ? (
            <div role="status" className="border-y border-line-subtle py-4 text-body text-fg-secondary">
              <p>You already contacted {name}{project ? ` about ${project.title}` : ''} {relativeTime(existing.created_at)}.</p>
              <p className="mt-2"><StatusText label={existing.status === 'sent' ? 'Sent — no response yet' : existing.status === 'read' ? 'Read' : existing.status === 'replied' ? 'Replied' : 'Archived by developer'} tone={existing.status === 'replied' ? 'positive' : 'neutral'} /></p>
              <p className="mt-2 text-fg-muted">One message per developer and project keeps outreach respectful. You can contact them about a different project.</p>
            </div>
          ) : (
            <ContactDeveloperForm developerId={id} projectId={project?.id ?? null} projectTitle={project?.title ?? null} />
          )}
        </div>
      </div>
    </AppShell>
  )
}
