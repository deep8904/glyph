'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { contactDeveloper } from '@/app/actions/publisher'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/controls'

export function ContactDeveloperForm({ developerId, projectId, projectTitle }: { developerId: string; projectId: string | null; projectTitle: string | null }) {
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div role="status" className="border-y border-success-line py-4 text-body text-fg-secondary">
        <p className="font-medium text-success">Message sent{projectTitle ? ` about ${projectTitle}` : ''}.</p>
        <p className="mt-1">The developer was notified. Glyph has no direct messages, so they reply on their own terms; the status shows on your <Link href="/dashboard/publisher" className="font-medium text-link underline-offset-2 hover:underline">publisher dashboard</Link>.</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault(); setError('')
        startTransition(async () => {
          const r = await contactDeveloper(developerId, projectId, message)
          if ('error' in r) setError(r.error); else setSent(true)
        })
      }}
    >
      <Field label="Your message" required hint={`${message.length}/2000`}>
        {(p) => <Textarea {...p} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={7} placeholder={projectTitle ? `Why you are contacting them about ${projectTitle}, and what you would like to discuss.` : 'Why you are reaching out and what you would like to discuss.'} />}
      </Field>
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
      <Button type="submit" variant="primary" loading={pending} disabled={!message.trim()}>Send message</Button>
    </form>
  )
}
