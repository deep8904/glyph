import { notFound } from 'next/navigation'
import { ShellFrame } from '@/components/shell/Shell'
import { Section } from '@/components/ui/Section'
import { ObjectHeader } from '@/components/object/ObjectHeader'
import { StatusText } from '@/components/workflow/StatusLabel'
import { StatusSteps } from '@/components/workflow/StatusSteps'
import { JamRow } from '@/components/jams/JamRow'
import { EventRow } from '@/components/events/EventRow'
import { PublisherRow } from '@/components/publisher/PublisherRow'
import { MemberRow } from '@/components/studios/MemberRow'
import { StudioManageClient } from '@/components/studios/StudioManageClient'
import { EventManageClient } from '@/components/events/EventManageClient'
import { RsvpButton } from '@/components/events/RsvpButton'
import { DemoSlotRequest } from '@/components/events/DemoSlotRequest'
import { PublisherDashboardClient } from '@/components/publisher/PublisherDashboardClient'
import { JamVoteClient } from '@/components/jams/JamVoteClient'
import { NewJamForm } from '@/components/jams/NewJamForm'
import { NewEventForm } from '@/components/events/NewEventForm'
import { NewStudioForm } from '@/components/studios/NewStudioForm'
import { AddToShortlistButton } from '@/components/publisher/AddToShortlistButton'

export const metadata = { title: 'Graph objects (fixtures) — Glyph', robots: { index: false, follow: false } }
const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
const ahead = (d: number) => new Date(Date.now() + d * 86400000).toISOString()

/** Development-only fixtures for Studio management, Jam rows/voting, Event rows/RSVP/management, Publisher rows/dashboard. Fake data; writes fail by design. 404 in production. */
export default function GraphFixtures() {
  if (process.env.NODE_ENV === 'production') notFound()
  const user = { displayName: 'Fixture User', username: 'fixture-user', email: 'fixture@example.invalid', nav: { isAdmin: false, hasPublisherAccount: true, hasStudio: true, hasPublisherContacts: false, unreadNotifications: 0 } }
  const jam = (status: string, id: string) => ({ id, slug: id, title: `Fixture Jam (${status})`, description: 'Make a small game about one room in three days.', theme: status === 'upcoming' ? null : 'One Room', start_at: ago(1), end_at: ahead(2), status, profiles: { username: 'host-a', display_name: 'Fixture Host' } })
  return (
    <ShellFrame user={user} headerLabel="Fixtures">
      <div className="max-w-3xl space-y-12">
        <h1 className="text-h1 font-semibold text-fg">Graph object fixtures (development only)</h1>

        <Section id="g-header" title="ObjectHeader">
          <ObjectHeader title="Fixture Jam with a fairly long title to test wrapping on narrow screens" state={<StatusText label="Voting open" tone="attention" />}><p>Hosted by Fixture Host</p><p><span className="font-medium text-fg">Theme:</span> One Room</p></ObjectHeader>
        </Section>

        <Section id="g-jamrows" title="Jam rows and phases">
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">{['upcoming', 'running', 'voting', 'completed'].map((s, i) => <JamRow key={s} jam={jam(s, `j${i}`)} />)}</ul>
          <div className="mt-4"><StatusSteps label="Jam phases" steps={[{ label: 'The jam runs', state: 'done', note: 'Mon, Sep 8 → Wed, Sep 10' }, { label: 'Voting', state: 'current', note: 'Thu, Sep 11 → Sun, Sep 14' }, { label: 'Results', state: 'todo', note: 'Published when voting closes.' }]} /></div>
        </Section>

        <Section id="g-vote" title="Jam voting">
          <JamVoteClient
            existingVotes={{ e1: { overall: 4, fun: 5 } }}
            entries={[
              { id: 'e1', submission_url: 'https://example.com/play', submission_notes: 'WASD to move. Known issue: audio pops on level 2.', projects: { title: 'Fixture Entry', slug: 'fixture-entry', short_description: 'A one-room puzzle about doors.' }, profiles: { username: 'lead-a', display_name: 'Lead A' } },
              { id: 'e2', submission_url: 'javascript:alert(1)', submission_notes: null, projects: { title: 'Entry with an unsafe link', slug: null, short_description: null }, profiles: { username: 'lead-b', display_name: null } },
            ]}
          />
        </Section>

        <Section id="g-events" title="Event rows, RSVP and demo request">
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            <EventRow event={{ id: '1', title: 'Indie Dev Meetup — Berlin', description: 'Bring a build, show a build, or just come and talk about your game.', city: 'Berlin', country: 'Germany', start_at: ahead(3), end_at: ahead(3.1), rsvp_count: 12, capacity: 40, type: 'meetup' }} />
            <EventRow event={{ id: '2', title: 'Multi-day showcase', description: 'Two days.', city: 'Vancouver', country: 'Canada', start_at: ahead(10), end_at: ahead(12), rsvp_count: 0, capacity: null, type: 'showcase' }} />
          </ul>
          <div className="mt-4 space-y-4">
            <RsvpButton eventId="e" currentStatus={null} isSignedIn />
            <RsvpButton eventId="e" currentStatus="going" isSignedIn />
            <RsvpButton eventId="e" currentStatus="maybe" isSignedIn />
            <RsvpButton eventId="e" currentStatus={null} isSignedIn={false} />
            <DemoSlotRequest eventId="e" projects={[{ id: 'p', title: 'Fixture Project' }]} existing={null} />
            <DemoSlotRequest eventId="e" projects={[]} existing={null} />
            <DemoSlotRequest eventId="e" projects={[{ id: 'p', title: 'Fixture Project' }]} existing={{ accepted: false, title: 'Fixture Project' }} />
          </div>
        </Section>

        <Section id="g-eventmanage" title="Event management (host)">
          <EventManageClient event={{ id: 'e', status: 'published', rsvp_count: 2 }} rsvps={[{ id: 'r1', status: 'going', profiles: { username: 'a', display_name: 'Attendee A' } }, { id: 'r2', status: 'maybe', profiles: { username: 'b', display_name: null } }]} demoSlots={[{ id: 's1', accepted: false, slot_time: null, projects: { title: 'Requested Project' }, profiles: { username: 'a', display_name: 'Attendee A' } }, { id: 's2', accepted: true, slot_time: null, projects: { title: 'Accepted Project' }, profiles: { username: 'b', display_name: 'B' } }]} />
        </Section>

        <Section id="g-studio-rows" title="Studio team rows">
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            <MemberRow member={{ user_id: '1', role: 'owner', username: 'owner-a', display_name: 'Owner A', avatar_url: null, primary_role: 'game_designer' }} />
            <MemberRow member={{ user_id: '2', role: 'member', username: 'member-b', display_name: null, avatar_url: null, primary_role: null }} />
          </ul>
        </Section>

        <Section id="g-studio-manage" title="Studio management (owner)">
          <StudioManageClient
            studio={{ id: 's', slug: 'fixture-studio', name: 'Fixture Studio', description: 'A fixture studio.', website: 'https://example.com', location: 'Vancouver', size: 'solo' }}
            viewerRole="owner"
            currentUserId="1"
            members={[{ userId: '1', role: 'owner', username: 'owner-a', displayName: 'Owner A', joinedAt: ago(30) }, { userId: '2', role: 'member', username: 'member-b', displayName: 'Member B', joinedAt: ago(10) }]}
            invitations={[{ id: 'i1', inviteeUsername: 'invitee', inviteeName: 'Invitee', role: 'member', createdAt: ago(2), expiresAt: ahead(12), expired: false }]}
            studioProjects={[{ projectId: 'p1', title: 'Linked Project', ownerId: '1', visibility: 'public' }, { projectId: 'p2', title: 'Private Linked', ownerId: '2', visibility: 'private' }]}
            myProjects={[{ id: 'p3', title: 'Not yet linked' }]}
          />
        </Section>

        <Section id="g-newstudio" title="New studio form"><NewStudioForm /></Section>

        <Section id="g-pub-rows" title="Publisher rows and shortlist popover">
          <ul className="divide-y divide-line-subtle border-y border-line-subtle"><PublisherRow publisher={{ id: '1', company_name: 'Fixture Publishing', description: 'We publish small narrative games.', website: 'https://example.com' }} /></ul>
          <div className="mt-4"><AddToShortlistButton projectId="p" shortlists={[{ id: 'l1', name: 'Q4 evaluation', items: ['p'] }, { id: 'l2', name: 'Later', items: [] }]} /></div>
        </Section>

        <Section id="g-pub-dash" title="Publisher dashboard">
          <PublisherDashboardClient
            publisher={{ id: 'pub', company_name: 'Fixture Publishing', description: null, website: null, verified: true }}
            shortlists={[{ id: 'l1', name: 'Q4 evaluation', items: ['p1', 'gone'], created_at: ago(5) }]}
            projectLookup={{ p1: { title: 'Fixture Project', slug: 'fixture-project', username: 'dev-a', stage: 'alpha' } }}
            contacts={[{ id: 'c1', message: 'We loved the combat devlog and would like to talk about a console port.', status: 'replied', createdAt: ago(3), projectTitle: 'Fixture Project', projectHref: '/p/dev-a/fixture-project', developerName: 'Dev A', developerUsername: 'dev-a' }]}
          />
        </Section>

        <Section id="g-newjam" title="New jam form"><NewJamForm /></Section>
        <Section id="g-newevent" title="New event form"><NewEventForm /></Section>
      </div>
    </ShellFrame>
  )
}
