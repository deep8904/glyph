import { notFound } from 'next/navigation'
import { ShellFrame } from '@/components/shell/Shell'
import { CollaborationListing } from '@/components/collaborate/CollaborationListing'
import { ApplicationPanel } from '@/components/collaborate/ApplicationPanel'
import { PlaytestListing } from '@/components/playtests/PlaytestListing'
import { TesterPanel } from '@/components/playtests/TesterPanel'
import { DeveloperPlaytests, TesterPlaytests, type OwnedRequest, type MySession } from '@/components/playtests/PlaytestsViews'
import { NewPlaytestForm } from '@/components/playtests/NewPlaytestForm'
import { NewCollabForm } from '@/components/collaborate/NewCollabForm'
import { FeedbackForm } from '@/components/playtests/FeedbackForm'
import { Section } from '@/components/ui/Section'

export const metadata = { title: 'Workflows (fixtures) — Glyph', robots: { index: false, follow: false } }

const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
const APP = (status: string) => ({ id: 'a', status, message: 'I have shipped two small audio-driven games and would love to score this one.', created_at: ago(2) })
const FB = { ratings: { gameplay: 8, controls: 6, fun_factor: 9 }, text_responses: { controls: 'Dodge feels floaty on the first floor.' }, time_spent_minutes: 40, created_at: ago(1) }
const REQUESTS: OwnedRequest[] = [
  {
    id: 'r1', status: 'open', requested_testers: 3, current_testers: 2, created_at: ago(6), projects: { title: 'Fixture Game' },
    playtest_sessions: [
      { id: 's1', status: 'requested', created_at: ago(0.2), profiles: { username: 'wait-a', display_name: 'Waiting Tester' }, playtest_feedback: null },
      { id: 's2', status: 'accepted', created_at: ago(2), profiles: { username: 'play-b', display_name: 'Playing Tester' }, playtest_feedback: null },
      { id: 's3', status: 'completed', created_at: ago(4), profiles: { username: 'done-c', display_name: 'Finished Tester' }, playtest_feedback: FB },
      { id: 's4', status: 'skipped', created_at: ago(5), profiles: { username: 'skip-d', display_name: 'Skipped Tester' }, playtest_feedback: null },
    ],
  },
  { id: 'r2', status: 'closed', requested_testers: 5, current_testers: 0, created_at: ago(30), projects: { title: 'Older Fixture Game' }, playtest_sessions: [] },
]
const MINE = (id: string, status: string, title: string): MySession => ({ id, status, created_at: ago(1), playtest_requests: { id: `q${id}`, projects: { title }, profiles: { username: 'dev-x', display_name: 'Fixture Dev' } }, playtest_feedback: null })

/** Development-only fixtures: every collaboration application state and every playtest tester state, both playtest sides, and the forms. 404 in production. */
export default function WorkflowFixtures() {
  if (process.env.NODE_ENV === 'production') notFound()
  const user = { displayName: 'Fixture User', username: 'fixture-user', email: 'fixture@example.invalid', nav: { isAdmin: false, hasPublisherAccount: false, hasStudio: false, hasPublisherContacts: false, unreadNotifications: 0 } }
  return (
    <ShellFrame user={user} headerLabel="Fixtures">
      <div className="max-w-3xl space-y-12">
        <h1 className="text-h1 font-semibold text-fg">Workflow fixtures (development only)</h1>

        <Section id="w-board" title="Collaboration rows">
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            <CollaborationListing post={{ id: '1', post_type: 'seeking_collaborator', role_needed: 'Audio designer', role_offered: null, contract_type: 'rev_share', remote_allowed: true, location: null, description: 'Fixture project needs adaptive music for a five-floor roguelike. You would own the audio direction.', created_at: ago(2), project_title: 'Fixture Game', username: 'fixture-dev', display_name: 'Fixture Dev' }} />
            <CollaborationListing post={{ id: '2', post_type: 'available_to_collaborate', role_needed: null, role_offered: 'Gameplay programmer', contract_type: 'part_time', remote_allowed: false, location: 'Vancouver, BC', description: 'Available evenings for a small team.', created_at: ago(9), project_title: null, username: 'fixture-dev2', display_name: 'Another Fixture' }} />
            <CollaborationListing variant="mine" post={{ id: '3', post_type: 'seeking_collaborator', role_needed: 'Artist', role_offered: null, project_title: 'Fixture Game' }} status={{ label: 'Open', tone: 'positive' }} hint="2 to review" />
            <CollaborationListing variant="mine" post={{ id: '4', post_type: 'seeking_collaborator', role_needed: 'Composer', role_offered: null, project_title: 'Other Game', display_name: 'Fixture Dev' }} status={{ label: 'Awaiting review', tone: 'attention' }} hint="Waiting for review" />
          </ul>
        </Section>

        {(['pending', 'accepted', 'rejected', 'withdrawn'] as const).map((s) => (
          <Section key={s} id={`w-app-${s}`} title={`Application: ${s}`}>
            <ApplicationPanel postId="p" signedIn acceptingApplications roleTitle="Audio designer" projectTitle="Fixture Game" authorName="Fixture Dev" authorUsername="fixture-dev" application={APP(s)} />
          </Section>
        ))}
        <Section id="w-app-closed" title="Application: pending, post closed"><ApplicationPanel postId="p" signedIn acceptingApplications={false} roleTitle="Audio designer" projectTitle="Fixture Game" authorName="Fixture Dev" authorUsername="fixture-dev" application={APP('pending')} /></Section>
        <Section id="w-app-new" title="Apply (signed in)"><ApplicationPanel postId="p" signedIn acceptingApplications roleTitle="Audio designer" projectTitle="Fixture Game" authorName="Fixture Dev" authorUsername="fixture-dev" application={null} /></Section>
        <Section id="w-app-out" title="Apply (signed out)"><ApplicationPanel postId="p" signedIn={false} acceptingApplications roleTitle="Audio designer" projectTitle="Fixture Game" authorName="Fixture Dev" authorUsername="fixture-dev" application={null} /></Section>

        <Section id="w-pt-rows" title="Playtest rows (tester board)">
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            <PlaytestListing playtest={{ id: '1', project_title: 'Fixture Game', build_type: 'browser', platforms: ['Web', 'Windows'], description: 'Try the first three floors and tell us whether the parry window reads clearly.', focus_areas: ['Controls', 'Difficulty'], requested_testers: 10, current_testers: 7, created_at: ago(1), username: 'fixture-dev', display_name: 'Fixture Dev' }} />
            <PlaytestListing playtest={{ id: '2', project_title: 'Almost Full Game', build_type: 'download', platforms: ['macOS'], description: 'Alpha build.', focus_areas: [], requested_testers: 5, current_testers: 5, created_at: ago(3), username: 'fixture-dev', display_name: 'Fixture Dev' }} />
          </ul>
        </Section>

        {([['none', 'open', null], ['none', 'full', null], ['none', 'closed', null], ['requested', 'open', null], ['accepted', 'open', { build_url: 'https://example.com/build', build_type: 'browser' }], ['accepted', 'open', { build_url: 'ABCDE-FGHIJ-KLMNO', build_type: 'steam_key' }], ['completed', 'full', { build_url: 'https://example.com/build', build_type: 'download' }], ['skipped', 'open', null], ['withdrawn', 'open', null]] as const).map(([st, req, build], i) => (
          <Section key={i} id={`w-tp-${i}`} title={`Tester journey: ${st} (playtest ${req}${build ? `, ${build.build_type}` : ''})`}>
            <TesterPanel requestId="r" signedIn requestStatus={req} authorName="Fixture Dev" session={st === 'none' ? null : { id: 's', status: st }} build={build} />
          </Section>
        ))}
        <Section id="w-tp-out" title="Tester journey: signed out"><TesterPanel requestId="r" signedIn={false} requestStatus="open" authorName="Fixture Dev" session={null} build={null} /></Section>

        <Section id="w-dev" title="Developer side (dashboard)"><DeveloperPlaytests requests={REQUESTS} failed={false} /></Section>
        <Section id="w-dev-empty" title="Developer side: empty and failed"><DeveloperPlaytests requests={[]} failed={false} /><DeveloperPlaytests requests={[]} failed /></Section>
        <Section id="w-tester" title="Tester side (dashboard)"><TesterPlaytests sessions={[MINE('1', 'accepted', 'Game A'), MINE('2', 'requested', 'Game B'), MINE('3', 'completed', 'Game C'), MINE('4', 'skipped', 'Game D')]} failed={false} /></Section>
        <Section id="w-tester-empty" title="Tester side: empty"><TesterPlaytests sessions={[]} failed={false} /></Section>

        <Section id="w-fb" title="Feedback form"><FeedbackForm sessionId="s" requestId="r" /></Section>
        <Section id="w-newpt" title="New playtest form"><NewPlaytestForm projects={[{ id: 'p', title: 'Fixture Game' }]} /></Section>
        <Section id="w-newcollab" title="New collaboration form"><NewCollabForm projects={[{ id: 'p', title: 'Fixture Game' }]} /></Section>
      </div>
    </ShellFrame>
  )
}
