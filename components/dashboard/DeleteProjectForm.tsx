'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { deleteProject } from '@/app/actions/projects'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300'

export function DeleteProjectForm({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isMatch = confirm === title

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMatch) return
    setError('')
    setLoading(true)

    const result = await deleteProject(projectId, confirm)

    if ('error' in result) {
      setLoading(false)
      setError(result.error)
      return
    }

    router.push('/dashboard/projects')
    router.refresh()
  }

  return (
    <div className="mt-12 space-y-6">
      <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-700 mb-2">Delete Project</h3>
            <p className="text-sm text-red-600 leading-relaxed">
              This will permanently delete &quot;{title}&quot; along with its devlogs, playtest requests, and demo slots. This cannot be undone.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleDelete} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Type the project title to confirm: <span className="text-red-500 font-bold">{title}</span>
          </label>
          <input
            className={inputCls}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={title}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {error && <p className="text-xs font-mono text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!isMatch || loading}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Delete This Project
        </button>
      </form>
    </div>
  )
}
