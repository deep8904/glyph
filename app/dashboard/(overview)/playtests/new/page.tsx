import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewPlaytestForm } from '@/components/playtests/NewPlaytestForm'
import type { Project } from '@/lib/supabase/types'

export default async function NewPlaytestPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const typedProjects = (projects ?? []) as Pick<Project, 'id' | 'title'>[]

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Playtests">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-h1 font-semibold text-fg">Request testers</h1>
          <p className="mt-1 text-small text-fg-secondary">Set up a playtest: testers request a place, you accept the ones you want, and only they get the build. Each sends structured feedback.</p>
        </div>
        {typedProjects.length === 0 ? (
          <EmptyState kind="first-use" title="Create a project first" description="A playtest belongs to a project." action={<Button asChild variant="primary" size="sm"><Link href="/dashboard/projects/new">Create a project</Link></Button>} />
        ) : (
          <NewPlaytestForm projects={typedProjects} />
        )}
      </div>
    </AppShell>
  )
}
