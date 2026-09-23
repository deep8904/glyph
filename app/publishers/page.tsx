import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { Pager } from '@/components/discovery/Pager'
import { PublisherRow, type PublisherListRow } from '@/components/publisher/PublisherRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { parsePage } from '@/lib/discovery/queries'

export const metadata = { title: 'Publishers — Glyph' }
const PAGE_SIZE = 20

/**
 * Directory of verified publishers — identity only. Verification is an admin decision; RLS exposes only verified
 * accounts (plus your own), newest verified first, no filters or metrics. A publisher's relationship with a
 * developer lives on the project page and in private inboxes, not here.
 */
export default async function PublishersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = parsePage((await searchParams).page)
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE

  const { data, error } = await supabase
    .from('publisher_accounts')
    .select('id, company_name, description, website')
    .eq('verified', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + PAGE_SIZE)
    .returns<PublisherListRow[]>()
  const rows = (data ?? []).slice(0, PAGE_SIZE)
  const hasMore = (data ?? []).length > PAGE_SIZE

  return (
    <DiscoveryFrame label="Publishers">
      {(viewer) => (
        <div>
          <header>
            <h1 className="text-h1 font-semibold text-fg">Publishers</h1>
            <p className="mt-1 max-w-prose text-small text-fg-secondary">Verified by Glyph. Developers decide whether to reply.</p>
          </header>

          {error ? (
            <ErrorState className="mt-6" title="The directory could not be loaded" description="This may be temporary." retryHref={`/publishers${page > 1 ? `?page=${page}` : ''}`} />
          ) : rows.length === 0 ? (
            <EmptyState
              kind={page > 1 ? 'no-results' : 'first-use'}
              className="mt-6"
              title={page > 1 ? 'Nothing further in the directory' : 'No verified publishers yet'}
              description={viewer ? 'Represent a publisher? Register your account; accounts are reviewed before they are listed.' : 'Publishers appear here once Glyph has verified them.'}
              action={viewer ? <Link href="/dashboard/publisher" className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Publisher tools</Link> : undefined}
            />
          ) : (
            <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">{rows.map((p) => <PublisherRow key={p.id} publisher={p} />)}</ul>
          )}
          <Pager page={page} hasMore={hasMore} hrefForPage={(n) => `/publishers${n > 1 ? `?page=${n}` : ''}`} />
        </div>
      )}
    </DiscoveryFrame>
  )
}
