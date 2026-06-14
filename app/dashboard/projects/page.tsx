import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Folder, FileText, Eye, EyeOff, Lock, ArrowRight, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
                Glyph<span className="text-indigo-600 leading-none">°</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">My Projects</span>
            </div>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Project</span>
            </Link>
          </div>

          <div className="flex-1 px-5 sm:px-8 md:px-10 py-8">
            {typedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 mb-4">
                  <Folder className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-medium tracking-tight text-gray-900 mb-2">No projects yet</h2>
                <p className="text-sm text-gray-500 max-w-xs mb-6">
                  Create your first project to start writing devlogs and building your public portfolio.
                </p>
                <Link
                  href="/dashboard/projects/new"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="h-4 w-4" /> Create your first project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {typedProjects.map((project) => {
                  const VisIcon = VISIBILITY_ICONS[project.visibility ?? 'public']
                  return (
                    <div
                      key={project.id}
                      className="group rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-medium tracking-tight text-gray-900">{project.title}</h3>
                            {project.is_primary && (
                              <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-indigo-600">
                                Primary
                              </span>
                            )}
                          </div>
                          {project.short_description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.short_description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400">
                              <VisIcon className="h-3 w-3" />
                              {VISIBILITY_LABELS[project.visibility ?? 'public']}
                            </span>
                            {project.stage && (
                              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                                {project.stage}
                              </span>
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
                              className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-mono text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200"
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
          </div>
        </div>
      </main>
    </div>
  )
}
