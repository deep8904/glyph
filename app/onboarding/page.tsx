'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UsernameInput } from '@/components/UsernameInput'
import { FocusedShell } from '@/components/shell/FocusedShell'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'
import { cn } from '@/lib/utils'
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

const STEP_TITLES = ['Identity', 'About you', 'Current project', 'Social links']
const TOTAL = 4

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

    // Server-side input length caps (belt + suspenders on top of client maxLength)
    if (data.username.length > 30 || data.bio.length > 500 || data.location.length > 100) {
      setError('Input too long. Please shorten your entries.')
      setIsSubmitting(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      username: data.username.slice(0, 30),
      display_name: (nn(data.display_name) ?? data.username).slice(0, 100),
      bio: nn(data.bio)?.slice(0, 500) ?? null,
      location: nn(data.location)?.slice(0, 100) ?? null,
      primary_role: nn(data.primary_role),
      primary_engine: nn(data.primary_engine),
      experience_level: nn(data.experience_level),
      github_url: nn(data.github_url)?.slice(0, 200) ?? null,
      itchio_url: nn(data.itchio_url)?.slice(0, 200) ?? null,
      twitter_url: nn(data.twitter_url)?.slice(0, 200) ?? null,
      website_url: nn(data.website_url)?.slice(0, 200) ?? null,
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
      <FocusedShell brandHref={null}>
        <div role="status" className="flex flex-col items-center gap-3 py-16 text-small text-fg-secondary">
          <div aria-hidden className="size-8 animate-spin rounded-full border-2 border-line-strong border-t-accent motion-reduce:animate-none" />
          Loading…
        </div>
      </FocusedShell>
    )
  }

  return (
    <FocusedShell brandHref={null} width="lg">
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        {/* Progress */}
        <div className="px-6 pt-8 sm:px-8 md:px-10">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-micro font-semibold uppercase tracking-wide text-link">
              Step {step} / {TOTAL} — {STEP_TITLES[step - 1]}
            </span>
            <span className="text-micro text-fg-muted">~2 min</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i < step ? 'bg-accent' : 'bg-surface-muted')} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-8 sm:px-8 md:px-10">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-h1 font-semibold tracking-tight text-fg">Claim your handle.</h1>
                <p className="mt-1 text-small text-fg-secondary">This is your public address on Glyph. Choose carefully — it&apos;s how people find you.</p>
              </div>
              <Field label="Username">
                {() => <UsernameInput value={data.username} onChange={(v) => set('username', v)} onValidityChange={handleValidity} />}
              </Field>
              <Field label="Display name">
                {(p) => <Input {...p} value={data.display_name} onChange={(e) => set('display_name', e.target.value)} placeholder="e.g. Alex Rivera" />}
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-h1 font-semibold tracking-tight text-fg">Tell devs who you are.</h1>
                <p className="mt-1 text-small text-fg-secondary">All optional — you can edit any of this later.</p>
              </div>
              <Field label="Bio" hint={`${data.bio.length}/160`}>
                {(p) => <Textarea {...p} rows={3} maxLength={160} value={data.bio} onChange={(e) => set('bio', e.target.value)} placeholder="What are you building, and what do you do best?" />}
              </Field>
              <Field label="Location">
                {(p) => <Input {...p} value={data.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Berlin, Germany" />}
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Primary role">
                  {(p) => (
                    <Select {...p} value={data.primary_role} onChange={(e) => set('primary_role', e.target.value)}>
                      <option value="">Select…</option>
                      {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Primary engine">
                  {(p) => (
                    <Select {...p} value={data.primary_engine} onChange={(e) => set('primary_engine', e.target.value)}>
                      <option value="">Select…</option>
                      {ENGINES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  )}
                </Field>
              </div>
              <Field label="Experience level">
                {(p) => (
                  <Select {...p} value={data.experience_level} onChange={(e) => set('experience_level', e.target.value)}>
                    <option value="">Select…</option>
                    {EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                )}
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-h1 font-semibold tracking-tight text-fg">What are you working on?</h1>
                <p className="mt-1 text-small text-fg-secondary">Add your current project, or skip and add one later from your dashboard.</p>
              </div>
              <Field label="Project title">
                {(p) => <Input {...p} value={data.project_title} onChange={(e) => set('project_title', e.target.value)} placeholder="e.g. Hollow Tide" />}
              </Field>
              <Field label="Short description">
                {(p) => <Textarea {...p} rows={2} value={data.project_description} onChange={(e) => set('project_description', e.target.value)} placeholder="One line on what it is." />}
              </Field>
              <Field label="Stage">
                {(p) => (
                  <Select {...p} value={data.project_stage} onChange={(e) => set('project_stage', e.target.value)}>
                    <option value="">Select…</option>
                    {PROJECT_STAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                )}
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-h1 font-semibold tracking-tight text-fg">Where else can people find you?</h1>
                <p className="mt-1 text-small text-fg-secondary">All optional. Add the ones that matter.</p>
              </div>
              <Field label="GitHub">
                {(p) => <Input {...p} value={data.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="https://github.com/you" />}
              </Field>
              <Field label="itch.io">
                {(p) => <Input {...p} value={data.itchio_url} onChange={(e) => set('itchio_url', e.target.value)} placeholder="https://you.itch.io" />}
              </Field>
              <Field label="X (Twitter)">
                {(p) => <Input {...p} value={data.twitter_url} onChange={(e) => set('twitter_url', e.target.value)} placeholder="https://x.com/you" />}
              </Field>
              <Field label="Website">
                {(p) => <Input {...p} value={data.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://yoursite.com" />}
              </Field>
            </div>
          )}

          {error && <p role="alert" className="mt-5 text-small font-medium text-danger">{error}</p>}
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-10">
          {step > 1 ? (
            <Button variant="ghost" onClick={back} disabled={isSubmitting} className="justify-start">
              <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" /> Back
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <div className="flex w-full items-center gap-4 sm:w-auto">
            {(step === 3 || step === 4) && (
              <Button variant="ghost" size="sm" onClick={next} disabled={isSubmitting} className="shrink-0 text-fg-muted">
                {step === 4 ? 'Skip' : 'Skip for now'}
              </Button>
            )}
            <Button variant="primary" onClick={next} disabled={!canAdvance || isSubmitting} loading={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting ? 'Creating…' : step === TOTAL ? 'Finish & go to dashboard' : <>Continue <ArrowRight aria-hidden strokeWidth={1.75} className="size-4" /></>}
            </Button>
          </div>
        </div>
      </div>
    </FocusedShell>
  )
}
