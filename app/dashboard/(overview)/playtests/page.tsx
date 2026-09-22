import Link from 'next/link'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { TabLinks } from '@/components/ui/Tabs'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { DeveloperPlaytests, TesterPlaytests, type MySession, type OwnedRequest } from '@/components/playtests/PlaytestsViews'

/**
 * Playtests has two sides and this page keeps them apart (URL: ?as=tester):
 *  - DEVELOPER ("Your playtests"): games you asked testers for. Each playtest shows its capacity and its testers
 *    grouped by stage — waiting for your decision, testing, feedback received — with the actions for that stage.
 *  - TESTER ("Testing others"): games you asked to test, grouped by what you owe next.
 */
export default async function DashboardPlaytestsPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams
  const asTester = as === 'tester'
  const { user } = await getSidebarIdentity()
  const supabase = await createClient()

  // Explicit columns: build_url is not selectable (migration 032).
  const [{ data: myRequests, error: reqError }, { data: mySessions, error: sessError }] = await Promise.all([
    supabase
      .from('playtest_requests')
      .select('id, status, requested_testers, current_testers, created_at, projects!project_id(title), playtest_sessions(id, status, created_at, profiles!tester_id(username, display_name), playtest_feedback(ratings, text_responses, time_spent_minutes, created_at))')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .returns<OwnedRequest[]>(),
    supabase
      .from('playtest_sessions')
      .select('id, status, created_at, playtest_requests!request_id(id, projects!project_id(title), profiles!author_id(username, display_name)), playtest_feedback(id)')
      .eq('tester_id', user.id)
      .order('created_at', { ascending: false })
      .returns<MySession[]>(),
  ])
  const requests = myRequests ?? []
  const sessions = (mySessions ?? []).filter((s) => s.playtest_requests)

  const waitingAll = requests.reduce((n, r) => n + r.playtest_sessions.filter((s) => s.status === 'requested').length, 0)
  const feedbackDue = sessions.filter((s) => s.status === 'accepted').length

  return (
    <Shell
      headerLabel="Playtests"
      headerAction={<Button asChild variant="primary" size="sm"><Link href="/dashboard/playtests/new">Request testers</Link></Button>}
    >
      <div className="max-w-3xl">
        <h1 className="text-h1 font-semibold text-fg">Playtests</h1>
        <p className="mt-1 text-small text-fg-secondary">
          {asTester
            ? 'Games you asked to test. Get the build once you are accepted, then send feedback.'
            : 'Games you asked testers for. Testers request a place; you accept them, they play, and you read their feedback.'}
        </p>

        <TabLinks
          className="mt-4"
          label="Which side of playtesting"
          activeHref={asTester ? '/dashboard/playtests?as=tester' : '/dashboard/playtests'}
          items={[
            { href: '/dashboard/playtests', label: waitingAll > 0 ? `Your playtests · ${waitingAll} waiting` : 'Your playtests' },
            { href: '/dashboard/playtests?as=tester', label: feedbackDue > 0 ? `Testing others · ${feedbackDue} feedback due` : 'Testing others' },
          ]}
        />

        {asTester ? <TesterPlaytests sessions={sessions} failed={!!sessError} /> : <DeveloperPlaytests requests={requests} failed={!!reqError} />}
      </div>
    </Shell>
  )
}
