'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeCollabPost } from '@/app/actions/collaboration'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'

/** Ends applications. "Filled" means you found someone; "Close" means you stopped looking. Applicants still waiting are notified. */
export function ClosePostButton({ postId, pendingCount }: { postId: string; pendingCount: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [choice, setChoice] = useState<'filled' | 'closed' | null>(null)

  const confirm = () => {
    if (!choice) return
    setError('')
    startTransition(async () => {
      const result = await closeCollabPost(postId, choice)
      if (result?.error) { setError(result.error); setChoice(null) }
      else { setChoice(null); router.refresh() }
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setChoice('filled')}>Mark as filled</Button>
        <Button variant="secondary" onClick={() => setChoice('closed')}>Close post</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
      <Dialog open={choice !== null} onOpenChange={(o) => !o && setChoice(null)}>
        <DialogContent
          title={choice === 'filled' ? 'Mark this post as filled?' : 'Close this post?'}
          description={`It will stop accepting applications${pendingCount > 0 ? ` and ${pendingCount} waiting ${pendingCount === 1 ? 'applicant' : 'applicants'} will be told.` : '.'}`}
        >
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button variant="primary" onClick={confirm} loading={pending}>{choice === 'filled' ? 'Mark as filled' : 'Close post'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
