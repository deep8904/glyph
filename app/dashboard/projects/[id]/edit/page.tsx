import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectForm } from '@/components/dashboard/ProjectForm'
import type { Project } from '@/lib/supabase/types'

function PlasmaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle<Project>()

  if (!project) notFound()

  return (
    <PlasmaShell>
      <div className="flex items-center gap-3 px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
        <Link href="/dashboard" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
          Glyph<span className="text-indigo-600 leading-none">°</span>
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/dashboard/projects" className="font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors">
          Projects
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 truncate max-w-32">Edit</span>
      </div>

      <div className="flex-1 px-5 py-8 sm:px-8 md:px-10">
        <h1 className="text-2xl font-light tracking-tighter text-gray-900 mb-1">Edit Project</h1>
        <p className="text-sm text-gray-500 mb-8 truncate">{project.title}</p>
        <ProjectForm projectId={id} initial={project} ownerId={user.id} />
      </div>
    </PlasmaShell>
  )
}
