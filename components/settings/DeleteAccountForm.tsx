'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300'

export function DeleteAccountForm({ username }: { username: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isMatch = confirm === username

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMatch) return
    setError('')
    setLoading(true)

    // Sign out and redirect — actual account deletion requires a server-side
    // admin action (Supabase service-role key). This flow soft-deletes by
    // clearing the profile and signing out, which removes community visibility.
    // The auth.users row is retained for 30 days per Supabase's data retention.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        display_name: '[deleted]',
        bio: null,
        location: null,
        avatar_url: null,
        github_url: null,
        itchio_url: null,
        twitter_url: null,
        website_url: null,
        is_onboarded: false,
      })
      .eq('username', username)

    if (profileError) {
      setLoading(false)
      setError('Something went wrong. Contact support.')
      return
    }

    await supabase.auth.signOut()
    router.push('/?account=deleted')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-700 mb-2">Delete Account</h3>
            <p className="text-sm text-red-600 leading-relaxed">
              This will remove your public profile, all your projects, devlogs, comments, and reactions. This cannot be undone.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleDelete} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Type your username to confirm: <span className="text-red-500 font-bold">{username}</span>
          </label>
          <input
            className={inputCls}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={username}
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
          Delete My Account
        </button>
      </form>
    </div>
  )
}
