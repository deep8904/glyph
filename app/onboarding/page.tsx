'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UsernameInput } from '@/components/UsernameInput'
import {
  ROLES,
  ENGINES,
  EXPERIENCE_LEVELS,
  PROJECT_STAGES,
} from '@/lib/supabase/types'

type FormData = {
  username: string
  display_name: string
  bio: string
  location: string
  primary_role: string
  primary_engine: string
  experience_level: string
  project_title: string
  project_description: string
  project_stage: string
  github_url: string
  itchio_url: string
  twitter_url: string
  website_url: string
}

const EMPTY: FormData = {
  username: '',
  display_name: '',
  bio: '',
  location: '',
  primary_role: '',
  primary_engine: '',
  experience_level: '',
  project_title: '',
  project_description: '',
  project_stage: '',
  github_url: '',
  itchio_url: '',
  twitter_url: '',
  website_url: '',
}

const STEP_TITLES = ['Identity', 'About You', 'Current Project', 'Social Links']
const TOTAL = 4

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls =
  'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(EMPTY)
  const [usernameValid, setUsernameValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  // Guard: bounce already-onboarded users to the dashboard.
  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_onboarded')
        .eq('id', user.id)
        .maybeSingle()
      if (!active) return
      if (profile?.is_onboarded) {
        router.replace('/dashboard')
        return
      }
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [supabase, router])

  const set = (key: keyof FormData, value: string) =>
    setData((d) => ({ ...d, [key]: value }))

  const handleValidity = useCallback((valid: boolean) => setUsernameValid(valid), [])

  const canAdvance = step === 1 ? usernameValid : true

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/login')
      return
    }

    const nn = (v: string) => (v.trim() ? v.trim() : null)

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      username: data.username,
      display_name: nn(data.display_name) ?? data.username,
      bio: nn(data.bio),
      location: nn(data.location),
      primary_role: nn(data.primary_role),
      primary_engine: nn(data.primary_engine),
      experience_level: nn(data.experience_level),
      github_url: nn(data.github_url),
      itchio_url: nn(data.itchio_url),
      twitter_url: nn(data.twitter_url),
      website_url: nn(data.website_url),
      is_onboarded: true,
    })

    if (profileError) {
      setIsSubmitting(false)
      // 23505 = unique_violation (username already taken between check and submit)
      if (profileError.code === '23505') {
        setError('That username was just taken. Please choose another.')
        setUsernameValid(false)
        setStep(1)
      } else {
        setError(profileError.message)
      }
      return
    }

    if (nn(data.project_title)) {
      await supabase.from('projects').insert({
        owner_id: user.id,
        title: data.project_title.trim(),
        short_description: nn(data.project_description),
        stage: nn(data.project_stage),
        is_primary: true,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  const next = () => {
    if (step < TOTAL) setStep(step + 1)
    else handleSubmit()
  }
  const back = () => step > 1 && setStep(step - 1)

  if (!ready) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
        <div className="relative z-10 h-10 w-10 rounded-full border-2 border-white/30 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="flex items-center gap-1 text-2xl font-semibold tracking-tighter text-white mb-8">
          Glyph<span className="text-indigo-400 leading-none">°</span>
        </div>

        <div className="w-full max-w-[560px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden">
          {/* Progress */}
          <div className="px-8 pt-8 md:px-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-indigo-600">
                Step {step} / {TOTAL} — {STEP_TITLES[step - 1]}
              </span>
              <span className="text-[11px] font-mono text-gray-400">~2 min</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < step ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="px-8 py-8 md:px-10">
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-light tracking-tighter text-gray-900 mb-1">
                    Claim your handle.
                  </h1>
                  <p className="text-sm text-gray-500">
                    This is your public address on Glyph. Choose carefully — it&apos;s how people find you.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Username</label>
                  <UsernameInput
                    value={data.username}
                    onChange={(v) => set('username', v)}
                    onValidityChange={handleValidity}
                  />
                </div>
                <div>
                  <label className={labelCls}>Display Name</label>
                  <input
                    className={inputCls}
                    value={data.display_name}
                    onChange={(e) => set('display_name', e.target.value)}
                    placeholder="e.g. Alex Rivera"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-light tracking-tighter text-gray-900 mb-1">
                    Tell devs who you are.
                  </h1>
                  <p className="text-sm text-gray-500">All optional — you can edit any of this later.</p>
                </div>
                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    maxLength={160}
                    value={data.bio}
                    onChange={(e) => set('bio', e.target.value)}
                    placeholder="What are you building, and what do you do best?"
                  />
                  <p className="mt-1 text-right text-[11px] font-mono text-gray-400">
                    {data.bio.length}/160
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input
                    className={inputCls}
                    value={data.location}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="e.g. Berlin, Germany"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Primary Role</label>
                    <select className={selectCls} value={data.primary_role} onChange={(e) => set('primary_role', e.target.value)}>
                      <option value="">Select…</option>
                      {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Primary Engine</label>
                    <select className={selectCls} value={data.primary_engine} onChange={(e) => set('primary_engine', e.target.value)}>
                      <option value="">Select…</option>
                      {ENGINES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Experience Level</label>
                  <select className={selectCls} value={data.experience_level} onChange={(e) => set('experience_level', e.target.value)}>
                    <option value="">Select…</option>
                    {EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-light tracking-tighter text-gray-900 mb-1">
                    What are you working on?
                  </h1>
                  <p className="text-sm text-gray-500">
                    Add your current project, or skip and add one later from your dashboard.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Project Title</label>
                  <input
                    className={inputCls}
                    value={data.project_title}
                    onChange={(e) => set('project_title', e.target.value)}
                    placeholder="e.g. Hollow Tide"
                  />
                </div>
                <div>
                  <label className={labelCls}>Short Description</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={2}
                    value={data.project_description}
                    onChange={(e) => set('project_description', e.target.value)}
                    placeholder="One line on what it is."
                  />
                </div>
                <div>
                  <label className={labelCls}>Stage</label>
                  <select className={selectCls} value={data.project_stage} onChange={(e) => set('project_stage', e.target.value)}>
                    <option value="">Select…</option>
                    {PROJECT_STAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-light tracking-tighter text-gray-900 mb-1">
                    Where else can people find you?
                  </h1>
                  <p className="text-sm text-gray-500">All optional. Add the ones that matter.</p>
                </div>
                <div>
                  <label className={labelCls}>GitHub</label>
                  <input className={inputCls} value={data.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="https://github.com/you" />
                </div>
                <div>
                  <label className={labelCls}>itch.io</label>
                  <input className={inputCls} value={data.itchio_url} onChange={(e) => set('itchio_url', e.target.value)} placeholder="https://you.itch.io" />
                </div>
                <div>
                  <label className={labelCls}>Twitter / X</label>
                  <input className={inputCls} value={data.twitter_url} onChange={(e) => set('twitter_url', e.target.value)} placeholder="https://x.com/you" />
                </div>
                <div>
                  <label className={labelCls}>Website</label>
                  <input className={inputCls} value={data.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://yoursite.com" />
                </div>
              </div>
            )}

            {error && (
              <p className="mt-5 text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-gray-100 px-8 py-5 md:px-10">
            <button
              onClick={back}
              disabled={step === 1 || isSubmitting}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <div className="flex items-center gap-4">
              {(step === 3 || step === 4) && (
                <button
                  onClick={next}
                  disabled={isSubmitting}
                  className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {step === 4 ? 'Skip' : 'Skip for now →'}
                </button>
              )}
              <button
                onClick={next}
                disabled={!canAdvance || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : step === TOTAL ? (
                  <>Finish &amp; Go to Dashboard</>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
