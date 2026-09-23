'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStudio } from '@/app/actions/studios'
import { STUDIO_SIZES } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'

export function NewStudioForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createStudio(formData)
      if ('error' in result) setError(result.error)
      else if (result.success && result.slug) router.push(`/dashboard/studios/${result.slug}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Studio name" required>{(p) => <Input {...p} name="name" maxLength={200} placeholder="Midnight Pixel Games" />}</Field>
      <Field label="About" hint="What does your studio make?">{(p) => <Textarea {...p} name="description" maxLength={5000} rows={4} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team size">{(p) => <Select {...p} name="size">{STUDIO_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>}</Field>
        <Field label="Founded" hint="Year, optional.">{(p) => <Input {...p} name="founded_year" type="number" min={1970} max={2100} placeholder={String(new Date().getFullYear())} />}</Field>
      </div>
      <Field label="Location">{(p) => <Input {...p} name="location" maxLength={100} placeholder="Montreal, QC" />}</Field>
      <Field label="Website">{(p) => <Input {...p} name="website" type="url" maxLength={500} placeholder="https://yourstudio.com" />}</Field>
      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-small text-danger">{error}</p>}
      <Button type="submit" variant="primary" className="w-full" loading={isPending}>Create studio</Button>
    </form>
  )
}
