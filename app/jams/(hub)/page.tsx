import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { JamRow, type JamListRow } from '@/components/jams/JamRow'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Section } from '@/components/ui/Section'

export const metadata = { title: 'Game jams — Glyph' }

const COLS = 'id, slug, title, description, theme, start_at, end_at, status, profiles!host_id(username, display_name)'

/**
 * Game jams: time-bounded contexts in which projects get made. The list is by phase — what is happening or
 * coming up, then what has finished. A jam has no content of its own: its entries are existing Glyph projects.
 */
export default async function JamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [active, past] = await Promise.all([
    supabase.from('game_jams').select(COLS).eq('admin_approved', true).in('status', ['upcoming', 'running', 'voting']).order('start_at', { ascending: true }).limit(20),
    supabase.from('game_jams').select(COLS).eq('admin_approved', true).in('status', ['completed']).order('end_at', { ascending: false }).limit(10),
  ])
  const activeJams = (active.data ?? []) as unknown as JamListRow[]
  const pastJams = (past.data ?? []) as unknown as JamListRow[]
  const failed = !!(active.error || past.error)

  return (
    <DiscoveryFrame label="Jams">
      {() => (
        <div>
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-h1 font-semibold text-fg">Game jams</h1>
              <p className="mt-1 max-w-prose text-small text-fg-secondary">Time-boxed. Entries are real Glyph projects.</p>
            </div>
            {user && <Button asChild variant="secondary" className="shrink-0"><Link href="/dashboard/jams/new">Host a jam</Link></Button>}
          </header>

          {failed ? (
            <ErrorState className="mt-6" title="Jams could not be loaded" description="This may be temporary." retryHref="/jams" />
          ) : activeJams.length === 0 && pastJams.length === 0 ? (
            <EmptyState
              kind="first-use"
              className="mt-6"
              title="No game jams yet"
              description="Jams appear here once they are hosted and approved."
              action={user ? undefined : <Button asChild variant="primary" size="sm"><Link href="/login">Sign in to host one</Link></Button>}
            />
          ) : (
            <div className="mt-6 space-y-8">
              <Section id="jams-now" title="Now and next" description="Running, open for voting, or starting soon — in start order.">
                {activeJams.length === 0 ? (
                  <EmptyState kind="cleared" className="border-y-0 py-2" title="Nothing is running or coming up" description="Finished jams are listed below." />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">{activeJams.map((j) => <JamRow key={j.id} jam={j} />)}</ul>
                )}
              </Section>
              {pastJams.length > 0 && (
                <Section id="jams-past" title="Finished" description="Most recent first.">
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">{pastJams.map((j) => <JamRow key={j.id} jam={j} />)}</ul>
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </DiscoveryFrame>
  )
}
