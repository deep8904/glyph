import Link from 'next/link'
import { PlaytestListing } from '@/components/playtests/PlaytestListing'
import { SessionActions } from '@/components/playtests/SessionActions'
import { FeedbackDetail } from '@/components/playtests/FeedbackDetail'
import { PlaytestStatusControl } from '@/components/playtests/PlaytestStatusControl'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PLAYTEST_STATUS, SESSION_STATUS, StatusLabel, StatusText } from '@/components/workflow/StatusLabel'
import { relativeTime } from '@/lib/utils'

export type Feedback = { ratings: Record<string, number>; text_responses: Record<string, string>; time_spent_minutes: number | null; created_at: string }
export type OwnedSession = {
  id: string
  status: string
  created_at: string
  profiles: { username: string; display_name: string | null } | null
  playtest_feedback: Feedback[] | Feedback | null
}
export type OwnedRequest = {
  id: string
  status: 'open' | 'full' | 'closed'
  requested_testers: number
  current_testers: number
  created_at: string
  projects: { title: string } | null
  playtest_sessions: OwnedSession[]
}
export type MySession = {
  id: string
  status: string
  created_at: string
  playtest_requests: { id: string; projects: { title: string } | null; profiles: { username: string; display_name: string | null } | null } | null
  playtest_feedback: { id: string } | null
}

// Decisions needed come first, then people currently testing, then history.
const ORDER: Record<string, number> = { requested: 0, accepted: 1, completed: 2, skipped: 3, withdrawn: 4 }

const sortSessions = (list: OwnedSession[]) => [...list].sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) || b.created_at.localeCompare(a.created_at))

/** The developer's side: each playtest with its capacity and testers grouped by stage, plus the actions for that stage. */
export function DeveloperPlaytests({ requests, failed }: { requests: OwnedRequest[]; failed: boolean }) {
  return (
          <section aria-label="Your playtests" className="mt-6">
            {failed ? (
              <ErrorState inline title="We couldn't load your playtests" description="This may be temporary. Reload the page to try again." />
            ) : requests.length === 0 ? (
              <EmptyState kind="first-use" title="You have not requested testers yet" description="Set up a playtest for one of your projects. Testers ask for a place, you choose who gets the build." action={<Button asChild variant="primary" size="sm"><Link href="/dashboard/playtests/new">Request testers</Link></Button>} />
            ) : (
              <div className="space-y-10">
                {requests.map((req) => {
                  const st = PLAYTEST_STATUS[req.status]
                  const list = sortSessions(req.playtest_sessions)
                  const waitingList = list.filter((s) => s.status === 'requested')
                  const testing = list.filter((s) => s.status === 'accepted')
                  const done = list.filter((s) => s.status === 'completed')
                  const closedOut = list.filter((s) => s.status === 'skipped' || s.status === 'withdrawn')
                  const atCapacity = req.current_testers >= req.requested_testers
                  const nameOf = (s: OwnedSession) => s.profiles?.display_name ?? s.profiles?.username ?? 'Tester'
                  const who = (s: OwnedSession) => (s.profiles ? <Link href={`/dev/${s.profiles.username}`} className="font-medium text-fg hover:text-link">{nameOf(s)}</Link> : nameOf(s))
                  return (
                    <section key={req.id} aria-labelledby={`pt-${req.id}`}>
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
                        <div className="min-w-0">
                          <h2 id={`pt-${req.id}`} className="text-h2 font-semibold text-fg [overflow-wrap:anywhere]">
                            <Link href={`/playtests/${req.id}`} className="inline-flex min-h-11 items-center hover:text-link sm:min-h-0">{req.projects?.title ?? 'Project'}</Link>
                          </h2>
                          <p className="text-small text-fg-muted">
                            {req.current_testers} of {req.requested_testers} places taken
                            {waitingList.length > 0 && <span className="font-medium text-warning"> · {waitingList.length} waiting for you</span>}
                            {done.length > 0 && <> · {done.length} feedback received</>}
                          </p>
                        </div>
                        <StatusLabel label={st.label} tone={st.tone} />
                      </div>

                      {list.length === 0 ? (
                        <p className="mt-4 text-body text-fg-secondary">
                          {req.status === 'closed' ? 'Closed with no requests.' : <>No one has requested a place yet. Testers find this on the <Link href="/playtests/browse" className="font-medium text-link underline-offset-2 hover:underline">Playtests board</Link>, or share <Link href={`/playtests/${req.id}`} className="font-medium text-link underline-offset-2 hover:underline">the playtest page</Link>.</>}
                        </p>
                      ) : (
                        <div className="mt-4 space-y-6">
                          {waitingList.length > 0 && (
                            <div>
                              <h3 className="text-small font-semibold text-fg">Waiting for your decision <span className="font-mono font-normal text-fg-muted">{waitingList.length}</span></h3>
                              <ul className="mt-1 divide-y divide-line-subtle border-y border-line-subtle">
                                {waitingList.map((s) => (
                                  <li key={s.id} className="py-3">
                                    <p className="text-body text-fg-secondary">{who(s)} <span className="text-fg-muted">· requested {relativeTime(s.created_at)}</span></p>
                                    <div className="mt-2"><SessionActions sessionId={s.id} testerName={nameOf(s)} atCapacity={atCapacity} /></div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {testing.length > 0 && (
                            <div>
                              <h3 className="text-small font-semibold text-fg">Testing <span className="font-mono font-normal text-fg-muted">{testing.length}</span></h3>
                              <ul className="mt-1 divide-y divide-line-subtle border-y border-line-subtle">
                                {testing.map((s) => (
                                  <li key={s.id} className="py-3 text-body text-fg-secondary">{who(s)} <span className="text-fg-muted">· has the build; feedback not in yet</span></li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {done.length > 0 && (
                            <div>
                              <h3 className="text-small font-semibold text-fg">Feedback received <span className="font-mono font-normal text-fg-muted">{done.length}</span></h3>
                              <ul className="mt-1 divide-y divide-line-subtle border-y border-line-subtle">
                                {done.map((s) => {
                                  const fb = Array.isArray(s.playtest_feedback) ? s.playtest_feedback[0] : s.playtest_feedback
                                  return (
                                    <li key={s.id} className="py-3">
                                      <p className="text-body text-fg-secondary">{who(s)} <span className="text-fg-muted">· sent {fb ? relativeTime(fb.created_at) : 'feedback'}</span></p>
                                      {fb && <FeedbackDetail feedback={fb} />}
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )}
                          {closedOut.length > 0 && (
                            <div>
                              <h3 className="text-small font-semibold text-fg-secondary">Closed out <span className="font-mono font-normal text-fg-muted">{closedOut.length}</span></h3>
                              <ul className="mt-1 divide-y divide-line-subtle border-y border-line-subtle">
                                {closedOut.map((s) => {
                                  const sst = SESSION_STATUS[s.status] ?? { label: s.status, tone: 'neutral' as const }
                                  return <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-body text-fg-muted"><span>{nameOf(s)}</span><StatusText label={sst.label} tone={sst.tone} /></li>
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-5"><PlaytestStatusControl requestId={req.id} status={req.status} /></div>
                    </section>
                  )
                })}
              </div>
            )}
          </section>
  )
}

/** The tester's side: games you asked to test, grouped by what you owe next. */
export function TesterPlaytests({ sessions, failed }: { sessions: MySession[]; failed: boolean }) {
  return (
          <section aria-label="Games you are testing" className="mt-6">
            {failed ? (
              <ErrorState inline title="We couldn't load your sign-ups" description="This may be temporary. Reload the page to try again." />
            ) : sessions.length === 0 ? (
              <EmptyState kind="first-use" title="You have not asked to test a game yet" description="Find a game that needs testers, request a place, and the developer decides." action={<Button asChild variant="primary" size="sm"><Link href="/playtests/browse">Browse playtests</Link></Button>} />
            ) : (
              <div className="space-y-8">
                {([
                  ['Feedback due', ['accepted'], 'Play the build, then send feedback.'],
                  ['Waiting for the developer', ['requested'], 'Nothing is needed from you.'],
                  ['Finished', ['completed', 'skipped', 'withdrawn'], undefined],
                ] as const).map(([title, states, note]) => {
                  const group = sessions.filter((s) => (states as readonly string[]).includes(s.status))
                  if (group.length === 0) return null
                  return (
                    <div key={title}>
                      <h2 className="text-h3 font-semibold text-fg">{title} <span className="font-mono text-micro font-normal text-fg-muted">{group.length}</span></h2>
                      {note && <p className="text-small text-fg-muted">{note}</p>}
                      <ul className="mt-1 divide-y divide-line-subtle border-y border-line-subtle">
                        {group.map((s) => {
                          const r = s.playtest_requests!
                          const hint: Record<string, string> = { accepted: 'Get the build and send feedback', requested: 'Waiting for the developer', completed: 'Feedback sent', skipped: 'Not selected by the developer', withdrawn: 'You withdrew' }
                          return (
                            <PlaytestListing
                              key={s.id}
                              variant="mine"
                              playtest={{ id: r.id, project_title: r.projects?.title ?? 'Playtest', username: r.profiles?.username, display_name: r.profiles?.display_name }}
                              status={SESSION_STATUS[s.status]}
                              hint={hint[s.status]}
                            />
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
  )
}
