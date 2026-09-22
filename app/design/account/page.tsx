import { notFound } from 'next/navigation'
import { ShellFrame } from '@/components/shell/Shell'
import { Section } from '@/components/ui/Section'
import { NotificationsView } from '@/components/notifications/NotificationsView'
import { presentNotifications, type ObjectInfo, type RawNotification } from '@/lib/notifications/present'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { EditProfileForm } from '@/components/settings/EditProfileForm'
import { ProfileCompleteness } from '@/components/settings/ProfileCompleteness'
import { AccountEmailForm } from '@/components/settings/AccountEmailForm'
import { PasswordForm } from '@/components/settings/PasswordForm'
import { SignOutOthers } from '@/components/settings/SignOutOthers'
import { PrivacyRules, BLOCK_COPY } from '@/components/settings/PrivacyRules'
import { RelationshipList } from '@/components/settings/RelationshipList'
import { NotificationPreferencesForm } from '@/components/settings/NotificationPreferencesForm'
import { DeleteAccountFlow } from '@/components/settings/DeleteAccountFlow'
import { SettingsSection } from '@/components/settings/SettingsSection'
import type { DeletionSummary } from '@/app/actions/account'
import type { Profile } from '@/lib/supabase/types'

export const metadata = { title: 'Account fixtures — Glyph', robots: { index: false, follow: false } }

const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString()
const USER = 'fixture-recipient'

type N = Omit<RawNotification, 'read_at' | 'created_at' | 'actorName'> & { read: boolean; minutes: number; actor: string | null }
const mk = (n: N): RawNotification => ({ id: n.id, type: n.type, entity_type: n.entity_type, entity_id: n.entity_id, actor_id: n.actor_id, actorName: n.actor, read_at: n.read ? ago(n.minutes - 1) : null, created_at: ago(n.minutes) })
const usernames = new Map([['a1', 'alex-fixture'], ['a2', 'maya-fixture'], ['a3', 'jordan-fixture'], ['a4', 'sam-fixture'], ['a5', 'riley-fixture']])

// Every notification type, an unread and a read mix, merged rows, a very long name and title, a deleted actor,
// and objects that are gone. All names are obviously fake.
const OBJECTS = new Map<string, ObjectInfo>([
  ['dl1', { title: 'Devlog 12: Rebuilding the lighting pass', href: '/p/fixture/emberfall-keep/devlog-12' }],
  ['dl2', { title: 'A devlog title that is far too long for a phone and keeps going: Reworking the entire inventory, crafting, and save-game pipeline in one sitting', href: '/p/fixture/emberfall-keep/long' }],
  ['dlx', { title: null, gone: true }],
  ['cp1', { title: 'Emberfall Keep', role: 'Composer' }],
  ['cpx', { title: null, gone: true }],
  ['pt1', { title: 'Emberfall Keep' }],
  ['ptx', { title: null, gone: true }],
  ['st1', { title: 'Lantern Works', slug: 'lantern-works' }],
  ['iv1', { title: 'Lantern Works', slug: 'lantern-works', extra: 'admin' }],
  ['ct1', { title: 'Emberfall Keep', extra: 'Fixture Publishing Co' }],
])
const RAW: RawNotification[] = [
  mk({ id: 'n1', type: 'collab_application', entity_type: 'collaboration_post', entity_id: 'cp1', actor_id: 'a1', actor: 'Alex Fixture', read: false, minutes: 3 }),
  mk({ id: 'n2', type: 'playtest_signup', entity_type: 'playtest_request', entity_id: 'pt1', actor_id: 'a2', actor: 'Maya Fixture', read: false, minutes: 40 }),
  mk({ id: 'n3', type: 'comment', entity_type: 'devlog_post', entity_id: 'dl1', actor_id: 'a3', actor: 'Jordan Fixture', read: false, minutes: 90 }),
  mk({ id: 'n4', type: 'comment', entity_type: 'devlog_post', entity_id: 'dl1', actor_id: 'a4', actor: 'Sam Fixture', read: false, minutes: 95 }),
  mk({ id: 'n5', type: 'comment', entity_type: 'devlog_post', entity_id: 'dl1', actor_id: 'a5', actor: 'Riley Fixture', read: true, minutes: 200 }),
  mk({ id: 'n6', type: 'playtest_accepted', entity_type: 'playtest_request', entity_id: 'pt1', actor_id: 'a1', actor: 'Alex Fixture', read: true, minutes: 300 }),
  mk({ id: 'n7', type: 'reaction', entity_type: 'devlog_post', entity_id: 'dl2', actor_id: 'a2', actor: 'Maya Fixture With A Really Rather Long Display Name Indeed', read: true, minutes: 500 }),
  mk({ id: 'n8', type: 'follow', entity_type: null, entity_id: null, actor_id: 'a3', actor: 'Jordan Fixture', read: true, minutes: 700 }),
  mk({ id: 'n9', type: 'studio_invitation', entity_type: 'studio_invitation', entity_id: 'iv1', actor_id: 'a4', actor: 'Sam Fixture', read: false, minutes: 1200 }),
  mk({ id: 'n10', type: 'publisher_contact', entity_type: 'publisher_contact', entity_id: 'ct1', actor_id: null, actor: null, read: true, minutes: 2000 }),
  mk({ id: 'n11', type: 'collab_accepted', entity_type: 'collaboration_post', entity_id: 'cp1', actor_id: 'a5', actor: 'Riley Fixture', read: true, minutes: 3000 }),
  mk({ id: 'n12', type: 'studio_removed', entity_type: 'studio', entity_id: 'st1', actor_id: 'a1', actor: 'Alex Fixture', read: true, minutes: 4000 }),
  mk({ id: 'n13', type: 'playtest_feedback', entity_type: 'playtest_request', entity_id: 'pt1', actor_id: 'a2', actor: 'Maya Fixture', read: true, minutes: 5000 }),
  // Inaccessible / deleted targets
  mk({ id: 'n14', type: 'comment', entity_type: 'devlog_post', entity_id: 'dlx', actor_id: 'a3', actor: 'Jordan Fixture', read: false, minutes: 6000 }),
  mk({ id: 'n15', type: 'collab_rejected', entity_type: 'collaboration_post', entity_id: 'cpx', actor_id: 'a4', actor: 'Sam Fixture', read: true, minutes: 7000 }),
  mk({ id: 'n16', type: 'playtest_skipped', entity_type: 'playtest_request', entity_id: 'ptx', actor_id: 'a5', actor: 'Riley Fixture', read: true, minutes: 8000 }),
]
const withoutUnread = RAW.map((r) => ({ ...r, read_at: r.read_at ?? ago(1) }))

const profile = (over: Partial<Profile>) => ({ id: 'fx', username: 'fixture-user', display_name: 'Fixture User', bio: 'Making a small tactics game about lanterns.', location: 'Fixtureville', primary_role: 'programmer', primary_engine: 'godot', experience_level: 'intermediate', collaboration_status: 'open', github_url: 'https://github.com/fixture', itchio_url: null, twitter_url: null, website_url: null, ...over }) as unknown as Profile

const summary = (over: Partial<DeletionSummary>): DeletionSummary => ({ blockers: [], projects: 0, devlogs: 0, comments: 0, reactions: 0, followers: 0, following: 0, collab_posts: 0, applications: 0, playtest_requests: 0, playtest_sessions: 0, studios_left: 0, studios_closed: 0, publisher_account: false, contacts_sent: 0, contacts_received: 0, shortlists: 0, notifications: 0, blocks: 0, mutes: 0, ...over })

/** Development-only fixtures for Notifications and Settings in every state. Fake data; writes fail by design. 404 in production. */
export default function AccountFixtures() {
  if (process.env.NODE_ENV === 'production') notFound()
  const user = { displayName: 'Fixture User', username: 'fixture-user', email: 'fixture@example.invalid', nav: { isAdmin: false, hasPublisherAccount: false, hasStudio: true, hasPublisherContacts: false, unreadNotifications: 5 } }
  const present = (rows: RawNotification[]) => presentNotifications(rows, OBJECTS, usernames)
  return (
    <ShellFrame user={user} headerLabel="Fixtures">
      <div className="max-w-4xl space-y-14">
        <div>
          <h1 className="text-h1 font-semibold text-fg">Account fixtures (development only)</h1>
          <p className="mt-1 text-small text-fg-secondary">Notifications and Settings in every state. Fake data; saving fails by design.</p>
        </div>

        <Section id="f-n-unread" title="Notifications — populated, with unread, merged and unavailable rows">
          <NotificationsView rows={present(RAW)} failed={false} filter="all" recipientId={USER} limit={100} truncated />
        </Section>
        <Section id="f-n-filter" title="Notifications — unread filter">
          <NotificationsView rows={present(RAW)} failed={false} filter="unread" recipientId={USER} limit={100} truncated={false} />
        </Section>
        <Section id="f-n-read" title="Notifications — all read (unread filter shows no results)">
          <NotificationsView rows={present(withoutUnread)} failed={false} filter="unread" recipientId={USER} limit={100} truncated={false} />
        </Section>
        <Section id="f-n-empty" title="Notifications — empty"><NotificationsView rows={[]} failed={false} filter="all" recipientId={USER} limit={100} truncated={false} /></Section>
        <Section id="f-n-failed" title="Notifications — failed to load"><NotificationsView rows={[]} failed filter="all" recipientId={USER} limit={100} truncated={false} /></Section>

        <Section id="f-s-nav" title="Settings navigation"><SettingsNav /></Section>

        <Section id="f-s-profile" title="Settings — profile, normal account">
          <ProfileCompleteness profile={profile({})} />
          <EditProfileForm profile={profile({})} />
        </Section>
        <Section id="f-s-incomplete" title="Settings — profile, incomplete">
          <ProfileCompleteness profile={profile({ display_name: null, bio: null, location: null, primary_role: null, primary_engine: null })} />
          <ProfileCompleteness profile={profile({ bio: null })} />
        </Section>

        <Section id="f-s-account" title="Settings — account email, password, devices">
          <div className="space-y-8">
            <SettingsSection id="fx-email" title="Email address" description="Used to sign in and for messages from the sign-in provider. It is never shown on your profile."><p className="mb-4 text-body text-fg">fixture@example.invalid</p><AccountEmailForm currentEmail="fixture@example.invalid" /></SettingsSection>
            <SettingsSection id="fx-pw" title="Password"><PasswordForm email="fixture@example.invalid" /></SettingsSection>
            <SettingsSection id="fx-dev" title="Devices" description="If you signed in on a device you no longer control, end every other session."><SignOutOthers /></SettingsSection>
          </div>
        </Section>

        <Section id="f-s-privacy" title="Settings — privacy configuration">
          <PrivacyRules />
          <SettingsSection id="fx-block" title="Blocked" description={BLOCK_COPY}>
            <RelationshipList kind="block" people={[{ userId: 'u1', username: 'blocked-fixture', displayName: 'Blocked Fixture', since: ago(4000) }, { userId: 'u2', username: 'a-very-long-handle-for-wrapping-checks-fixture', displayName: 'An Extremely Long Display Name To Test Wrapping On Narrow Screens', since: ago(90000) }]} />
          </SettingsSection>
          <SettingsSection id="fx-mute" title="Muted"><RelationshipList kind="mute" people={[]} /></SettingsSection>
        </Section>

        <Section id="f-s-notifs" title="Settings — notification preferences (one family off)">
          <NotificationPreferencesForm initial={{ activity: true, collaboration: true, playtesting: false, studios: true, publisher: true }} />
        </Section>

        <Section id="f-s-delete" title="Settings — destructive confirmation">
          <h3 className="mb-2 text-small font-semibold text-fg">Populated account, password account</h3>
          <DeleteAccountFlow username="fixture-user" hasPassword summary={summary({ projects: 3, devlogs: 14, comments: 27, reactions: 61, followers: 9, following: 12, collab_posts: 1, playtest_requests: 1, studios_left: 2, studios_closed: 1, notifications: 40, blocks: 1, mutes: 2 })} />
          <h3 className="mb-2 mt-10 text-small font-semibold text-fg">Empty account, provider sign-in (phrase only)</h3>
          <DeleteAccountFlow username="new-fixture" hasPassword={false} summary={summary({})} />
          <h3 className="mb-2 mt-10 text-small font-semibold text-fg">Blocked by studio ownership</h3>
          <DeleteAccountFlow username="owner-fixture" hasPassword summary={summary({ studios_left: 1, blockers: [{ slug: 'lantern-works', name: 'Lantern Works', others: 3 }] })} />
        </Section>
      </div>
    </ShellFrame>
  )
}
