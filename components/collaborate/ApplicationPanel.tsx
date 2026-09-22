'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { applyToCollabPost, withdrawApplication } from '@/app/actions/collaboration'
import { APPLICATION_STATUS, StatusLabel } from '@/components/workflow/StatusLabel'
import { StatusSteps, type Step } from '@/components/workflow/StatusSteps'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/controls'
import { relativeTime } from '@/lib/utils'

type Application = { id: string; status: string; message: string; created_at: string } | null

/**
 * The applicant's whole relationship with one post: exactly one state at a time, where it stands as a plain
 * ordered list (what happened, what is happening, what is next), and only the actions that state allows.
 * The poster sees a different page (management + applicants) at the same URL; nothing here is shared with it.
 */
export function ApplicationPanel({
  postId,
  signedIn,
  acceptingApplications,
  roleTitle,
  projectTitle,
  authorName,
  authorUsername,
  reachingOut = false,
  application,
}: {
  postId: string
  signedIn: boolean
  acceptingApplications: boolean
  roleTitle: string
  projectTitle: string | null
  authorName: string
  authorUsername: string
  /** true for "offering help" posts, where the visitor contacts the poster rather than applying for a role */
  reachingOut?: boolean
  application: Application
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await applyToCollabPost(postId, message)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  const withdraw = () => {
    if (!application) return
    setError('')
    startTransition(async () => {
      const result = await withdrawApplication(application.id)
      if (result?.error) { setError(result.error); setConfirmWithdraw(false) }
      else { setConfirmWithdraw(false); router.refresh() }
    })
  }

  const what = reachingOut ? 'message' : 'application'

  // ── existing application ───────────────────────────────────────────────────
  if (application) {
    const st = APPLICATION_STATUS[application.status] ?? { label: application.status, tone: 'neutral' as const }
    const sent: Step = { label: reachingOut ? 'Message sent' : 'Application sent', state: 'done', note: relativeTime(application.created_at) }
    const steps: Step[] =
      application.status === 'pending' && acceptingApplications
        ? [sent, { label: `${authorName} is reviewing`, state: 'current', note: 'You will be notified when they decide.' }, { label: 'Decision', state: 'todo' }]
        : application.status === 'pending'
        ? [sent, { label: 'Post closed before a decision', state: 'ended', note: `${authorName} closed the post while this was still waiting.` }]
        : application.status === 'accepted'
        ? [sent, { label: 'Reviewed', state: 'done' }, { label: 'Accepted', state: 'done', note: `${authorName} accepted. Follow up through their profile to agree how you will work together.` }]
        : application.status === 'rejected'
        ? [sent, { label: 'Reviewed', state: 'done' }, { label: 'Not selected', state: 'ended', note: `${authorName} did not select this ${what}.` }]
        : [sent, { label: 'Withdrawn', state: 'ended', note: 'You withdrew. It is closed and cannot be reviewed or resent.' }]

    return (
      <section aria-labelledby="your-application" className="border-t border-line pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="your-application" className="text-h3 font-semibold text-fg">Your {what}</h2>
          <StatusLabel label={st.label} tone={st.tone} />
        </div>
        <div role="status" className="mt-4"><StatusSteps label={`Status of your ${what}`} steps={steps} /></div>

        <div className="mt-6">
          <h3 className="text-small font-medium text-fg-muted">Your message</h3>
          <p className="mt-1 max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{application.message}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {application.status === 'accepted' && (
            <Button asChild variant="primary"><Link href={`/dev/${authorUsername}`}>Go to {authorName}&apos;s profile</Link></Button>
          )}
          {application.status === 'pending' && acceptingApplications && (
            <Button variant="secondary" onClick={() => setConfirmWithdraw(true)}>Withdraw {what}</Button>
          )}
        </div>
        {error && <p role="alert" className="mt-3 text-small text-danger">{error}</p>}

        <Dialog open={confirmWithdraw} onOpenChange={setConfirmWithdraw}>
          <DialogContent title={`Withdraw this ${what}?`} description="You cannot reapply to this post afterwards.">
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Keep it</Button></DialogClose>
              <Button variant="danger" onClick={withdraw} loading={pending}>Withdraw</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    )
  }

  // ── no application yet ─────────────────────────────────────────────────────
  if (!acceptingApplications) {
    return (
      <section aria-labelledby="apply-heading" className="border-t border-line pt-6">
        <h2 id="apply-heading" className="text-h3 font-semibold text-fg">Applications</h2>
        <p className="mt-1 text-body text-fg-secondary">This post is no longer accepting applications.</p>
      </section>
    )
  }

  if (!signedIn) {
    return (
      <section aria-labelledby="apply-heading" className="border-t border-line pt-6">
        <h2 id="apply-heading" className="text-h3 font-semibold text-fg">{reachingOut ? 'Reach out' : 'Apply'}</h2>
        <p className="mt-1 text-body text-fg-secondary">Sign in to send {authorName} a message about this {reachingOut ? 'offer' : 'role'}.</p>
        <Button asChild variant="primary" className="mt-3"><Link href="/login">Sign in to {reachingOut ? 'reach out' : 'apply'}</Link></Button>
      </section>
    )
  }

  return (
    <section aria-labelledby="apply-heading" className="border-t border-line pt-6">
      <h2 id="apply-heading" className="text-h3 font-semibold text-fg">{reachingOut ? 'Reach out' : 'Apply'}</h2>
      <p className="mt-1 max-w-prose text-body text-fg-secondary">
        {reachingOut ? 'You are reaching out to ' : 'You are applying for '}
        <span className="font-medium text-fg">{reachingOut ? authorName : roleTitle}</span>
        {!reachingOut && projectTitle && <> on <span className="font-medium text-fg">{projectTitle}</span></>}
        {reachingOut && <> about <span className="font-medium text-fg">{roleTitle}</span></>}.{' '}
        {authorName} {reachingOut ? 'reads your message and can accept it' : 'reviews applications'}, and you will be notified of the decision. You can withdraw while it is waiting.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Your message" hint={`${message.length}/2000`} required>
          {(p) => (
            <Textarea {...p} rows={5} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Who you are, relevant work, and why this fits." required />
          )}
        </Field>
        {error && <p role="alert" className="text-small text-danger">{error}</p>}
        <Button type="submit" variant="primary" loading={pending} disabled={!message.trim()}>{reachingOut ? 'Send message' : 'Send application'}</Button>
      </form>
    </section>
  )
}
