import Link from 'next/link'
import { Plus, FileText, Eye, EyeOff, Lock, ArrowRight, Edit2, FolderPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconButton } from '@/components/ui/IconButton'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'
import type { Project } from '@/lib/supabase/types'

const VISIBILITY_ICON = { public: Eye, unlisted: EyeOff, private: Lock } as const
const VISIBILITY_LABEL = { public: 'Public', unlisted: 'Unlisted', private: 'Private' } as const

export default async function ProjectsPage() {
  const { user, username } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, short_description, slug, stage, visibility, is_primary, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const typedProjects = (projects ?? []) as Pick<
    Project,
    'id' | 'title' | 'short_description' | 'slug' | 'stage' | 'visibility' | 'is_primary' | 'created_at'
  >[]

  return (
    <AppShell
      headerLabel="Your projects"
      headerAction={
        <Button asChild variant="primary" size="sm">
          <Link href="/dashboard/projects/new"><Plus aria-hidden strokeWidth={1.75} className="size-4" /> <span className="hidden sm:inline">New project</span></Link>
        </Button>
      }
    >
      {typedProjects.length === 0 ? (
        <EmptyState
          kind="first-use"
          icon={FolderPlus}
          title="You have not created a project yet"
          description="A project holds your devlogs and is what other people see. Everything on Glyph starts here."
          action={<Button asChild variant="primary" size="sm"><Link href="/dashboard/projects/new"><Plus aria-hidden strokeWidth={1.75} className="size-4" /> Create your first project</Link></Button>}
        />
      ) : (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
          {typedProjects.map((project) => {
            const VisIcon = VISIBILITY_ICON[project.visibility ?? 'public']
            const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
            return (
              <li key={project.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-body font-medium text-fg [overflow-wrap:anywhere]">{project.title}</h3>
                    {project.is_primary && <Badge tone="accent">Primary</Badge>}
                  </div>
                  {project.short_description && <p className="mt-1 line-clamp-2 text-small text-fg-secondary">{project.short_description}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-small text-fg-muted">
                    <VisIcon aria-hidden strokeWidth={1.75} className="size-3.5" />
                    {VISIBILITY_LABEL[project.visibility ?? 'public']}
                    {stage && <> · {stage}</>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton asChild label="Edit project" variant="secondary" size="sm"><Link href={`/dashboard/projects/${project.id}/edit`}><Edit2 aria-hidden strokeWidth={1.75} className="size-4" /></Link></IconButton>
                  <IconButton asChild label="Write a devlog" variant="secondary" size="sm"><Link href={`/dashboard/projects/${project.id}/devlogs/new`}><FileText aria-hidden strokeWidth={1.75} className="size-4" /></Link></IconButton>
                  {project.slug && (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/p/${username}/${project.slug}`}>View <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" /></Link>
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </AppShell>
  )
}
