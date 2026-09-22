'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createShortlist, removeFromShortlist } from '@/app/actions/publisher'
import { PublisherRegisterForm } from '@/components/publisher/PublisherRegisterForm'
import { StatusText } from '@/components/workflow/StatusLabel'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/controls'
import { Section } from '@/components/ui/Section'
import { relativeTime } from '@/lib/utils'

type Publisher = { id: string; company_name: string; description: string | null; website: string | null; verified: boolean }
export type ShortlistRow = { id: string; name: string; items: string[]; created_at: string }
export type ProjectInfo = { title: string; slug: string; username: string; stage: string | null }
export type ContactRow = { id: string; message: string; status: string; createdAt: string; projectTitle: string | null; projectHref: string | null; developerName: string; developerUsername: string | null }

const CONTACT_STATUS: Record<string, { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }> = {
  sent: { label: 'Sent', tone: 'neutral' },
  read: { label: 'Read', tone: 'neutral' },
  replied: { label: 'Replied', tone: 'positive' },
  archived: { label: 'Archived by developer', tone: 'negative' },
}

/**
 * The publisher's private workspace. Identity (who you are, verification) → finding projects → your shortlists →
 * the messages you sent. Every project in here is the canonical project (linked to /p/…); nothing is copied.
 */
export function PublisherDashboardClient({ publisher, shortlists, projectLookup, contacts }: {
  publisher: Publisher; shortlists: ShortlistRow[]; projectLookup: Record<string, ProjectInfo>; contacts: ContactRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState<{ listId: string; projectId: string; title: string; listName: string } | null>(null)
  const [editing, setEditing] = useState(false)

  const run = (fn: () => Promise<{ error: string } | { success: true }>, after?: () => void) => {
    setError('')
    startTransition(async () => {
      const r = await fn()
      if ('error' in r) { setError(r.error); setConfirm(null) }
      else { after?.(); router.refresh() }
    })
  }

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-small font-medium text-fg-muted">Publisher account</p>
            <h1 className="text-h1 font-semibold text-fg [overflow-wrap:anywhere]">{publisher.company_name}</h1>
            <p className="mt-1"><StatusText label={publisher.verified ? 'Verified publisher' : 'Pending verification'} tone={publisher.verified ? 'positive' : 'attention'} /></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link href={`/publishers/${publisher.id}`}>{publisher.verified ? 'View public page' : 'Preview page'}</Link></Button>
            <Button variant="secondary" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>{editing ? 'Close editor' : 'Edit profile'}</Button>
          </div>
        </div>
        <p className="mt-3 max-w-prose text-body text-fg-secondary">
          {publisher.verified
            ? 'You are listed in the publisher directory. You can contact developers from any public project page.'
            : 'Glyph reviews new accounts before they are listed. Until then you can shortlist projects; contacting developers unlocks once you are verified.'}
        </p>
        {editing && <div className="mt-4 max-w-xl"><PublisherRegisterForm existing={publisher} /></div>}
      </header>

      <Section id="disc-h" title="Find projects" description="Browse public projects by recent activity, then shortlist or contact from the project page.">
        <Button asChild variant="primary"><Link href="/explore/projects">Browse projects</Link></Button>
      </Section>

      <Section id="short-h" title="Shortlists" count={shortlists.length} description="Private to you. Save projects you want to evaluate.">
        {shortlists.length === 0 ? (
          <EmptyState kind="first-use" className="border-y-0 py-2" title="No shortlists yet" description="Create one below, then add projects from their pages." />
        ) : (
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            {shortlists.map((sl) => (
              <li key={sl.id} className="py-4">
                <h3 className="text-body font-semibold text-fg [overflow-wrap:anywhere]">{sl.name} <span className="font-mono text-micro font-normal text-fg-muted">{sl.items.length}</span></h3>
                {sl.items.length === 0 ? (
                  <p className="mt-1 text-body text-fg-secondary">Empty. Use “Shortlist” on a project page.</p>
                ) : (
                  <ul className="mt-1">
                    {sl.items.map((pid) => {
                      const info = projectLookup[pid]
                      const title = info?.title ?? 'A project that is no longer public'
                      return (
                        <li key={pid} className="flex flex-wrap items-center justify-between gap-2">
                          {info ? (
                            <Link href={`/p/${info.username}/${info.slug}`} className="inline-flex min-h-11 items-center text-body text-link underline-offset-2 hover:underline [overflow-wrap:anywhere]">{title}<span className="text-fg-muted"> · {info.username}{info.stage ? ` · ${info.stage}` : ''}</span></Link>
                          ) : <span className="text-body text-fg-muted">{title}</span>}
                          <Button size="sm" variant="ghost" onClick={() => setConfirm({ listId: sl.id, projectId: pid, title, listName: sl.name })} aria-label={`Remove ${title} from ${sl.name}`}>Remove</Button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => createShortlist(name.trim()), () => setName('')) }}>
          <Field label="New shortlist" className="flex-1">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />}</Field>
          <Button type="submit" variant="secondary" disabled={!name.trim()} loading={pending && !confirm}>Create</Button>
        </form>
        {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
      </Section>

      <Section id="sent-h" title="Messages you sent" count={contacts.length}>
        {contacts.length === 0 ? (
          <EmptyState kind="first-use" className="border-y-0 py-2" title="You have not contacted anyone yet" description={publisher.verified ? 'Open a public project and choose “Contact developer”.' : 'Messages you send will be listed here once your account is verified.'} />
        ) : (
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            {contacts.map((c) => {
              const st = CONTACT_STATUS[c.status] ?? { label: c.status, tone: 'neutral' as const }
              return (
                <li key={c.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 text-body text-fg-secondary [overflow-wrap:anywhere]">
                      To {c.developerUsername ? <Link href={`/dev/${c.developerUsername}`} className="font-medium text-fg hover:text-link">{c.developerName}</Link> : c.developerName}
                      {c.projectTitle && <> about {c.projectHref ? <Link href={c.projectHref} className="font-medium text-fg hover:text-link">{c.projectTitle}</Link> : <span className="font-medium text-fg">{c.projectTitle}</span>}</>}
                      <span className="text-fg-muted"> · {relativeTime(c.createdAt)}</span>
                    </p>
                    <StatusText label={st.label} tone={st.tone} />
                  </div>
                  <p className="mt-1 line-clamp-3 max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{c.message}</p>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent title="Remove from shortlist?" description={confirm ? `Remove ${confirm.title} from ${confirm.listName}. The project itself is not affected.` : undefined}>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Keep</Button></DialogClose>
            <Button variant="danger" loading={pending} onClick={() => confirm && run(() => removeFromShortlist(confirm.listId, confirm.projectId), () => setConfirm(null))}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
