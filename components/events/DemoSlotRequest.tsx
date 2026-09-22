'use client'

import { useState, useTransition } from 'react'
import { requestDemoSlot } from '@/app/actions/events'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/controls'
import { StatusText } from '@/components/workflow/StatusLabel'

/**
 * Offer one of your existing projects for a demo at this event. The host decides; the request is about a project
 * that already lives on Glyph, so the event links to its project page rather than holding a copy.
 */
export function DemoSlotRequest({ eventId, projects, existing }: { eventId: string; projects: { id: string; title: string }[]; existing: { accepted: boolean; title: string } | null }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [sent, setSent] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (existing || sent) {
    const title = existing?.title ?? sent
    return <p role="status" className="text-body text-fg-secondary"><StatusText label={existing?.accepted ? 'Demo accepted' : 'Demo requested'} tone={existing?.accepted ? 'positive' : 'attention'} /> <span className="text-fg-muted">· {title}</span></p>
  }
  if (projects.length === 0) return <p className="text-body text-fg-secondary">Create a project first to offer a demo.</p>

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await requestDemoSlot(eventId, projectId)
      if (result && 'error' in result && result.error) setError(result.error)
      else setSent(projects.find((p) => p.id === projectId)?.title ?? 'Your project')
    })
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
      <Field label="Project to demo" className="flex-1">{(p) => <Select {...p} value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.title}</option>)}</Select>}</Field>
      <Button type="submit" variant="secondary" loading={pending}>Request a slot</Button>
      {error && <p role="alert" className="w-full text-small text-danger">{error}</p>}
    </form>
  )
}
