'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPublisherAccount, updatePublisherProfile } from '@/app/actions/publisher'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/controls'

/** Register (no `existing`) or edit a publisher profile. Verification is never set here. */
export function PublisherRegisterForm({ existing }: { existing?: { company_name: string; description: string | null; website: string | null } }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        setError(''); setSaved(false)
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          const result = existing ? await updatePublisherProfile(fd) : await createPublisherAccount(fd)
          if ('error' in result) setError(result.error)
          else if (existing) { setSaved(true); router.refresh() }
          else router.push('/dashboard/publisher')
        })
      }}
    >
      <Field label="Company name" required>{(p) => <Input {...p} name="company_name" maxLength={200} defaultValue={existing?.company_name ?? ''} />}</Field>
      <Field label="About your company" hint="What you publish and what you look for in a game. Shown on your public page once verified.">{(p) => <Textarea {...p} name="description" rows={4} maxLength={2000} defaultValue={existing?.description ?? ''} />}</Field>
      <Field label="Website">{(p) => <Input {...p} name="website" type="url" maxLength={500} defaultValue={existing?.website ?? ''} placeholder="https://" />}</Field>
      {!existing && <p className="text-small text-fg-secondary">New accounts are reviewed by Glyph. You can save projects to a shortlist straight away; contacting developers unlocks once your account is verified.</p>}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
      {saved && <p role="status" className="text-small text-success">Publisher profile saved.</p>}
      <Button type="submit" variant="primary" loading={pending}>{existing ? 'Save profile' : 'Register as a publisher'}</Button>
    </form>
  )
}
