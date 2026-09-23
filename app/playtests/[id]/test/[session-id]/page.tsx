import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackForm } from '@/components/playtests/FeedbackForm'

type SessionRow = {
  id: string
  request_id: string
  status: string
  playtest_requests: { id: string; projects: { title: string } | null; profiles: { display_name: string | null; username: string } | null } | null
}

export default async function PlaytestFeedbackPage({ params }: { params: Promise<{ id: string; 'session-id': string }> }) {
  const { id, 'session-id': sessionId } = await params
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  // Only the tester's own session is readable here; anything else is a 404.
  const { data: session } = await supabase
    .from('playtest_sessions')
    .select('id, request_id, status, playtest_requests!request_id(id, projects!project_id(title), profiles!author_id(display_name, username))')
    .eq('id', sessionId)
    .eq('tester_id', user.id)
    .maybeSingle<SessionRow>()
  if (!session || session.request_id !== id) notFound()

  const game = session.playtest_requests?.projects?.title ?? 'this game'
  const dev = session.playtest_requests?.profiles?.display_name || session.playtest_requests?.profiles?.username || 'the developer'

  const blocked: Record<string, string> = {
    requested: `${dev} has not accepted your sign-up yet. You can submit feedback once you are accepted.`,
    completed: 'You already submitted feedback for this playtest. Thank you.',
    skipped: `${dev} is not proceeding with your sign-up, so feedback cannot be submitted.`,
    withdrawn: 'You withdrew from this playtest, so feedback cannot be submitted.',
  }

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Playtest feedback">
      <div className="max-w-2xl">
        <Link href={`/playtests/${id}`} className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← Back to the playtest</Link>
        <h1 className="mt-1 text-h1 font-semibold text-fg [overflow-wrap:anywhere]">Feedback on {game}</h1>
        <p className="mb-6 mt-1 text-small text-fg-secondary">Sent to {dev}. Rate each area from 1 to 10 and add notes where they help.</p>

        {session.status === 'accepted' ? (
          <FeedbackForm sessionId={session.id} requestId={id} />
        ) : (
          <EmptyState kind="restricted" title="Feedback is not available" description={blocked[session.status] ?? 'Feedback is not available for this sign-up.'} action={<Link href={`/playtests/${id}`} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Back to the playtest</Link>} />
        )}
      </div>
    </AppShell>
  )
}
