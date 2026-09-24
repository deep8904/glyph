'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, RotateCcw } from 'lucide-react'
import { archiveProject, restoreProject } from '@/app/actions/projects'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/Dialog'

/**
 * Archive/restore — a state transition with its own confirmation, deliberately not a field on
 * ProjectForm (design doc project-state-model.md §14.7): saving the rest of the form should never
 * silently change this. Archiving is non-destructive (nothing is deleted) but has one real side
 * effect worth naming up front: it closes any open playtest or collaboration recruiting.
 */
export function ArchiveProjectForm({ projectId, lifecycle, title }: { projectId: string; lifecycle: 'draft' | 'published' | 'archived'; title: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  if (lifecycle === 'draft') return null // Not offered from draft — see design doc §4.

  if (lifecycle === 'archived') {
    const restore = () => {
      setError('')
      startTransition(async () => {
        const result = await restoreProject(projectId)
        if ('error' in result) { setError(result.error); return }
        router.refresh()
      })
    }
    return (
      <section aria-labelledby="archive-project" className="mt-8 border-t border-line pt-6">
        <h2 id="archive-project" className="flex items-center gap-2 text-h3 font-semibold text-fg">
          <Archive aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" /> Archived
        </h2>
        <p className="mt-1 max-w-prose text-small text-fg-secondary">
          &quot;{title}&quot; is archived — still visible at its own link, but out of Explore, Search, and Current Work.
        </p>
        {error && <p role="alert" className="mt-2 text-small font-medium text-danger">{error}</p>}
        <Button variant="secondary" className="mt-4" onClick={restore} loading={pending}>
          <RotateCcw aria-hidden strokeWidth={1.75} className="size-4" /> Restore this project
        </Button>
      </section>
    )
  }

  const submit = () => {
    setError('')
    startTransition(async () => {
      const result = await archiveProject(projectId)
      if ('error' in result) { setError(result.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="archive-project" className="mt-8 border-t border-line pt-6">
      <h2 id="archive-project" className="flex items-center gap-2 text-h3 font-semibold text-fg">
        <Archive aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" /> Archive project
      </h2>
      <p className="mt-1 max-w-prose text-small text-fg-secondary">
        Nothing is deleted. &quot;{title}&quot; stops appearing in Explore, Search, and your Current Work, and any open
        playtest or collaboration recruiting on it closes. You can restore it any time.
      </p>

      <Dialog open={open} onOpenChange={(o) => { if (pending) return; setOpen(o); if (!o) setError('') }}>
        <DialogTrigger asChild><Button variant="secondary" className="mt-4">Archive this project…</Button></DialogTrigger>
        <DialogContent title="Archive this project?" description={`"${title}" stays viewable at its link, but leaves Explore, Search, and Current Work, and any open recruiting on it closes.`}>
          {error && <p role="alert" className="mb-3 text-small font-medium text-danger">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost" disabled={pending}>Keep it active</Button></DialogClose>
            <Button type="button" variant="secondary" loading={pending} onClick={submit}>Archive project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
