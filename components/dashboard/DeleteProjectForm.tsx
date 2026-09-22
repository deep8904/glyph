'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { deleteProject } from '@/app/actions/projects'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/controls'

/** Action → explanation → confirmation → resulting state, same pattern as account deletion. */
export function DeleteProjectForm({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const isMatch = confirm === title

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMatch) return
    setError('')
    startTransition(async () => {
      const result = await deleteProject(projectId, confirm)
      if ('error' in result) { setError(result.error); return }
      router.push('/dashboard/projects')
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="del-project" className="mt-12 border-t border-line pt-6">
      <h2 id="del-project" className="flex items-center gap-2 text-h3 font-semibold text-fg">
        <AlertTriangle aria-hidden strokeWidth={1.75} className="size-4 text-danger" /> Delete project
      </h2>
      <p className="mt-1 max-w-prose text-small text-fg-secondary">This permanently deletes &quot;{title}&quot; along with its devlogs, playtest requests, and demo slots. This cannot be undone.</p>

      <Dialog open={open} onOpenChange={(o) => { if (pending) return; setOpen(o); if (!o) { setConfirm(''); setError('') } }}>
        <DialogTrigger asChild><Button variant="danger" className="mt-4">Delete this project…</Button></DialogTrigger>
        <DialogContent title="Delete this project?" description={`This permanently deletes "${title}" and everything on it. It cannot be undone.`}>
          <form onSubmit={submit} className="space-y-4">
            <Field label={`Type ${title} to confirm`} required>
              {(p) => <Input {...p} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={title} autoComplete="off" spellCheck={false} />}
            </Field>
            {error && <p role="alert" className="text-small font-medium text-danger">{error}</p>}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost" disabled={pending}>Keep this project</Button></DialogClose>
              <Button type="submit" variant="danger" loading={pending} disabled={!isMatch}>Permanently delete this project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
