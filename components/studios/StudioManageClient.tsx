'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { addStudioProject, removeStudioProject, updateStudio } from '@/app/actions/studios'
import { Badge } from '@/components/ui/Badge'
import { STUDIO_SIZES } from '@/lib/supabase/types'

type Studio = { id: string; slug: string; name: string; description: string | null; website: string | null; location: string | null; size: string; verified: boolean }
type Member = { id: string; role: string; profiles: { username: string; display_name: string | null; avatar_url: string | null } | null }
type SP = { project_id: string; projects: { id: string; title: string; slug: string | null } | null }
type MyProject = { id: string; title: string }

export function StudioManageClient({
  studio,
  userRole,
  members,
  studioProjects,
  myProjects,
}: {
  studio: Studio
  userRole: string
  members: Member[]
  studioProjects: SP[]
  myProjects: MyProject[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState('')

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  const linkedProjectIds = new Set(studioProjects.map((sp) => sp.project_id))
  const availableProjects = myProjects.filter((p) => !linkedProjectIds.has(p.id))

  function handleAddProject() {
    if (!selectedProject) return
    setError(null)
    startTransition(async () => {
      const result = await addStudioProject(studio.id, selectedProject)
      if ('error' in result) { setError(result.error) }
      else { setSuccess('Project added.'); setSelectedProject('') }
    })
  }

  function handleRemoveProject(projectId: string) {
    startTransition(async () => {
      const result = await removeStudioProject(studio.id, projectId)
      if ('error' in result) setError(result.error)
    })
  }

  async function handleUpdateStudio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateStudio(studio.id, formData)
      if ('error' in result) setError(result.error)
      else setSuccess('Studio updated.')
    })
  }

  return (
    <div className="space-y-10">
      {/* Studio info */}
      {isOwnerOrAdmin && (
        <section>
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Studio Info</h2>
          <form onSubmit={handleUpdateStudio} className="max-w-xl space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Name *</label>
              <input name="name" defaultValue={studio.name} maxLength={200} required className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Description</label>
              <textarea name="description" defaultValue={studio.description ?? ''} maxLength={5000} rows={3} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Size</label>
                <select name="size" defaultValue={studio.size} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition">
                  {STUDIO_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Location</label>
                <input name="location" defaultValue={studio.location ?? ''} maxLength={100} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Website</label>
              <input name="website" type="url" defaultValue={studio.website ?? ''} maxLength={500} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" />
            </div>
            <button type="submit" disabled={isPending} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50">
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </section>
      )}

      {/* Projects */}
      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Studio Projects ({studioProjects.length})</h2>
        <div className="space-y-2 mb-4">
          {studioProjects.map((sp) => sp.projects && (
            <div key={sp.project_id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-800">{sp.projects.title}</span>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => handleRemoveProject(sp.project_id)}
                  disabled={isPending}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                  aria-label="Remove project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {isOwnerOrAdmin && availableProjects.length > 0 && (
          <div className="flex gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            >
              <option value="">Select a project to add…</option>
              {availableProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <button
              onClick={handleAddProject}
              disabled={!selectedProject || isPending}
              className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        )}
      </section>

      {/* Members */}
      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Team Members ({members.length})</h2>
        <div className="space-y-2">
          {members.map((m) => m.profiles && (
            <div key={m.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <Link href={`/dev/${m.profiles.username}`} className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors">
                  {m.profiles.display_name ?? m.profiles.username}
                </Link>
                <span className="text-[10px] font-mono text-gray-400 ml-2">@{m.profiles.username}</span>
              </div>
              <Badge size="sm" variant={m.role === 'owner' ? 'default' : 'secondary'}>{m.role}</Badge>
            </div>
          ))}
        </div>
      </section>

      {(error || success) && (
        <p className={`rounded-2xl px-4 py-3 text-sm ${error ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-green-50 border border-green-100 text-green-600'}`}>
          {error ?? success}
        </p>
      )}
    </div>
  )
}
