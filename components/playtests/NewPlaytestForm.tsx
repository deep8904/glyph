'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createPlaytestRequest } from '@/app/actions/playtests'
import { BUILD_TYPES } from '@/lib/supabase/types'

const PLATFORMS = ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Web']
const FOCUS_AREA_OPTIONS = ['Controls', 'Difficulty', 'Tutorial', 'UI/UX', 'Performance', 'Story', 'Fun Factor', 'Level Design', 'Audio']

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export function NewPlaytestForm({ projects }: { projects: { id: string; title: string }[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [buildUrl, setBuildUrl] = useState('')
  const [buildType, setBuildType] = useState<'browser' | 'download' | 'steam_key'>('browser')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [requestedTesters, setRequestedTesters] = useState(5)

  const toggleOption = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createPlaytestRequest({ project_id: projectId, build_url: buildUrl, build_type: buildType, platforms, description, focus_areas: focusAreas, requested_testers: requestedTesters })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelCls}>Project *</label>
        <select className={selectCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Build URL *</label>
        <input className={inputCls} type="url" value={buildUrl} onChange={(e) => setBuildUrl(e.target.value)} placeholder="https://itch.io/game or direct link" maxLength={500} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Build Type *</label>
          <select className={selectCls} value={buildType} onChange={(e) => setBuildType(e.target.value as 'browser' | 'download' | 'steam_key')}>
            {BUILD_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Requested Testers</label>
          <input type="number" min={1} max={50} className={inputCls} value={requestedTesters} onChange={(e) => setRequestedTesters(parseInt(e.target.value) || 5)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Platforms</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p} type="button" onClick={() => toggleOption(platforms, setPlatforms, p)}
              className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${platforms.includes(p) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Focus Areas</label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREA_OPTIONS.map((f) => (
            <button key={f} type="button" onClick={() => toggleOption(focusAreas, setFocusAreas, f)}
              className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${focusAreas.includes(f) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Description * <span className="normal-case font-normal">(what should testers know?)</span></label>
        <textarea className={`${inputCls} resize-none`} rows={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your game, its current state, and what you'd like feedback on…" required />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{description.length}/5000</p>
      </div>

      {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
        <button type="button" onClick={() => router.push('/dashboard/playtests')} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300">
          Cancel
        </button>
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Request
        </button>
      </div>
    </form>
  )
}
