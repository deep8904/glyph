'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGameJam } from '@/app/actions/jams'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/controls'

export function NewJamForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [votingStartAt, setVotingStartAt] = useState('')
  const [votingEndAt, setVotingEndAt] = useState('')
  const [rules, setRules] = useState('')
  const [maxTeamSize, setMaxTeamSize] = useState(4)
  const [allowExistingAssets, setAllowExistingAssets] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createGameJam({
        title, description, theme, start_at: startAt, end_at: endAt,
        voting_start_at: votingStartAt, voting_end_at: votingEndAt,
        rules, max_team_size: maxTeamSize, allow_existing_assets: allowExistingAssets,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section aria-labelledby="jam-what" className="space-y-4">
        <h2 id="jam-what" className="text-h3 font-semibold text-fg">What it is</h2>
        <Field label="Title" required>{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Glyph Jam #1" maxLength={200} />}</Field>
        <Field label="Description" required hint={`${description.length}/10000`}>{(p) => <Textarea {...p} rows={5} maxLength={10000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this jam about? Who is it for?" />}</Field>
        <Field label="Theme" hint="Optional.">{(p) => <Input {...p} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Duality" maxLength={200} />}</Field>
      </section>

      <section aria-labelledby="jam-when" className="space-y-4 border-t border-line pt-6">
        <h2 id="jam-when" className="text-h3 font-semibold text-fg">When</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jam starts" required>{(p) => <Input {...p} type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />}</Field>
          <Field label="Jam ends" required>{(p) => <Input {...p} type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />}</Field>
          <Field label="Voting opens" required>{(p) => <Input {...p} type="datetime-local" value={votingStartAt} onChange={(e) => setVotingStartAt(e.target.value)} />}</Field>
          <Field label="Voting closes" required>{(p) => <Input {...p} type="datetime-local" value={votingEndAt} onChange={(e) => setVotingEndAt(e.target.value)} />}</Field>
        </div>
      </section>

      <section aria-labelledby="jam-rules" className="space-y-4 border-t border-line pt-6">
        <h2 id="jam-rules" className="text-h3 font-semibold text-fg">Rules</h2>
        <Field label="Rules" hint="Optional. Markdown.">{(p) => <Textarea {...p} rows={6} maxLength={20000} value={rules} onChange={(e) => setRules(e.target.value)} placeholder={'# Rules\n\n- Must be made during the jam'} className="font-mono text-small" />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Max team size">{(p) => <Input {...p} type="number" min={1} max={20} value={maxTeamSize} onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 4)} />}</Field>
          <label htmlFor="jam-assets" className="flex min-h-11 cursor-pointer items-center gap-3 sm:pt-6">
            <input id="jam-assets" type="checkbox" checked={allowExistingAssets} onChange={(e) => setAllowExistingAssets(e.target.checked)} className="size-5 accent-[var(--accent)]" />
            <span className="text-body text-fg">Allow pre-made assets</span>
          </label>
        </div>
      </section>

      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-small text-danger">{error}</p>}
      <p className="rounded-media border border-warning-line bg-warning-subtle px-4 py-3 text-small text-warning"><strong className="font-medium">Reviewed before it goes live.</strong> The Glyph team approves jams before they appear publicly. Only you can see it until then.</p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.push('/jams')}>Cancel</Button>
        <Button type="submit" variant="primary" loading={pending}>Submit for review</Button>
      </div>
    </form>
  )
}
