'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCollabPost } from '@/app/actions/collaboration'
import { ROLES, CONTRACT_TYPES } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'

export function NewCollabForm({ projects }: { projects: { id: string; title: string }[] }) {
  const router = useRouter()
  const uid = useId()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [postType, setPostType] = useState<'seeking_collaborator' | 'available_to_collaborate'>('seeking_collaborator')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [roleNeeded, setRoleNeeded] = useState('')
  const [roleOffered, setRoleOffered] = useState('')
  const [contractType, setContractType] = useState<typeof CONTRACT_TYPES[number]['value']>('rev_share')
  const [compensationRange, setCompensationRange] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [remoteAllowed, setRemoteAllowed] = useState(true)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const isSeeking = postType === 'seeking_collaborator'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createCollabPost({
        project_id: projectId,
        post_type: postType,
        role_needed: roleNeeded,
        role_offered: roleOffered,
        contract_type: contractType,
        compensation_range: compensationRange,
        time_commitment: timeCommitment,
        remote_allowed: remoteAllowed,
        location,
        description,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-small font-medium text-fg">What kind of post is this?</legend>
        <div className="space-y-2">
          {([
            ['seeking_collaborator', 'Looking for help', 'You have a project and need someone for a role.'],
            ['available_to_collaborate', 'Offering help', 'You are available to work on someone else’s project.'],
          ] as const).map(([value, label, hint]) => (
            <label key={value} htmlFor={`${uid}-${value}`} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-media border border-line-strong px-3 py-2.5 has-[:checked]:border-accent has-[:checked]:bg-accent-subtle">
              <input id={`${uid}-${value}`} type="radio" name="post_type" value={value} checked={postType === value} onChange={() => setPostType(value)} className="mt-0.5 size-5 accent-[var(--accent)]" />
              <span>
                <span className="block text-body font-medium text-fg">{label}</span>
                <span className="block text-small text-fg-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {isSeeking ? (
        projects.length === 0 ? (
          <p role="alert" className="text-small text-danger">
            A “Looking for help” post has to be about a project. <Link href="/dashboard/projects/new" className="font-medium underline">Create one first.</Link>
          </p>
        ) : (
          <Field label="Project" required hint="The project this role is for.">
            {(p) => (
              <Select {...p} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Select a project…</option>
                {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.title}</option>)}
              </Select>
            )}
          </Field>
        )
      ) : (
        projects.length > 0 && (
          <Field label="Related project" hint="Optional.">
            {(p) => (
              <Select {...p} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.title}</option>)}
              </Select>
            )}
          </Field>
        )
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {isSeeking ? (
          <Field label="Role needed" required>
            {(p) => (
              <Select {...p} value={roleNeeded} onChange={(e) => setRoleNeeded(e.target.value)}>
                <option value="">Select a role…</option>
                {ROLES.map((r) => <option key={r.value} value={r.label}>{r.label}</option>)}
              </Select>
            )}
          </Field>
        ) : (
          <Field label="Role you offer">
            {(p) => (
              <Select {...p} value={roleOffered} onChange={(e) => setRoleOffered(e.target.value)}>
                <option value="">Select a role…</option>
                {ROLES.map((r) => <option key={r.value} value={r.label}>{r.label}</option>)}
              </Select>
            )}
          </Field>
        )}
        <Field label="Arrangement" required>
          {(p) => (
            <Select {...p} value={contractType} onChange={(e) => setContractType(e.target.value as typeof contractType)}>
              {CONTRACT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Compensation" hint="Optional, e.g. 10–20% rev share.">
          {(p) => <Input {...p} value={compensationRange} onChange={(e) => setCompensationRange(e.target.value)} maxLength={200} />}
        </Field>
        <Field label="Time commitment" hint="Optional, e.g. 10h/week.">
          {(p) => <Input {...p} value={timeCommitment} onChange={(e) => setTimeCommitment(e.target.value)} maxLength={200} />}
        </Field>
      </div>

      <label htmlFor={`${uid}-remote`} className="flex min-h-11 cursor-pointer items-center gap-3">
        <input id={`${uid}-remote`} type="checkbox" checked={remoteAllowed} onChange={(e) => setRemoteAllowed(e.target.checked)} className="size-5 accent-[var(--accent)]" />
        <span className="text-body text-fg">Remote is fine</span>
      </label>

      {!remoteAllowed && (
        <Field label="Location">
          {(p) => <Input {...p} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" maxLength={100} />}
        </Field>
      )}

      <Field label="Description" required hint={`${description.length}/5000`}>
        {(p) => (
          <Textarea {...p} rows={6} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} required placeholder={isSeeking ? 'What the project is, what the role involves, and what you are looking for in a person.' : 'Your skills, what you want to work on, and what you bring to a project.'} />
        )}
      </Field>
      <p className="text-small text-fg-muted">Posts stay open for 60 days. You review applications, and can mark the post filled or close it at any time.</p>

      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-small text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.push('/collaborate')}>Cancel</Button>
        <Button type="submit" variant="primary" loading={pending}>Post opportunity</Button>
      </div>
    </form>
  )
}
