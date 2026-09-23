'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitJamEntry } from '@/app/actions/jams'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'

export function JamSubmitForm({ jamId, jamSlug, projects }: { jamId: string; jamSlug: string; projects: { id: string; title: string }[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionNotes, setSubmissionNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitJamEntry({ jam_id: jamId, project_id: projectId, submission_url: submissionUrl, submission_notes: submissionNotes })
      if (result?.error) setError(result.error)
      else router.push(`/jams/${jamSlug}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Project" required hint="The project you are entering.">
        {(p) => <Select {...p} value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.title}</option>)}</Select>}
      </Field>
      <Field label="Play or download link" hint="Optional. A full https:// link to the jam build.">
        {(p) => <Input {...p} type="url" value={submissionUrl} onChange={(e) => setSubmissionUrl(e.target.value)} placeholder="https://itch.io/your-game" maxLength={500} />}
      </Field>
      <Field label="Notes for voters" hint={`Optional. How to play, known issues, credits. ${submissionNotes.length}/2000`}>
        {(p) => <Textarea {...p} rows={4} maxLength={2000} value={submissionNotes} onChange={(e) => setSubmissionNotes(e.target.value)} />}
      </Field>
      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-small text-danger">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.push(`/jams/${jamSlug}`)}>Cancel</Button>
        <Button type="submit" variant="primary" loading={pending}>Submit entry</Button>
      </div>
    </form>
  )
}
