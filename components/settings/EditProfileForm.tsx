'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ROLES, ENGINES, EXPERIENCE_LEVELS, COLLAB_STATUS } from '@/lib/supabase/types'
import type { Profile } from '@/lib/supabase/types'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [role, setRole] = useState(profile.primary_role ?? '')
  const [engine, setEngine] = useState(profile.primary_engine ?? '')
  const [experience, setExperience] = useState(profile.experience_level ?? '')
  const [collabStatus, setCollabStatus] = useState(profile.collaboration_status ?? 'open')
  const [github, setGithub] = useState(profile.github_url ?? '')
  const [itchio, setItchio] = useState(profile.itchio_url ?? '')
  const [twitter, setTwitter] = useState(profile.twitter_url ?? '')
  const [website, setWebsite] = useState(profile.website_url ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)

    const nn = (v: string) => v.trim() || null

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        display_name: nn(displayName),
        bio: nn(bio),
        location: nn(location),
        primary_role: nn(role),
        primary_engine: nn(engine),
        experience_level: nn(experience),
        collaboration_status: collabStatus,
        github_url: nn(github),
        itchio_url: nn(itchio),
        twitter_url: nn(twitter),
        website_url: nn(website),
      })
      .eq('id', profile.id)

    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelCls}>Display Name</label>
        <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={profile.username} maxLength={100} />
      </div>
      <div>
        <label className={labelCls}>Bio</label>
        <textarea className={`${inputCls} resize-none`} rows={3} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What are you building?" />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{bio.length}/500</p>
      </div>
      <div>
        <label className={labelCls}>Location</label>
        <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Berlin, Germany" maxLength={100} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Primary Role</label>
          <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select…</option>
            {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Primary Engine</label>
          <select className={selectCls} value={engine} onChange={(e) => setEngine(e.target.value)}>
            <option value="">Select…</option>
            {ENGINES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Experience Level</label>
          <select className={selectCls} value={experience} onChange={(e) => setExperience(e.target.value)}>
            <option value="">Select…</option>
            {EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Collaboration Status</label>
          <select className={selectCls} value={collabStatus} onChange={(e) => setCollabStatus(e.target.value)}>
            {COLLAB_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <p className={labelCls} style={{ marginBottom: 0 }}>Social Links</p>
        <input className={inputCls} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/you" maxLength={200} />
        <input className={inputCls} value={itchio} onChange={(e) => setItchio(e.target.value)} placeholder="https://you.itch.io" maxLength={200} />
        <input className={inputCls} value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/you" maxLength={200} />
        <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" maxLength={200} />
      </div>

      {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
      {saved && <p className="text-xs font-mono text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3">Profile updated.</p>}

      <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-60 disabled:pointer-events-none">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
      </button>
    </form>
  )
}
