'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createCollabPost } from '@/app/actions/collaboration'
import { ROLES, CONTRACT_TYPES } from '@/lib/supabase/types'

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export function NewCollabForm({ projects }: { projects: { id: string; title: string }[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [postType, setPostType] = useState<'seeking_collaborator' | 'available_to_collaborate'>('seeking_collaborator')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [roleNeeded, setRoleNeeded] = useState('')
  const [roleOffered, setRoleOffered] = useState('')
  const [contractType, setContractType] = useState<typeof CONTRACT_TYPES[number]['value']>('rev_share')
  const [compensationRange, setCompensationRange] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [remoteAllowed, setRemoteAllowed] = useState(true)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const isSeeking = postType === 'seeking_collaborator'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createCollabPost({
        project_id: projectId,
        post_type: postType,
        role_needed: roleNeeded,
        role_offered: roleOffered,
        contract_type: contractType,
        compensation_range: compensationRange,
        time_commitment: timeCommitment,
        remote_allowed: remoteAllowed,
        location,
        description,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelCls}>Post Type *</label>
        <div className="flex gap-3">
          {(['seeking_collaborator', 'available_to_collaborate'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setPostType(t)}
              className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all duration-200 ${postType === t ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'border border-gray-200 bg-white text-gray-600 hover:border-indigo-200'}`}>
              {t === 'seeking_collaborator' ? 'Seeking Collaborator' : 'Available to Collaborate'}
            </button>
          ))}
        </div>
      </div>

      {isSeeking && (
        <div>
          <label className={labelCls}>Project (required for Seeking) *</label>
          {projects.length === 0 ? (
            <p className="text-sm text-red-500">You need a project to post a &quot;Seeking collaborator&quot; listing. <a href="/dashboard/projects/new" className="underline">Create one first.</a></p>
          ) : (
            <select className={selectCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— Select project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
        </div>
      )}

      {!isSeeking && projects.length > 0 && (
        <div>
          <label className={labelCls}>Link to Project (optional)</label>
          <select className={selectCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isSeeking ? (
          <div>
            <label className={labelCls}>Role Needed</label>
            <select className={selectCls} value={roleNeeded} onChange={(e) => setRoleNeeded(e.target.value)}>
              <option value="">Select role…</option>
              {ROLES.map((r) => <option key={r.value} value={r.label}>{r.label}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className={labelCls}>Role Offered</label>
            <select className={selectCls} value={roleOffered} onChange={(e) => setRoleOffered(e.target.value)}>
              <option value="">Select role…</option>
              {ROLES.map((r) => <option key={r.value} value={r.label}>{r.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Contract Type *</label>
          <select className={selectCls} value={contractType} onChange={(e) => setContractType(e.target.value as typeof contractType)}>
            {CONTRACT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Compensation Range (optional)</label>
          <input className={inputCls} value={compensationRange} onChange={(e) => setCompensationRange(e.target.value)} placeholder="e.g. 10-20% rev share" maxLength={200} />
        </div>
        <div>
          <label className={labelCls}>Time Commitment (optional)</label>
          <input className={inputCls} value={timeCommitment} onChange={(e) => setTimeCommitment(e.target.value)} placeholder="e.g. 10h/week" maxLength={200} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" role="switch" aria-checked={remoteAllowed} onClick={() => setRemoteAllowed((p) => !p)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${remoteAllowed ? 'bg-indigo-600' : 'bg-gray-200'}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${remoteAllowed ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className="text-sm text-gray-700">Remote OK</span>
      </div>

      {!remoteAllowed && (
        <div>
          <label className={labelCls}>Location</label>
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" maxLength={100} />
        </div>
      )}

      <div>
        <label className={labelCls}>Description *</label>
        <textarea className={`${inputCls} resize-none`} rows={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isSeeking ? "Describe your project and what you're looking for in a collaborator…" : "Describe your skills, what you're looking to work on, and what you bring to a project…"} required />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{description.length}/5000</p>
      </div>

      {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
        <button type="button" onClick={() => router.push('/collaborate')} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Post
        </button>
      </div>
    </form>
  )
}
