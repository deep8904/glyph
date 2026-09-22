import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { ContactStatusActions } from '@/components/publisher/ContactStatusActions'
import { StatusText } from '@/components/workflow/StatusLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Section } from '@/components/ui/Section'
import { isHttpsUrl, relativeTime } from '@/lib/utils'

type Row = {
  id: string
  message: string
  status: string
  created_at: string
  projects: { title: string; slug: string | null } | null
  publisher_accounts: { id: string; company_name: string; website: string | null; profiles: { username: string } | null } | null
}

const STATUS: Record<string, { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }> = {
  sent: { label: 'New', tone: 'attention' },
  read: { label: 'Read', tone: 'neutral' },
  replied: { label: 'Replied', tone: 'positive' },
  archived: { label: 'Archived', tone: 'negative' },
}

/** Developer-side view of publisher outreach. Glyph has no DMs, so replies happen outside; this page is the record. */
export default async function PublisherContactsPage() {
  const { user, displayName, email, nav, username: me } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('publisher_contacts')
    .select('id, message, status, created_at, projects!project_id(title, slug), publisher_accounts!publisher_id(id, company_name, website, profiles!user_id(username))')
    .eq('developer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<Row[]>()
  const rows = data ?? []
  const open = rows.filter((r) => r.status !== 'archived')
  const archived = rows.filter((r) => r.status === 'archived')

  const renderRow = (r: Row) => {
    const pub = r.publisher_accounts
    const st = STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const }
    const site = isHttpsUrl(pub?.website) ? pub!.website : null
    return (
      <li key={r.id} className="py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-body text-fg-secondary [overflow-wrap:anywhere]">
            {pub ? <Link href={`/publishers/${pub.id}`} className="font-medium text-fg hover:text-link">{pub.company_name}</Link> : <span className="font-medium text-fg">A publisher</span>}
            {r.projects && <> about {r.projects.slug ? <Link href={`/p/${me}/${r.projects.slug}`} className="font-medium text-fg hover:text-link">{r.projects.title}</Link> : <span className="font-medium text-fg">{r.projects.title}</span>}</>}
            <span className="text-fg-muted"> · {relativeTime(r.created_at)}</span>
          </p>
          <StatusText label={st.label} tone={st.tone} />
        </div>
        <p className="mt-2 max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{r.message}</p>
        <p className="mt-2 text-small text-fg-muted">
          To reply, use {site ? <a href={site} target="_blank" rel="noopener noreferrer" className="font-medium text-link underline-offset-2 hover:underline">their website<span className="sr-only"> (opens in a new tab)</span></a> : 'their'}
          {pub?.profiles ? <>{site ? ' or ' : ' '}<Link href={`/dev/${pub.profiles.username}`} className="font-medium text-link underline-offset-2 hover:underline">their Glyph profile</Link></> : ' profile'}. Glyph does not relay messages.
        </p>
        <div className="mt-3"><ContactStatusActions contactId={r.id} status={r.status} publisherName={pub?.company_name ?? 'publisher'} /></div>
      </li>
    )
  }

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Publisher messages">
      <div className="max-w-3xl">
        <h1 className="text-h1 font-semibold text-fg">Publisher messages</h1>
        <p className="mt-1 text-small text-fg-secondary">Verified publishers who contacted you about your public projects. You never have to reply.</p>
        {error ? (
          <ErrorState className="mt-4" title="Your messages could not be loaded" description="This may be temporary." retryHref="/dashboard/publisher-contacts" />
        ) : rows.length === 0 ? (
          <EmptyState kind="first-use" className="mt-4" title="No publisher has contacted you" description="Public projects with recent devlogs are the easiest for publishers to find." />
        ) : (
          <>
            {open.length > 0 && <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">{open.map(renderRow)}</ul>}
            {archived.length > 0 && (
              <Section id="arch-h" title="Archived" count={archived.length} className="mt-10">
                <ul className="divide-y divide-line-subtle border-y border-line-subtle">{archived.map(renderRow)}</ul>
              </Section>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
