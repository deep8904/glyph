'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { deleteMyAccount, type DeletionSummary } from '@/app/actions/account'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/controls'
import { FormStatus } from './FormStatus'
import { SettingsSection } from './SettingsSection'

function n(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export function deletionList(summary: DeletionSummary): string[] {
  return [
    summary.projects > 0 && n(summary.projects, 'project'),
    summary.devlogs > 0 && n(summary.devlogs, 'devlog'),
    summary.comments > 0 && n(summary.comments, 'comment'),
    summary.reactions > 0 && n(summary.reactions, 'reaction'),
    summary.collab_posts > 0 && n(summary.collab_posts, 'collaboration post'),
    summary.applications > 0 && n(summary.applications, 'collaboration application'),
    summary.playtest_requests > 0 && n(summary.playtest_requests, 'playtest request'),
    summary.playtest_sessions > 0 && n(summary.playtest_sessions, 'playtest sign-up'),
    summary.publisher_account && 'your publisher account',
    summary.shortlists > 0 && n(summary.shortlists, 'shortlist'),
    summary.contacts_sent > 0 && n(summary.contacts_sent, 'sent publisher message'),
    summary.contacts_received > 0 && n(summary.contacts_received, 'received publisher message'),
    summary.followers + summary.following > 0 && `${n(summary.followers, 'follower')} and ${n(summary.following, 'followed developer')}`,
    summary.notifications > 0 && n(summary.notifications, 'notification'),
    summary.blocks + summary.mutes > 0 && `${n(summary.blocks, 'block')} and ${n(summary.mutes, 'mute')}`,
  ].filter((x): x is string => !!x)
}

/**
 * Action → explanation → confirmation → resulting state.
 * The page explains what will be deleted, from the person's own counts, and blocks while they are the
 * only owner of a studio that still has other members. The button opens a Dialog that asks for the
 * named phrase (and the password when the account has one). On success the session is already gone,
 * so the Dialog shows the result instead of navigating into a page that would bounce to sign-in.
 */
export function DeleteAccountFlow({ username, hasPassword, summary }: { username: string; hasPassword: boolean; summary: DeletionSummary }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const expected = `delete @${username}`
  const blocked = summary.blockers.length > 0
  const removed = deletionList(summary)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const r = await deleteMyAccount({ phrase, password: hasPassword ? password : undefined })
      if ('error' in r) setError(r.error)
      else setDone(true)
    })
  }

  return (
    <div className="space-y-8">
      <SettingsSection id="del-what" title="What deleting your account does" className="border-t-0 pt-0">
        <p className="max-w-prose text-body text-fg-secondary">
          Deletion is <strong className="font-semibold text-fg">permanent and immediate</strong>. There is no grace period and Glyph cannot restore anything afterwards. Your login is removed, so you cannot sign back in, and @{username} becomes available to others.
        </p>
        <h3 className="mt-5 text-small font-semibold text-fg">Permanently deleted, from your data today</h3>
        {removed.length > 0 ? (
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-body text-fg-secondary">
            {removed.map((r) => <li key={r}>{r}</li>)}
            <li>your profile and login</li>
          </ul>
        ) : (
          <p className="mt-1 text-body text-fg-secondary">Your profile and login. You have not created other content.</p>
        )}
        <h3 className="mt-5 text-small font-semibold text-fg">What that also takes with it</h3>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-body text-fg-secondary">
          <li>Other people&apos;s comments and reactions on your devlogs disappear with those devlogs.</li>
          <li>Testers&apos; sign-ups and feedback on your playtests are deleted with the playtests.</li>
          <li>Notifications you caused for other people stay, but no longer name you.</li>
        </ul>
        {summary.studios_left > 0 && (
          <>
            <h3 className="mt-5 text-small font-semibold text-fg">Studios</h3>
            <p className="mt-1 max-w-prose text-body text-fg-secondary">
              You will leave {n(summary.studios_left, 'studio')}.
              {summary.studios_closed > 0 && ` ${n(summary.studios_closed, 'studio')} would have no members left and will be closed.`} Studios that keep other members stay, with their remaining owners.
            </p>
          </>
        )}
      </SettingsSection>

      {blocked && (
        <section aria-labelledby="del-block" className="border-l-2 border-warning-line bg-warning-subtle px-4 py-3">
          <h2 id="del-block" className="flex items-center gap-2 text-small font-semibold text-fg"><AlertTriangle aria-hidden strokeWidth={1.75} className="size-4 text-warning" />Resolve studio ownership first</h2>
          <p className="mt-1 max-w-prose text-small text-fg-secondary">You are the only owner of {summary.blockers.length === 1 ? 'a studio' : 'studios'} that still {summary.blockers.length === 1 ? 'has' : 'have'} other members. Deleting now would leave {summary.blockers.length === 1 ? 'it' : 'them'} with no owner, so it is blocked.</p>
          <ul className="mt-2 space-y-1">
            {summary.blockers.map((b) => (
              <li key={b.slug} className="text-small text-fg">
                <span className="font-medium">{b.name}</span> — {n(b.others, 'other member')}.{' '}
                <Link href={`/dashboard/studios/${b.slug}`} className="inline-flex min-h-11 items-center text-link underline-offset-2 hover:underline sm:min-h-0">Make another member an owner, or remove members</Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-small text-fg-secondary">Then come back. Deletion unlocks as soon as nothing is blocking you.</p>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Dialog open={open} onOpenChange={(o) => { if (pending) return; setOpen(o); if (!o && !done) { setPhrase(''); setPassword(''); setError('') } }}>
          <DialogTrigger asChild><Button variant="danger" disabled={blocked}>Delete my account…</Button></DialogTrigger>
          <DialogContent title={done ? 'Account deleted' : 'Delete your account?'} description={done ? undefined : `This permanently deletes @${username} and everything listed on the page. It cannot be undone.`} onInteractOutside={(e) => { if (pending || done) e.preventDefault() }}>
            {done ? (
              <div>
                <p className="text-body text-fg-secondary">@{username} and its data were deleted and you were signed out. You can create a new account at any time.</p>
                <DialogFooter><Button variant="primary" onClick={() => window.location.assign('/')}>Go to Glyph</Button></DialogFooter>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <Field label={`Type ${expected} to confirm`} required>
                  {(p) => <Input {...p} value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" spellCheck={false} className="font-mono" />}
                </Field>
                {hasPassword ? (
                  <Field label="Your password" required>
                    {(p) => <Input {...p} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />}
                  </Field>
                ) : (
                  <p className="text-small text-fg-secondary">You sign in with a provider rather than a password, so the phrase is your confirmation.</p>
                )}
                <FormStatus error={error} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="ghost" disabled={pending}>Keep my account</Button></DialogClose>
                  <Button type="submit" variant="danger" loading={pending} disabled={phrase.trim() !== expected || (hasPassword && !password)}>Permanently delete my account</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        <Button asChild variant="ghost"><Link href="/settings/account">Keep my account</Link></Button>
        {blocked && <p className="text-small text-fg-muted">Blocked until studio ownership is resolved.</p>}
      </div>
    </div>
  )
}
