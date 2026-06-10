'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

const ENGINES = ['Godot', 'Unity', 'Unreal', 'GameMaker', 'Defold', 'Pygame', 'Love2D', 'Bevy', 'Other']
const ROLES   = ['Programmer', 'Artist', 'Designer', 'Composer', 'Writer', 'QA', 'Generalist']

const schema = z.object({
  display_name:   z.string().min(1, 'Display name is required').max(60),
  username:       z.string().regex(/^[a-z0-9_]{3,30}$/, 'Lowercase letters, numbers, underscores only (3-30 chars)'),
  bio:            z.string().max(140).optional(),
  city:           z.string().max(60).optional(),
  website_url:    z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github_handle:  z.string().max(40).optional(),
  itch_handle:    z.string().max(40).optional(),
  twitter_handle: z.string().max(40).optional(),
  experience:     z.enum(['student', 'hobbyist', 'indie', 'professional']),
  availability:   z.enum(['open', 'building', 'closed']),
  engines:        z.array(z.string()),
  roles:          z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function PillToggle({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`rounded-xl border px-3 py-1.5 font-sans text-sm transition ${
            selected.includes(opt)
              ? 'border-[var(--color-glyph-orange)] bg-[var(--color-glyph-orange-lo)] text-[var(--color-glyph-orange)]'
              : 'border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] text-[var(--color-glyph-text-2)] hover:border-[var(--color-glyph-border-hi)]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-mono text-xs font-medium text-[var(--color-glyph-text-2)]">
      {children}
    </label>
  )
}

const INPUT_CLS =
  'w-full rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] px-4 py-3 font-sans text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/30'

export function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name:   profile.display_name,
      username:       profile.username ?? '',
      bio:            profile.bio ?? '',
      city:           profile.city ?? '',
      website_url:    profile.website_url ?? '',
      github_handle:  profile.github_handle ?? '',
      itch_handle:    profile.itch_handle ?? '',
      twitter_handle: profile.twitter_handle ?? '',
      experience:     profile.experience,
      availability:   profile.availability,
      engines:        profile.engines ?? [],
      roles:          profile.roles ?? [],
    },
  })

  const watchedUsername = watch('username')
  const watchedBio      = watch('bio') ?? ''
  const watchedEngines  = watch('engines')
  const watchedRoles    = watch('roles')

  useEffect(() => {
    const val = watchedUsername
    if (val === profile.username) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]{3,30}$/.test(val)) { setUsernameStatus('invalid'); return }

    setUsernameStatus('checking')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', val)
        .neq('id', profile.id)
        .maybeSingle()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [watchedUsername, profile.username, profile.id])

  function pickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File) => void,
    setPreview: (s: string) => void
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    setFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadImage(bucket: string, path: string, file: File): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async function onSubmit(values: FormValues) {
    if (usernameStatus === 'taken') return
    setSaving(true)
    setSaveError('')

    const supabase = createClient()
    const updates: Partial<Profile> = {
      display_name:   values.display_name,
      username:       values.username,
      bio:            values.bio || null,
      city:           values.city || null,
      website_url:    values.website_url || null,
      github_handle:  values.github_handle || null,
      itch_handle:    values.itch_handle || null,
      twitter_handle: values.twitter_handle || null,
      experience:     values.experience,
      availability:   values.availability,
      engines:        values.engines,
      roles:          values.roles,
    }

    if (avatarFile) {
      const url = await uploadImage('avatars', `${profile.id}/${Date.now()}.webp`, avatarFile)
      if (url) updates.avatar_url = url
    }
    if (bannerFile) {
      const url = await uploadImage('banners', `${profile.id}/${Date.now()}.webp`, bannerFile)
      if (url) updates.banner_url = url
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return
    }

    router.push(`/dev/${values.username}`)
    router.refresh()
  }

  const USERNAME_HINT: Record<UsernameStatus, { text: string; cls: string }> = {
    idle:      { text: '', cls: '' },
    checking:  { text: 'Checking…', cls: 'text-[var(--color-glyph-text-3)]' },
    available: { text: '✓ Available', cls: 'text-green-400' },
    taken:     { text: '✗ Already taken', cls: 'text-red-400' },
    invalid:   { text: 'Lowercase letters, numbers, underscores (3-30 chars)', cls: 'text-amber-400' },
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Avatar + Banner */}
      <section className="space-y-4">
        <h2 className="font-heading text-sm font-bold text-[var(--color-glyph-text)]">Images</h2>

        {/* Banner */}
        <div>
          <Label>Banner Image</Label>
          <label className="relative block h-32 cursor-pointer overflow-hidden rounded-xl border border-dashed border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] transition hover:border-[var(--color-glyph-border-hi)]">
            {bannerPreview ? (
              <img src={bannerPreview} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-sans text-xs text-[var(--color-glyph-text-3)]">Click to upload banner</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => pickFile(e, setBannerFile, setBannerPreview)}
            />
          </label>
        </div>

        {/* Avatar */}
        <div>
          <Label>Avatar</Label>
          <label className="relative block size-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] transition hover:border-[var(--color-glyph-border-hi)]">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-mono text-[9px] text-[var(--color-glyph-text-3)]">Upload</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => pickFile(e, setAvatarFile, setAvatarPreview)}
            />
          </label>
        </div>
      </section>

      {/* Identity */}
      <section className="space-y-4">
        <h2 className="font-heading text-sm font-bold text-[var(--color-glyph-text)]">Identity</h2>

        <div>
          <Label>Display Name</Label>
          <input {...register('display_name')} className={INPUT_CLS} placeholder="Your Name" />
          {errors.display_name && <p className="mt-1 font-mono text-xs text-red-400">{errors.display_name.message}</p>}
        </div>

        <div>
          <Label>Username</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-glyph-text-3)]">@</span>
            <input {...register('username')} className={`${INPUT_CLS} pl-8`} placeholder="yourhandle" />
          </div>
          {USERNAME_HINT[usernameStatus].text && (
            <p className={`mt-1 font-mono text-xs ${USERNAME_HINT[usernameStatus].cls}`}>
              {USERNAME_HINT[usernameStatus].text}
            </p>
          )}
          {errors.username && <p className="mt-1 font-mono text-xs text-red-400">{errors.username.message}</p>}
        </div>

        <div>
          <Label>Bio <span className="text-[var(--color-glyph-text-3)]">({140 - watchedBio.length} left)</span></Label>
          <textarea
            {...register('bio')}
            rows={3}
            maxLength={140}
            className={`${INPUT_CLS} resize-none`}
            placeholder="A short line about you and what you're building…"
          />
        </div>

        <div>
          <Label>City</Label>
          <input {...register('city')} className={INPUT_CLS} placeholder="Phoenix, AZ" />
        </div>
      </section>

      {/* Links */}
      <section className="space-y-4">
        <h2 className="font-heading text-sm font-bold text-[var(--color-glyph-text)]">Links</h2>

        {[
          { key: 'website_url'    as const, label: 'Website URL',         placeholder: 'https://yoursite.com' },
          { key: 'github_handle'  as const, label: 'GitHub username',     placeholder: 'octocat' },
          { key: 'itch_handle'    as const, label: 'itch.io username',    placeholder: 'yourname' },
          { key: 'twitter_handle' as const, label: 'Twitter/X handle',   placeholder: 'handle (no @)' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <Label>{label}</Label>
            <input {...register(key)} className={INPUT_CLS} placeholder={placeholder} />
            {errors[key] && <p className="mt-1 font-mono text-xs text-red-400">{errors[key]?.message}</p>}
          </div>
        ))}
      </section>

      {/* Status */}
      <section className="space-y-4">
        <h2 className="font-heading text-sm font-bold text-[var(--color-glyph-text)]">Status</h2>

        <div>
          <Label>Experience</Label>
          <select {...register('experience')} className={INPUT_CLS}>
            <option value="student">Student</option>
            <option value="hobbyist">Hobbyist</option>
            <option value="indie">Indie Dev</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        <div>
          <Label>Availability</Label>
          <select {...register('availability')} className={INPUT_CLS}>
            <option value="open">Open to Collaborate</option>
            <option value="building">Just Building</option>
            <option value="closed">Not Available</option>
          </select>
        </div>
      </section>

      {/* Engines + Roles */}
      <section className="space-y-4">
        <h2 className="font-heading text-sm font-bold text-[var(--color-glyph-text)]">Tools &amp; Role</h2>

        <div>
          <Label>Engines</Label>
          <PillToggle
            options={ENGINES}
            selected={watchedEngines}
            onChange={vals => setValue('engines', vals)}
          />
        </div>

        <div>
          <Label>Roles</Label>
          <PillToggle
            options={ROLES}
            selected={watchedRoles}
            onChange={vals => setValue('roles', vals)}
          />
        </div>
      </section>

      {saveError && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 font-sans text-sm text-red-400">{saveError}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || usernameStatus === 'taken'}
          className="rounded-xl bg-[var(--color-glyph-orange)] px-6 py-3 font-sans text-sm font-medium text-white transition hover:bg-[#ff5c27] active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-[var(--color-glyph-border)] px-6 py-3 font-sans text-sm text-[var(--color-glyph-text-2)] transition hover:bg-[var(--color-glyph-surface-2)]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
