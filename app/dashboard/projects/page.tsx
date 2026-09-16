import Link from 'next/link'
import { Plus, Folder, FileText, Eye, EyeOff, Lock, ArrowRight, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import type { Project } from '@/lib/supabase/types'

const VISIBILITY_ICONS = {
  public: Eye,
  unlisted: EyeOff,
  private: Lock,
}

const VISIBILITY_LABELS = {
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
}

export default async function ProjectsPage() {
  const { user, displayName, email } = await getSidebarIdentity()
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
      displayName={displayName}
      email={email}
      headerLabel="My Projects"
      headerAction={
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3.5 py-2.5 sm:px-5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Project</span>
        </Link>
      }
    >
      {typedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <Folder className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-display font-medium tracking-tight text-gray-900 mb-2">No projects yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Create your first project to start writing devlogs and building your public portfolio.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300"
          >
            <Plus className="h-4 w-4" /> Create your first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {typedProjects.map((project) => {
            const VisIcon = VISIBILITY_ICONS[project.visibility ?? 'public']
            return (
              <div
                key={project.id}
                className="group rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 hover:border-gray-200 hover:shadow-md hover:shadow-gray-200/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-medium tracking-tight text-gray-900">{project.title}</h3>
                      {project.is_primary && (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                          Primary
                        </span>
                      )}
                    </div>
                    {project.short_description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.short_description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <VisIcon className="h-3 w-3" />
                        {VISIBILITY_LABELS[project.visibility ?? 'public']}
                      </span>
                      {project.stage && (
                        <span className="text-[11px] uppercase tracking-wider text-gray-400">{project.stage}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200"
                      aria-label="Edit project"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/projects/${project.id}/devlogs/new`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200"
                      aria-label="Write devlog"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    {project.slug && (
                      <Link
                        href={`/dev/${user.id}`}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-[11px] text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
