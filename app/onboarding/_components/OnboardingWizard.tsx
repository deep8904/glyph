'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, X, Check, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ───────────────────────────────────────────────

const ENGINES = ['Godot', 'Unity', 'Unreal', 'GameMaker', 'Defold', 'Pygame', 'Love2D', 'Bevy', 'Other']
const ROLES = ['Programmer', 'Artist', 'Designer', 'Composer', 'Writer', 'QA', 'Generalist']

const EXPERIENCE_OPTIONS = [
  { value: 'student',      label: 'Student',       desc: 'Learning game dev at school or university' },
  { value: 'hobbyist',     label: 'Hobbyist',      desc: 'Making games in my spare time for fun' },
  { value: 'indie',        label: 'Indie Dev',     desc: 'Self-publishing or working solo/small team' },
  { value: 'professional', label: 'Professional',  desc: 'Shipping games as my primary career' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'open',     label: 'Open to Collaborate', desc: 'Looking for teammates or freelance work' },
  { value: 'building', label: 'Just Building',        desc: 'Head-down on a project, not seeking collabs' },
  { value: 'closed',   label: 'Not Available',        desc: 'Taking a break from new projects' },
]

// ─── Types ───────────────────────────────────────────────────

type Step1 = { username: string; displayName: string; city: string; experience: string }
type Step2 = { engines: string[]; roles: string[]; projectName: string }
type Step3 = { bio: string; availability: string }
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

// ─── Sub-components ──────────────────────────────────────────

function PillToggle({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition select-none ${
        active
          ? 'border-[var(--color-glyph-orange)] bg-[var(--color-glyph-orange-lo)] text-[var(--color-glyph-orange)]'
          : 'border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] text-[var(--color-glyph-text-2)] hover:border-[var(--color-glyph-border-hi)]'
      }`}
    >
      {label}
    </button>
  )
}

function OptionCard({
  label,
  desc,
  active,
  onClick,
}: {
  label: string
  desc: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition ${
        active
          ? 'border-[var(--color-glyph-orange)] bg-[var(--color-glyph-orange-lo)]'
          : 'border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] hover:border-[var(--color-glyph-border-hi)]'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`size-4 shrink-0 rounded-full border-2 transition ${
            active ? 'border-[var(--color-glyph-orange)] bg-[var(--color-glyph-orange)]' : 'border-[var(--color-glyph-border-hi)]'
          }`}
        />
        <span className="font-sans text-sm font-medium text-[var(--color-glyph-text)]">{label}</span>
      </div>
      <p className="mt-1 pl-6 font-sans text-xs leading-relaxed text-[var(--color-glyph-text-2)]">{desc}</p>
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-mono text-xs font-medium text-[var(--color-glyph-text-2)]">
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] px-4 py-3 font-sans text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/30 ${className ?? ''}`}
    />
  )
}

// ─── Main wizard ─────────────────────────────────────────────

export function OnboardingWizard({
  userId,
  initialDisplayName,
}: {
  userId: string
  initialDisplayName: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [step1, setStep1] = useState<Step1>({
    username: '',
    displayName: initialDisplayName,
    city: '',
    experience: '',
  })
  const [step2, setStep2] = useState<Step2>({ engines: [], roles: [], projectName: '' })
  const [step3, setStep3] = useState<Step3>({ bio: '', availability: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  // ── Username availability check ──────────────────────────

  useEffect(() => {
    const val = step1.username
    if (!val) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]{3,30}$/.test(val)) { setUsernameStatus('invalid'); return }

    setUsernameStatus('checking')
    const t = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', val)
        .neq('id', userId)
        .maybeSingle()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(t)
  }, [step1.username, userId])

  // ── Avatar handling ──────────────────────────────────────

  function setAvatar(file: File) {
    if (!file.type.startsWith('image/')) return
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setAvatar(file)
  }

  // ── Step validation ──────────────────────────────────────

  function canProceed(): boolean {
    if (step === 1) {
      return (
        usernameStatus === 'available' &&
        step1.displayName.trim().length > 0 &&
        step1.experience !== ''
      )
    }
    if (step === 2) return step2.engines.length > 0 && step2.roles.length > 0
    if (step === 3) return step3.availability !== ''
    return false
  }

  // ── Toggle pill helpers ──────────────────────────────────

  function toggleEngine(e: string) {
    setStep2(s => ({
      ...s,
      engines: s.engines.includes(e) ? s.engines.filter(x => x !== e) : [...s.engines, e],
    }))
  }

  function toggleRole(r: string) {
    setStep2(s => ({
      ...s,
      roles: s.roles.includes(r) ? s.roles.filter(x => x !== r) : [...s.roles, r],
    }))
  }

  // ── Final submit ─────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    const supabase = createClient()

    let avatarUrl: string | null = null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() ?? 'png'
      const path = `${userId}/${Date.now()}.${ext}`
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })

      if (uploadErr) {
        setSubmitError('Avatar upload failed. Please try again.')
        setSubmitting(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(upload.path)
      avatarUrl = publicUrl
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        username: step1.username,
        display_name: step1.displayName.trim(),
        city: step1.city.trim() || null,
        experience: step1.experience as 'student' | 'hobbyist' | 'indie' | 'professional',
        engines: step2.engines,
        roles: step2.roles,
        bio: step3.bio.trim() || null,
        availability: step3.availability as 'open' | 'building' | 'closed',
        avatar_url: avatarUrl,
        onboarding_done: true,
      })
      .eq('id', userId)

    if (profileErr) {
      setSubmitError(
        profileErr.message.includes('duplicate key')
          ? 'That username was just taken. Please choose another.'
          : 'Failed to save your profile. Please try again.'
      )
      setSubmitting(false)
      return
    }

    // Create project stub if a project name was provided
    if (step2.projectName.trim()) {
      const baseSlug = step2.projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 55)
      const suffix = Math.random().toString(36).slice(2, 6)
      await supabase.from('projects').insert({
        developer_id: userId,
        slug: `${baseSlug}-${suffix}`,
        title: step2.projectName.trim(),
        stage: 'prototype',
        is_public: false,
        genre: [],
        open_for_testers: false,
        open_for_collabs: false,
      })
    }

    setDone(true)
    setTimeout(() => router.push('/feed'), 1600)
  }

  // ── Render ───────────────────────────────────────────────

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-glyph-black)]">
        <div className="animate-in-up flex flex-col items-center gap-4 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-[var(--color-glyph-orange-lo)] glow-orange-sm">
            <CheckCircle2 size={40} className="text-[var(--color-glyph-orange)]" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-[var(--color-glyph-text)]">
            You're in! 🎮
          </h2>
          <p className="font-sans text-sm text-[var(--color-glyph-text-2)]">
            Setting up your feed…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-glyph-black)] px-4 py-8">
      {/* Header */}
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-[var(--color-glyph-orange)]">◈</span>
            <span className="font-heading text-xl font-bold text-[var(--color-glyph-text)]">Glyph</span>
          </div>
          <span className="font-mono text-xs text-[var(--color-glyph-text-3)]">Step {step} of 3</span>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-[var(--color-glyph-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--color-glyph-orange)] transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* ── STEP 1: Identity ─────────────────────────────── */}
        {step === 1 && (
          <div className="animate-in-fade space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[var(--color-glyph-text)]">
                Set up your identity
              </h1>
              <p className="mt-1 font-sans text-sm text-[var(--color-glyph-text-2)]">
                This is how the community will know you.
              </p>
            </div>

            {/* Username */}
            <div>
              <FieldLabel>
                Choose your @handle <span className="text-red-400">*</span>
              </FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-glyph-text-3)]">
                  @
                </span>
                <input
                  type="text"
                  value={step1.username}
                  onChange={e => setStep1(s => ({ ...s, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="your_handle"
                  maxLength={30}
                  className="w-full rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] pl-8 pr-10 py-3 font-mono text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/30"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 size={16} className="animate-spin text-[var(--color-glyph-text-3)]" />}
                  {usernameStatus === 'available' && <Check size={16} className="text-green-400" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X size={16} className="text-red-400" />}
                </div>
              </div>
              {usernameStatus === 'taken' && (
                <p className="mt-1.5 font-mono text-xs text-red-400">Username is already taken</p>
              )}
              {usernameStatus === 'invalid' && step1.username && (
                <p className="mt-1.5 font-mono text-xs text-red-400">
                  3–30 chars · lowercase letters, numbers, underscores only
                </p>
              )}
              {usernameStatus === 'available' && (
                <p className="mt-1.5 font-mono text-xs text-green-400">✓ Available!</p>
              )}
            </div>

            {/* Display name */}
            <div>
              <FieldLabel>
                Display name <span className="text-red-400">*</span>
              </FieldLabel>
              <TextInput
                value={step1.displayName}
                onChange={v => setStep1(s => ({ ...s, displayName: v }))}
                placeholder="Your Name"
                maxLength={60}
              />
            </div>

            {/* City */}
            <div>
              <FieldLabel>Where are you based? (optional)</FieldLabel>
              <TextInput
                value={step1.city}
                onChange={v => setStep1(s => ({ ...s, city: v }))}
                placeholder="Phoenix, AZ"
              />
            </div>

            {/* Experience */}
            <div>
              <FieldLabel>
                Experience level <span className="text-red-400">*</span>
              </FieldLabel>
              <div className="space-y-2">
                {EXPERIENCE_OPTIONS.map(opt => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    desc={opt.desc}
                    active={step1.experience === opt.value}
                    onClick={() => setStep1(s => ({ ...s, experience: opt.value }))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Tools ────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-in-fade space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[var(--color-glyph-text)]">
                Your tools & role
              </h1>
              <p className="mt-1 font-sans text-sm text-[var(--color-glyph-text-2)]">
                Help others find and collaborate with you.
              </p>
            </div>

            {/* Engines */}
            <div>
              <FieldLabel>
                Which engine do you use? <span className="text-red-400">*</span>
              </FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ENGINES.map(e => (
                  <PillToggle
                    key={e}
                    label={e}
                    active={step2.engines.includes(e)}
                    onClick={() => toggleEngine(e)}
                  />
                ))}
              </div>
            </div>

            {/* Roles */}
            <div>
              <FieldLabel>
                What's your role? <span className="text-red-400">*</span>
              </FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <PillToggle
                    key={r}
                    label={r}
                    active={step2.roles.includes(r)}
                    onClick={() => toggleRole(r)}
                  />
                ))}
              </div>
            </div>

            {/* Project name */}
            <div>
              <FieldLabel>What are you currently building? (optional)</FieldLabel>
              <TextInput
                value={step2.projectName}
                onChange={v => setStep2(s => ({ ...s, projectName: v }))}
                placeholder="My Awesome Game"
                maxLength={80}
              />
              <p className="mt-1.5 font-mono text-xs text-[var(--color-glyph-text-3)]">
                We'll create a project page stub — you can fill in the details later.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Look ─────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-in-fade space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[var(--color-glyph-text)]">
                Your look & availability
              </h1>
              <p className="mt-1 font-sans text-sm text-[var(--color-glyph-text-2)]">
                Almost done — add your avatar and a quick bio.
              </p>
            </div>

            {/* Avatar upload */}
            <div>
              <FieldLabel>Profile picture (optional)</FieldLabel>
              <div className="flex items-center gap-5">
                {/* Preview */}
                <div className="size-20 shrink-0 overflow-hidden rounded-full border-2 border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <span className="font-heading text-2xl font-bold text-[var(--color-glyph-text-3)]">
                        {(step1.displayName[0] ?? '?').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition ${
                    isDragging
                      ? 'border-[var(--color-glyph-orange)] bg-[var(--color-glyph-orange-lo)]'
                      : 'border-[var(--color-glyph-border)] hover:border-[var(--color-glyph-border-hi)]'
                  }`}
                >
                  <Upload size={20} className="text-[var(--color-glyph-text-3)]" />
                  <p className="font-sans text-xs text-[var(--color-glyph-text-3)]">
                    Drop image here or <span className="text-[var(--color-glyph-orange)]">click to browse</span>
                  </p>
                  <p className="font-mono text-[10px] text-[var(--color-glyph-text-3)]">PNG, JPG, GIF · max 5 MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setAvatar(f) }}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <FieldLabel>One-line bio (optional)</FieldLabel>
              <textarea
                value={step3.bio}
                onChange={e => setStep3(s => ({ ...s, bio: e.target.value }))}
                placeholder="Making a cozy farming RPG in Godot. Phoenix local."
                maxLength={140}
                rows={2}
                className="w-full resize-none rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] px-4 py-3 font-sans text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/30"
              />
              <p className="mt-1 text-right font-mono text-xs text-[var(--color-glyph-text-3)]">
                {140 - step3.bio.length} remaining
              </p>
            </div>

            {/* Availability */}
            <div>
              <FieldLabel>
                Availability <span className="text-red-400">*</span>
              </FieldLabel>
              <div className="space-y-2">
                {AVAILABILITY_OPTIONS.map(opt => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    desc={opt.desc}
                    active={step3.availability === opt.value}
                    onClick={() => setStep3(s => ({ ...s, availability: opt.value }))}
                  />
                ))}
              </div>
            </div>

            {submitError && (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 font-sans text-sm text-red-400">
                {submitError}
              </p>
            )}
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-glyph-border)] px-4 py-2.5 font-sans text-sm text-[var(--color-glyph-text-2)] transition hover:border-[var(--color-glyph-border-hi)] disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-glyph-orange)] px-5 py-2.5 font-sans text-sm font-medium text-white transition hover:bg-[#ff5c27] active:scale-[0.98] disabled:opacity-40"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-glyph-orange)] px-5 py-2.5 font-sans text-sm font-medium text-white transition hover:bg-[#ff5c27] active:scale-[0.98] disabled:opacity-40"
            >
              {submitting ? (
                <><Loader2 size={15} className="animate-spin" /> Saving…</>
              ) : (
                <>Finish setup <ChevronRight size={16} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
