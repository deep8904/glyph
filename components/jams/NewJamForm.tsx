'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createGameJam } from '@/app/actions/jams'

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export function NewJamForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [votingStartAt, setVotingStartAt] = useState('')
  const [votingEndAt, setVotingEndAt] = useState('')
  const [rules, setRules] = useState('')
  const [maxTeamSize, setMaxTeamSize] = useState(4)
  const [allowExistingAssets, setAllowExistingAssets] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createGameJam({
        title, description, theme, start_at: startAt, end_at: endAt,
        voting_start_at: votingStartAt, voting_end_at: votingEndAt,
        rules, max_team_size: maxTeamSize, allow_existing_assets: allowExistingAssets,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelCls}>Jam Title *</label>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Glyph Jam #1" maxLength={200} required />
      </div>

      <div>
        <label className={labelCls}>Description *</label>
        <textarea className={`${inputCls} resize-none`} rows={5} maxLength={10000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this jam about? Who is it for?" required />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{description.length}/10000</p>
      </div>

      <div>
        <label className={labelCls}>Theme (optional, revealed at start)</label>
        <input className={inputCls} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Duality, One Room, etc." maxLength={200} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Jam Starts *</label>
          <input type="datetime-local" className={inputCls} value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Jam Ends *</label>
          <input type="datetime-local" className={inputCls} value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Voting Opens *</label>
          <input type="datetime-local" className={inputCls} value={votingStartAt} onChange={(e) => setVotingStartAt(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Voting Closes *</label>
          <input type="datetime-local" className={inputCls} value={votingEndAt} onChange={(e) => setVotingEndAt(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className={labelCls}>Rules (Markdown, optional)</label>
        <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={6} maxLength={20000} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="# Rules&#10;&#10;- Must be made during the jam&#10;- Max team size: 4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Max Team Size</label>
          <input type="number" min={1} max={20} className={inputCls} value={maxTeamSize} onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 4)} />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <button
            type="button"
            role="switch"
            aria-checked={allowExistingAssets}
            onClick={() => setAllowExistingAssets((p) => !p)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${allowExistingAssets ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${allowExistingAssets ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-700">Allow pre-made assets</span>
        </div>
      </div>

      {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
        <strong>Pending review:</strong> Your jam will be reviewed by the Glyph team before going live. Expect a response within 48 hours.
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
        <button type="button" onClick={() => router.push('/jams')} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-60 disabled:pointer-events-none">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit for Review
        </button>
      </div>
    </form>
  )
}
