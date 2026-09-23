'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLES, ENGINES, EXPERIENCE_LEVELS, COLLAB_STATUS } from '@/lib/supabase/types'
import { stripDangerousUnicode } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'
import { FormStatus } from './FormStatus'
import { SettingsSection } from './SettingsSection'

/** Public identity only: everything here appears on /dev/[username]. Sign-in details are under Account and Security. */
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
  const [linkError, setLinkError] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSaved(false); setLinkError({})
    setLoading(true)

    const nn = (v: string) => v.trim() || null
    const s = (v: string) => stripDangerousUnicode(v.trim()) || null

    if (bio.length > 500 || location.length > 100 || displayName.length > 100) {
      setError('One or more fields exceeds the maximum allowed length.')
      setLoading(false)
      return
    }

    const bad: Record<string, string> = {}
    for (const [key, name, v] of [['github', 'GitHub', github], ['itchio', 'itch.io', itchio], ['twitter', 'X', twitter], ['website', 'Website', website]] as const) {
      if (v.trim() && !/^https:\/\/\S+$/.test(v.trim())) bad[key] = `${name} must be a full https:// address.`
    }
    if (Object.keys(bad).length) {
      setLinkError(bad)
      setError('Fix the highlighted links and save again.')
      setLoading(false)
      return
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        display_name: s(displayName),
        bio: s(bio),
        location: s(location),
        primary_role: nn(role),
        primary_engine: nn(engine),
        experience_level: nn(experience),
        collaboration_status: collabStatus,
        github_url: s(github)?.slice(0, 200) ?? null,
        itchio_url: s(itchio)?.slice(0, 200) ?? null,
        twitter_url: s(twitter)?.slice(0, 200) ?? null,
        website_url: s(website)?.slice(0, 200) ?? null,
      })
      .eq('id', profile.id)

    setLoading(false)
    if (dbError) { setError('Your profile could not be saved. Try again.'); return }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <SettingsSection id="pf-identity" title="Identity" className="border-t-0 pt-0">
        <div className="space-y-4">
          <Field label="Display name" hint="Shown instead of your handle. Optional.">
            {(p) => <Input {...p} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={profile.username} maxLength={100} autoComplete="name" />}
          </Field>
          <Field label="Handle" hint="Your handle is fixed and forms your profile address.">
            {(p) => <Input {...p} value={`@${profile.username}`} readOnly />}
          </Field>
          <Field label="Bio" hint={`${bio.length} of 500`}>
            {(p) => <Textarea {...p} rows={4} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What are you building?" />}
          </Field>
          <Field label="Location">
            {(p) => <Input {...p} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Berlin, Germany" maxLength={100} />}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection id="pf-work" title="Work">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary role">
            {(p) => (
              <Select {...p} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Not set</option>
                {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Primary engine">
            {(p) => (
              <Select {...p} value={engine} onChange={(e) => setEngine(e.target.value)}>
                <option value="">Not set</option>
                {ENGINES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Experience">
            {(p) => (
              <Select {...p} value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="">Not set</option>
                {EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Availability" hint="Shown on your profile and used when people look for collaborators.">
            {(p) => (
              <Select {...p} value={collabStatus} onChange={(e) => setCollabStatus(e.target.value)}>
                {COLLAB_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection id="pf-links" title="Links" description="Each link must start with https://.">
        <div className="space-y-4">
          <Field label="GitHub" error={linkError.github}>{(p) => <Input {...p} type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/you" maxLength={200} />}</Field>
          <Field label="itch.io" error={linkError.itchio}>{(p) => <Input {...p} type="url" value={itchio} onChange={(e) => setItchio(e.target.value)} placeholder="https://you.itch.io" maxLength={200} />}</Field>
          <Field label="X" error={linkError.twitter}>{(p) => <Input {...p} type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/you" maxLength={200} />}</Field>
          <Field label="Website" error={linkError.website}>{(p) => <Input {...p} type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" maxLength={200} />}</Field>
        </div>
      </SettingsSection>

      <div>
        <FormStatus error={error} notice={saved ? 'Profile saved.' : undefined} className="mb-3 min-h-5" />
        <Button type="submit" variant="primary" loading={loading}>Save profile</Button>
      </div>
    </form>
  )
}
