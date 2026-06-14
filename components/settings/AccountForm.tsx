'use client'

import { useState } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export function AccountForm({
  currentEmail,
  providers,
  hasPassword,
}: {
  currentEmail: string
  providers: string[]
  hasPassword: boolean
}) {
  const supabase = createClient()

  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMsg('')
    setEmailError('')
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!EMAIL_REGEX.test(newEmail)) { setEmailError('Enter a valid email address.'); return }
    setEmailLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setEmailLoading(false)
    if (error) { setEmailError('Could not update email. Try again.'); return }
    setEmailMsg(`Confirmation sent to ${newEmail}. Check your inbox.`)
    setNewEmail('')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg('')
    setPwError('')
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwError('Passwords don\'t match.'); return }
    setPwLoading(true)
    // Re-authenticate first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPw,
    })
    if (signInError) { setPwLoading(false); setPwError('Current password is incorrect.'); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) { setPwError('Could not update password. Try again.'); return }
    setPwMsg('Password updated successfully.')
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }

  return (
    <div className="space-y-10">
      {/* Connected providers */}
      <section>
        <h2 className={labelCls}>Connected Providers</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {providers.map((p) => (
            <span key={p} className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-mono text-gray-600 capitalize">
              {p === 'email' ? 'Email + Password' : p}
            </span>
          ))}
          {providers.length === 0 && <p className="text-sm text-gray-400">No providers found.</p>}
        </div>
      </section>

      {/* Change email */}
      <section>
        <h2 className="text-sm font-medium text-gray-900 mb-4">Change Email</h2>
        <p className="text-xs text-gray-500 mb-4">Current: <span className="font-mono">{currentEmail}</span></p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className={labelCls}>New Email Address</label>
            <input type="email" className={inputCls} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" maxLength={200} />
          </div>
          {emailError && <p className="text-xs font-mono text-red-500">{emailError}</p>}
          {emailMsg && <p className="text-xs font-mono text-green-600">{emailMsg}</p>}
          <button type="submit" disabled={emailLoading} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:pointer-events-none">
            {emailLoading && <Loader2 className="h-4 w-4 animate-spin" />} Update Email
          </button>
        </form>
      </section>

      {/* Change password — only for email auth users */}
      {hasPassword && (
        <section>
          <h2 className="text-sm font-medium text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className={labelCls}>Current Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className={`${inputCls} pr-11`} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <input type={showPw ? 'text' : 'password'} className={inputCls} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input type={showPw ? 'text' : 'password'} className={inputCls} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
            </div>
            {pwError && <p className="text-xs font-mono text-red-500">{pwError}</p>}
            {pwMsg && <p className="text-xs font-mono text-green-600">{pwMsg}</p>}
            <button type="submit" disabled={pwLoading} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:pointer-events-none">
              {pwLoading && <Loader2 className="h-4 w-4 animate-spin" />} Update Password
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
