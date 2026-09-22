'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { requestPlaytestSession, resignupPlaytestSession, withdrawPlaytestSession } from '@/app/actions/playtests'
import { SESSION_STATUS, StatusLabel } from '@/components/workflow/StatusLabel'
import { StatusSteps, type Step } from '@/components/workflow/StatusSteps'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { isHttpsUrl } from '@/lib/utils'

type Session = { id: string; status: string } | null
type Build = { build_url: string; build_type: string } | null

/**
 * The tester's journey through one playtest: request → the developer decides → get the build → play → send
 * feedback. One state at a time, with the steps written out so it is always clear where you are and what happens
 * next. The build link appears only for accepted/completed testers (the server returns it to nobody else); the
 * developer's management screen is never involved.
 */
export function TesterPanel({
  requestId,
  signedIn,
  requestStatus,
  authorName,
  session,
  build,
}: {
  requestId: string
  signedIn: boolean
  requestStatus: 'open' | 'full' | 'closed'
  authorName: string
  session: Session
  build: Build
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)

  const run = (fn: () => Promise<{ error?: string } | undefined | { ok: true }>) => {
    setError('')
    startTransition(async () => {
      const result = await fn()
      if (result && 'error' in result && result.error) { setError(result.error); setConfirmWithdraw(false) }
      else { setConfirmWithdraw(false); router.refresh() }
    })
  }

  const journey = (state: 'none' | 'requested' | 'accepted' | 'completed' | 'skipped' | 'withdrawn'): Step[] => {
    const req: Step = { label: 'Request a place', state: state === 'none' ? 'current' : 'done' }
    const decide = (s: Step['state'], note?: string): Step => ({ label: 'The developer decides', state: s, note })
    switch (state) {
      case 'none':
        return [req, decide('todo', `${authorName} reviews requests and accepts testers.`), { label: 'Get the build', state: 'todo' }, { label: 'Play', state: 'todo' }, { label: 'Send feedback', state: 'todo' }]
      case 'requested':
        return [req, decide('current', `${authorName} has not decided yet. You will be notified. Nothing else is needed from you.`), { label: 'Get the build', state: 'todo' }, { label: 'Play', state: 'todo' }, { label: 'Send feedback', state: 'todo' }]
      case 'accepted':
        return [req, decide('done', 'You are in.'), { label: 'Get the build', state: 'current', note: 'The link is below.' }, { label: 'Play', state: 'todo' }, { label: 'Send feedback', state: 'todo', note: 'Ratings and notes go to the developer.' }]
      case 'completed':
        return [req, decide('done'), { label: 'Get the build', state: 'done' }, { label: 'Play', state: 'done' }, { label: 'Send feedback', state: 'done', note: 'Sent to the developer. Thank you for testing.' }]
      case 'skipped':
        return [req, decide('ended', `${authorName} is not proceeding with your request. This is final for this playtest.`)]
      case 'withdrawn':
        return [req, decide('ended', 'You withdrew from this playtest.')]
    }
  }

  // ── not signed up ──────────────────────────────────────────────────────────
  if (!session) {
    if (requestStatus === 'closed') {
      return <Box title="Requests are closed"><p>{authorName} has stopped taking requests for this playtest.</p></Box>
    }
    if (requestStatus === 'full') {
      return <Box title="This playtest is full"><p>All tester places are taken, so new requests are not being accepted right now.</p></Box>
    }
    if (!signedIn) {
      return (
        <Box title="Test this game" steps={journey('none')}>
          <Button asChild variant="primary" className="mt-4"><Link href="/login">Sign in to request a place</Link></Button>
        </Box>
      )
    }
    return (
      <Box title="Test this game" steps={journey('none')}>
        <Button variant="primary" className="mt-4" onClick={() => run(() => requestPlaytestSession(requestId))} loading={pending}>Request a place</Button>
        {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
      </Box>
    )
  }

  // ── signed up ──────────────────────────────────────────────────────────────
  const status = session.status as 'requested' | 'accepted' | 'completed' | 'skipped' | 'withdrawn'
  const st = SESSION_STATUS[session.status] ?? { label: session.status, tone: 'neutral' as const }
  const canWithdraw = status === 'requested' || status === 'accepted'

  return (
    <section aria-labelledby="tester-heading" className="border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="tester-heading" className="text-h3 font-semibold text-fg">Your playtest</h2>
        <StatusLabel label={st.label} tone={st.tone} />
      </div>
      <div role="status" className="mt-4"><StatusSteps label="Your progress in this playtest" steps={journey(status)} /></div>

      {(status === 'accepted' || status === 'completed') && (
        <div className="mt-6 border-t border-line-subtle pt-5">
          <h3 className="text-body font-semibold text-fg">Access the build</h3>
          {!build ? (
            <p className="mt-1 text-body text-fg-secondary">The build link is not available right now. Try reloading, or contact {authorName}.</p>
          ) : build.build_type === 'steam_key' ? (
            <>
              <p className="mt-1 text-body text-fg-secondary">Redeem this key in Steam:</p>
              <p className="mt-2 select-all break-all rounded-control border border-line-strong bg-surface px-3 py-2 font-mono text-small text-fg">{build.build_url}</p>
            </>
          ) : isHttpsUrl(build.build_url) ? (
            <Button asChild variant="primary" className="mt-3">
              <a href={build.build_url} target="_blank" rel="noopener noreferrer">
                {build.build_type === 'browser' ? 'Open the build in your browser' : 'Download the build'}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          ) : (
            <p className="mt-2 break-all font-mono text-small text-fg">{build.build_url}</p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {status === 'accepted' && <Button asChild variant={build ? 'secondary' : 'primary'}><Link href={`/playtests/${requestId}/test/${session.id}`}>Send feedback</Link></Button>}
        {status === 'withdrawn' && requestStatus === 'open' && (
          <Button variant="primary" onClick={() => run(() => resignupPlaytestSession(session.id))} loading={pending}>Request a place again</Button>
        )}
        {canWithdraw && <Button variant="secondary" onClick={() => setConfirmWithdraw(true)}>Withdraw</Button>}
      </div>
      {error && <p role="alert" className="mt-3 text-small text-danger">{error}</p>}

      <Dialog open={confirmWithdraw} onOpenChange={setConfirmWithdraw}>
        <DialogContent title="Withdraw from this playtest?" description="Your place is released. You can request again while the playtest is open.">
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Stay in</Button></DialogClose>
            <Button variant="danger" onClick={() => run(() => withdrawPlaytestSession(session.id))} loading={pending}>Withdraw</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function Box({ title, steps, children }: { title: string; steps?: Step[]; children: React.ReactNode }) {
  return (
    <section aria-labelledby="tester-heading" className="border-t border-line pt-6">
      <h2 id="tester-heading" className="text-h3 font-semibold text-fg">{title}</h2>
      {steps ? <div className="mt-4"><StatusSteps label="How testing works" steps={steps} /></div> : null}
      <div className="text-body text-fg-secondary">{children}</div>
    </section>
  )
}
