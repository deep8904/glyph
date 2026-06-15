'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { submitJamEntry } from '@/app/actions/jams'

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export function JamSubmitForm({
  jamId,
  jamSlug,
  projects,
}: {
  jamId: string
  jamSlug: string
  projects: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionNotes, setSubmissionNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitJamEntry({ jam_id: jamId, project_id: projectId, submission_url: submissionUrl, submission_notes: submissionNotes })
      if (result?.error) setError(result.error)
      else router.push(`/jams/${jamSlug}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelCls}>Project *</label>
        <select className={`${inputCls} appearance-none cursor-pointer`} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Play / Download Link (optional)</label>
        <input type="url" className={inputCls} value={submissionUrl} onChange={(e) => setSubmissionUrl(e.target.value)} placeholder="https://itch.io/your-game" maxLength={500} />
      </div>
      <div>
        <label className={labelCls}>Submission Notes (optional)</label>
        <textarea className={`${inputCls} resize-none`} rows={4} maxLength={2000} value={submissionNotes} onChange={(e) => setSubmissionNotes(e.target.value)} placeholder="How to play, known issues, credits, tools used…" />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{submissionNotes.length}/2000</p>
      </div>
      {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
        <button type="button" onClick={() => router.push(`/jams/${jamSlug}`)} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-60 disabled:pointer-events-none">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Entry
        </button>
      </div>
    </form>
  )
}
