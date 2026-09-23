'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPlaytestRequest } from '@/app/actions/playtests'
import { BUILD_TYPES } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'

const PLATFORMS = ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Web']
const FOCUS_AREA_OPTIONS = ['Controls', 'Difficulty', 'Tutorial', 'UI/UX', 'Performance', 'Story', 'Fun Factor', 'Level Design', 'Audio']

/**
 * The developer's setup for a playtest, in the order they think about it: what game and build, how many people,
 * what to test. Testers never see the build link until you accept them (the server only returns it to you and
 * to accepted testers).
 */
export function NewPlaytestForm({ projects }: { projects: { id: string; title: string }[] }) {
  const router = useRouter()
  const uid = useId()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [buildUrl, setBuildUrl] = useState('')
  const [buildType, setBuildType] = useState<'browser' | 'download' | 'steam_key'>('browser')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [requestedTesters, setRequestedTesters] = useState(5)

  const toggleOption = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createPlaytestRequest({ project_id: projectId, build_url: buildUrl, build_type: buildType, platforms, description, focus_areas: focusAreas, requested_testers: requestedTesters })
      if (result?.error) setError(result.error)
    })
  }

  const checkGroup = (legend: string, hint: string, options: string[], selected: string[], set: (v: string[]) => void, name: string) => (
    <fieldset>
      <legend className="text-small font-medium text-fg">{legend}</legend>
      <p className="text-micro text-fg-muted">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {options.map((o) => (
          <label key={o} htmlFor={`${uid}-${name}-${o}`} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body text-fg">
            <input id={`${uid}-${name}-${o}`} type="checkbox" checked={selected.includes(o)} onChange={() => toggleOption(selected, set, o)} className="size-5 accent-[var(--accent)]" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section aria-labelledby="pt-build" className="space-y-4">
        <h2 id="pt-build" className="text-h3 font-semibold text-fg">The build</h2>
        <Field label="Project" required>
          {(p) => (
            <Select {...p} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.title}</option>)}
            </Select>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="How testers get it" required>
            {(p) => (
              <Select {...p} value={buildType} onChange={(e) => setBuildType(e.target.value as 'browser' | 'download' | 'steam_key')}>
                {BUILD_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Testers you want" required hint="1 to 50. You accept each one.">
            {(p) => <Input {...p} type="number" min={1} max={50} value={requestedTesters} onChange={(e) => setRequestedTesters(parseInt(e.target.value) || 5)} />}
          </Field>
        </div>
        <Field label={buildType === 'steam_key' ? 'Steam key' : 'Build link'} required hint="Only you and the testers you accept can see this. It is never shown on the public playtest page.">
          {(p) => (
            <Input {...p} type={buildType === 'steam_key' ? 'text' : 'url'} value={buildUrl} onChange={(e) => setBuildUrl(e.target.value)} placeholder={buildType === 'steam_key' ? 'XXXXX-XXXXX-XXXXX' : 'https://itch.io/game or a direct link'} maxLength={500} />
          )}
        </Field>
        {checkGroup('Platforms', 'Where testers can run it.', PLATFORMS, platforms, setPlatforms, 'plat')}
      </section>

      <section aria-labelledby="pt-test" className="space-y-4 border-t border-line pt-6">
        <h2 id="pt-test" className="text-h3 font-semibold text-fg">What to test</h2>
        {checkGroup('Focus areas', 'Optional. Testers will see what you care about most.', FOCUS_AREA_OPTIONS, focusAreas, setFocusAreas, 'focus')}
        <Field label="What testers should know" required hint={`${description.length}/5000`}>
          {(p) => (
            <Textarea {...p} rows={6} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="The current state of the game, what is missing, and what feedback would help most." />
          )}
        </Field>
      </section>

      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-small text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.push('/dashboard/playtests')}>Cancel</Button>
        <Button type="submit" variant="primary" loading={pending}>Open requests</Button>
      </div>
    </form>
  )
}
