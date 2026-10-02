'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GButton } from '@/components/glyph/ui/primitives'
import { GErrorState } from '@/components/glyph/ui/States'
import { OnboardingTextField, OnboardingTextarea, OnboardingSelect } from './OnboardingField'
import { GlyphUsernameField } from './GlyphUsernameField'
import { ROLES, ENGINES, EXPERIENCE_LEVELS, PROJECT_STAGES, labelFor } from '@/lib/supabase/types'
import { classifyOnboardingGate, runOnboardingSubmit, retryProjectOnly, retryFinalizeOnly, type ExistingProfile } from '@/lib/glyph/onboardingFlow'

type FormData = {
  username: string
  display_name: string
  bio: string
  location: string
  primary_role: string
  primary_engine: string
  experience_level: string
  github_url: string
  itchio_url: string
  twitter_url: string
  website_url: string
  project_title: string
  project_description: string
  project_stage: string
}

const EMPTY: FormData = {
  username: '', display_name: '', bio: '', location: '', primary_role: '', primary_engine: '',
  experience_level: '', github_url: '', itchio_url: '', twitter_url: '', website_url: '',
  project_title: '', project_description: '', project_stage: '',
}

type Gate = { kind: 'checking' } | { kind: 'ready' } | { kind: 'error' }
type Stage = 1 | 2 | 3 | 4
type ProjectIntent = 'include' | 'skip' | null
const STAGE_COUNT = 4

const nn = (v: string) => (v.trim() ? v.trim() : null)
const fromExisting = (p: ExistingProfile): FormData => ({
  ...EMPTY,
  username: p.username,
  display_name: p.display_name ?? '',
  bio: p.bio ?? '',
  location: p.location ?? '',
  primary_role: p.primary_role ?? '',
  primary_engine: p.primary_engine ?? '',
  experience_level: p.experience_level ?? '',
  github_url: p.github_url ?? '',
  itchio_url: p.itchio_url ?? '',
  twitter_url: p.twitter_url ?? '',
  website_url: p.website_url ?? '',
})

/**
 * The bridge between account creation and the real product: the minimum truthful identity (a
 * claimed username) plus optional craft and build context, ending in an explicit review before
 * anything is written. Product truth preserved: the same `profiles`/`projects` columns and length
 * caps, the same `is_onboarded` flag, the same draft-lifecycle project with no slug, the same
 * `/dashboard` destination.
 *
 * Two things a lie-by-omission previously hid, now made explicit and durable (lib/glyph/onboardingFlow.ts):
 * a failed project insert after a successful profile insert is never silently dropped, and when a
 * project is requested the profile is written `is_onboarded: false` first — a real, committed row —
 * only flipped to `true` by a separate `finalize` step once the project succeeds or is explicitly
 * skipped. A reload or a fresh visit re-reads that row (the `resume` gate state) and continues from
 * it instead of re-running profile creation or losing the retry/skip decision to React memory.
 */
export function GlyphOnboardingFlow() {
  const router = useRouter()
  const supabase = createClient()

  const [gate, setGate] = useState<Gate>({ kind: 'checking' })
  const [userId, setUserId] = useState<string | null>(null)
  const [profileExists, setProfileExists] = useState(false)
  const [stage, setStage] = useState<Stage>(1)
  const [minStage, setMinStage] = useState<Stage>(1)
  const [data, setData] = useState<FormData>(EMPTY)
  const [projectIntent, setProjectIntent] = useState<ProjectIntent>(null)
  const [usernameValid, setUsernameValid] = useState(false)
  const [usernameRequiredError, setUsernameRequiredError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [stuck, setStuck] = useState<'project' | 'finalize' | null>(null)
  const [retrying, setRetrying] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  const runGateCheck = useCallback((cancelledRef: { current: boolean }) => {
    (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (cancelledRef.current) return
        if (userError) { setGate({ kind: 'error' }); return }
        if (!user) { router.replace('/login'); return }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, display_name, bio, location, primary_role, primary_engine, experience_level, github_url, itchio_url, twitter_url, website_url, is_onboarded')
          .eq('id', user.id)
          .maybeSingle<ExistingProfile & { is_onboarded: boolean }>()
        if (cancelledRef.current) return
        const decision = classifyOnboardingGate(user, profile, profileError)
        if (decision.kind === 'no-user') { router.replace('/login'); return }
        if (decision.kind === 'already-onboarded') { router.replace('/dashboard'); return }
        if (decision.kind === 'error') { setGate({ kind: 'error' }); return }
        setUserId(user.id)
        if (decision.kind === 'resume') {
          setProfileExists(true)
          setData(fromExisting(decision.profile))
          setUsernameValid(true)
          setStage(3)
          setMinStage(3)
        }
        setGate({ kind: 'ready' })
      } catch {
        if (!cancelledRef.current) setGate({ kind: 'error' })
      }
    })()
  }, [supabase, router])

  useEffect(() => {
    const cancelledRef = { current: false }
    runGateCheck(cancelledRef)
    return () => { cancelledRef.current = true }
  }, [runGateCheck])

  const retryGateCheck = () => {
    setGate({ kind: 'checking' })
    runGateCheck({ current: false })
  }

  const set = (key: keyof FormData, value: string) => setData((d) => ({ ...d, [key]: value }))

  const handleUsernameValidity = useCallback((valid: boolean) => setUsernameValid(valid), [])

  const advance = () => {
    if (stage === 1) {
      if (!usernameValid) {
        setUsernameRequiredError(data.username ? '' : 'Choose a username to continue.')
        usernameRef.current?.focus()
        return
      }
    }
    setUsernameRequiredError('')
    if (stage < STAGE_COUNT) setStage((s) => (s + 1) as Stage)
  }
  const back = () => { if (stage > minStage) setStage((s) => (s - 1) as Stage) }

  const projectTitleEntered = !!nn(data.project_title)
  const hasProject = projectIntent === 'include' && projectTitleEntered

  const insertProfile = () => {
    if (!userId) throw new Error('missing user id')
    return supabase.from('profiles').insert({
      id: userId,
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
      // Durable partial-onboarding recovery: when a project is requested this row is deliberately
      // NOT yet onboarded — `finalize` below is what flips it, only once the project has succeeded
      // or been explicitly skipped. A reload before that finds this exact row via the `resume` gate.
      is_onboarded: !hasProject,
    })
  }

  // No slug is collected here, so this can never be 'published' (slug_required_when_published
  // constraint) — explicit, not relying on the column default, so this insert stays correct even if
  // the schema's own default ever changes.
  const insertProject = () => {
    if (!userId) throw new Error('missing user id')
    return supabase.from('projects').insert({
      owner_id: userId,
      title: data.project_title.trim(),
      short_description: nn(data.project_description),
      stage: nn(data.project_stage),
      is_primary: true,
      lifecycle: 'draft',
    })
  }

  const finalize = () => {
    if (!userId) throw new Error('missing user id')
    // `.select('id')` after the update returns the affected row(s) — `runFinalize` requires at least
    // one back, since `error: null` alone doesn't prove this user's profile was actually updated.
    return supabase.from('profiles').update({ is_onboarded: true }).eq('id', userId).select('id')
  }

  const goToDashboard = () => { router.push('/dashboard'); router.refresh() }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitError('')
    setSubmitting(true)
    const outcome = await runOnboardingSubmit(profileExists, insertProfile, hasProject, insertProject, finalize)
    switch (outcome.kind) {
      case 'username-taken':
        setSubmitting(false)
        setUsernameValid(false)
        setUsernameRequiredError('That username was just taken. Choose another.')
        setStage(1)
        return
      case 'profile-error':
        setSubmitting(false)
        setSubmitError('Could not create your profile right now. Try again.')
        return
      case 'project-error':
        setSubmitting(false)
        setProfileExists(true) // the profile row now durably exists even on a fresh flow
        setStuck('project')
        return
      case 'finalize-error':
        setSubmitting(false)
        setProfileExists(true)
        setStuck('finalize')
        return
      case 'done':
        goToDashboard()
        // stay pending — navigation takes over
        return
    }
  }

  const handleRetryProject = async () => {
    if (retrying) return
    setRetrying(true)
    const outcome = await retryProjectOnly(insertProject, finalize)
    if (outcome.kind === 'done') { goToDashboard(); return }
    if (outcome.kind === 'finalize-error') { setStuck('finalize'); setRetrying(false); return }
    setRetrying(false)
  }

  const handleSkipToFinalize = async () => {
    if (retrying) return
    setRetrying(true)
    const outcome = await retryFinalizeOnly(finalize)
    if (outcome.kind === 'done') { goToDashboard(); return }
    setRetrying(false)
  }

  if (gate.kind === 'checking') {
    return <p role="status" className="text-body text-ink-2">Setting things up…</p>
  }

  if (gate.kind === 'error') {
    return (
      <div className="flex flex-col gap-6">
        <GErrorState title="We couldn't load your account" description="This may be temporary. Reload to try again." />
        <GButton variant="ember" size="md" onClick={retryGateCheck} className="justify-center">Try again</GButton>
      </div>
    )
  }

  if (stuck === 'project') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Almost there</h1>
          <p className="mt-1.5 text-body text-ink-2">Your profile was saved, but &ldquo;{data.project_title.trim()}&rdquo; couldn&apos;t be. You can try again, or finish without it — either way your profile is safe, and you can add a project anytime from your dashboard.</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <GButton variant="ember" size="md" onClick={handleRetryProject} disabled={retrying} aria-busy={retrying} className="justify-center">
            {retrying ? 'Trying again…' : 'Try saving the project again'}
          </GButton>
          <GButton variant="outline" size="md" onClick={handleSkipToFinalize} disabled={retrying} aria-busy={retrying} className="justify-center">
            Skip — go to dashboard without it
          </GButton>
        </div>
      </div>
    )
  }

  if (stuck === 'finalize') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Almost there</h1>
          <p className="mt-1.5 text-body text-ink-2">Everything you asked for was saved, but we couldn&apos;t finish setting up your account. Try again — nothing will be created twice.</p>
        </div>
        <GButton variant="ember" size="md" onClick={handleSkipToFinalize} disabled={retrying} aria-busy={retrying} className="justify-center">
          {retrying ? 'Trying again…' : 'Try again'}
        </GButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-micro uppercase tracking-[0.08em] text-ink-3">Step {stage} of {STAGE_COUNT}</p>

      {stage === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Claim your handle</h1>
            <p className="mt-1.5 text-body text-ink-2">This is your address on Glyph — where your build record lives. Choose carefully.</p>
          </div>
          <GlyphUsernameField ref={usernameRef} value={data.username} onChange={(v) => { set('username', v); if (usernameRequiredError) setUsernameRequiredError('') }} onValidityChange={handleUsernameValidity} error={usernameRequiredError} />
          <OnboardingTextField label="Display name" optional value={data.display_name} onChange={(e) => set('display_name', e.target.value)} placeholder="e.g. Alex Rivera" maxLength={100} description="Defaults to your username if left blank." />
        </div>
      )}

      {stage === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Describe your craft</h1>
            <p className="mt-1.5 text-body text-ink-2">All optional — you can change any of this later.</p>
          </div>
          <OnboardingTextarea label="Bio" optional rows={3} maxLength={500} value={data.bio} onChange={(e) => set('bio', e.target.value)} placeholder="What are you building, and what do you do best?" description={`${data.bio.length}/500`} />
          <OnboardingTextField label="Location" optional value={data.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Berlin, Germany" maxLength={100} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <OnboardingSelect label="Primary role" optional options={ROLES} value={data.primary_role} onChange={(e) => set('primary_role', e.target.value)} />
            <OnboardingSelect label="Primary engine" optional options={ENGINES} value={data.primary_engine} onChange={(e) => set('primary_engine', e.target.value)} />
          </div>
          <OnboardingSelect label="Experience level" optional options={EXPERIENCE_LEVELS} value={data.experience_level} onChange={(e) => set('experience_level', e.target.value)} />
          <fieldset className="flex flex-col gap-4 border-t border-hair pt-5">
            <legend className="pb-1 text-small font-medium text-ink">Links <span className="font-normal text-ink-3">(optional)</span></legend>
            <OnboardingTextField label="GitHub" optional type="url" value={data.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="https://github.com/you" maxLength={200} />
            <OnboardingTextField label="itch.io" optional type="url" value={data.itchio_url} onChange={(e) => set('itchio_url', e.target.value)} placeholder="https://you.itch.io" maxLength={200} />
            <OnboardingTextField label="X (Twitter)" optional type="url" value={data.twitter_url} onChange={(e) => set('twitter_url', e.target.value)} placeholder="https://x.com/you" maxLength={200} />
            <OnboardingTextField label="Website" optional type="url" value={data.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://yoursite.com" maxLength={200} />
          </fieldset>
        </div>
      )}

      {stage === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">{profileExists ? 'Welcome back — add a project?' : 'Name what you’re building'}</h1>
            <p className="mt-1.5 text-body text-ink-2">
              {profileExists ? 'Your profile is already saved. ' : ''}Optional — start your build record now, or add a project later from your dashboard.
            </p>
          </div>
          <OnboardingTextField label="Project title" optional value={data.project_title} onChange={(e) => { set('project_title', e.target.value); setProjectIntent(null) }} placeholder="e.g. Hollow Tide" maxLength={200} />
          <OnboardingTextarea label="Short description" optional rows={2} value={data.project_description} onChange={(e) => set('project_description', e.target.value)} placeholder="One line on what it is." />
          <OnboardingSelect label="Stage" optional options={PROJECT_STAGES} value={data.project_stage} onChange={(e) => set('project_stage', e.target.value)} />
          <p className="text-micro text-ink-3">This starts as a private draft — nothing is public until you publish it.</p>
        </div>
      )}

      {stage === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Review before you finish</h1>
            <p className="mt-1.5 text-body text-ink-2">Every value below is saved to your public profile.</p>
          </div>
          <dl className="divide-y divide-hair rounded-[12px] border border-hair">
            <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Username</dt><dd className="text-small font-medium text-ink">@{data.username}</dd></div>
            <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Display name</dt><dd className="text-small font-medium text-ink">{nn(data.display_name) ?? data.username}</dd></div>
            {nn(data.bio) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Bio</dt><dd className="max-w-[65%] text-right text-small text-ink">{data.bio}</dd></div>}
            {nn(data.location) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Location</dt><dd className="text-small text-ink">{data.location}</dd></div>}
            {nn(data.primary_role) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Role</dt><dd className="text-small text-ink">{labelFor(ROLES, data.primary_role)}</dd></div>}
            {nn(data.primary_engine) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Engine</dt><dd className="text-small text-ink">{labelFor(ENGINES, data.primary_engine)}</dd></div>}
            {nn(data.experience_level) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Experience</dt><dd className="text-small text-ink">{labelFor(EXPERIENCE_LEVELS, data.experience_level)}</dd></div>}
            {nn(data.github_url) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">GitHub</dt><dd className="max-w-[65%] truncate text-small text-ink">{data.github_url}</dd></div>}
            {nn(data.itchio_url) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">itch.io</dt><dd className="max-w-[65%] truncate text-small text-ink">{data.itchio_url}</dd></div>}
            {nn(data.twitter_url) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">X (Twitter)</dt><dd className="max-w-[65%] truncate text-small text-ink">{data.twitter_url}</dd></div>}
            {nn(data.website_url) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Website</dt><dd className="max-w-[65%] truncate text-small text-ink">{data.website_url}</dd></div>}
          </dl>
          {hasProject ? (
            <div>
              <h2 className="mb-2 text-small font-semibold uppercase tracking-wide text-ink-3">Also creating a project (private draft)</h2>
              <dl className="divide-y divide-hair rounded-[12px] border border-hair">
                <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Title</dt><dd className="text-small font-medium text-ink">{data.project_title.trim()}</dd></div>
                {nn(data.project_stage) && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-small text-ink-2">Stage</dt><dd className="text-small text-ink">{labelFor(PROJECT_STAGES, data.project_stage)}</dd></div>}
              </dl>
            </div>
          ) : projectTitleEntered ? (
            <p className="text-small text-ink-2">&ldquo;{data.project_title.trim()}&rdquo; will <span className="font-medium text-ink">not</span> be created — you chose to skip it. You can add it anytime from your dashboard.</p>
          ) : (
            <p className="text-small text-ink-2">No project yet — you can add one anytime from your dashboard.</p>
          )}
          {submitError && <p role="alert" className="text-small font-medium text-gdanger">{submitError}</p>}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-hair pt-5 sm:flex-row sm:items-center sm:justify-between">
        {stage > minStage ? (
          <GButton variant="ghost" size="md" onClick={back} disabled={submitting} className="justify-center sm:justify-start">Back</GButton>
        ) : <span className="hidden sm:block" />}
        <div className="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row sm:items-center">
          {stage === 3 ? (
            projectTitleEntered ? (
              <>
                <GButton variant="ghost" size="md" onClick={() => { setProjectIntent('skip'); advance() }} disabled={submitting} className="justify-center text-ink-3">Skip for now</GButton>
                <GButton variant="ember" size="md" onClick={() => { setProjectIntent('include'); advance() }} disabled={submitting} className="justify-center">Include & continue</GButton>
              </>
            ) : (
              <GButton variant="ember" size="md" onClick={() => { setProjectIntent('skip'); advance() }} disabled={submitting} className="justify-center">Continue without a project</GButton>
            )
          ) : stage < STAGE_COUNT ? (
            <GButton variant="ember" size="md" onClick={advance} disabled={submitting} className="justify-center">Continue</GButton>
          ) : (
            <GButton variant="ember" size="md" onClick={handleSubmit} disabled={submitting} aria-busy={submitting} className="justify-center">
              {submitting ? 'Creating…' : 'Finish and go to dashboard'}
            </GButton>
          )}
        </div>
      </div>
    </div>
  )
}
