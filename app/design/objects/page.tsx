import { notFound } from 'next/navigation'
import { ShellFrame } from '@/components/shell/Shell'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { FeaturedToggleButton } from '@/components/profile/FeaturedToggleButton'
import { ProjectRow } from '@/components/project/ProjectRow'
import { DevlogRow } from '@/components/devlog/DevlogRow'
import { CommentThread, type CommentData } from '@/components/devlog/CommentThread'
import { ReactionsBar } from '@/components/devlog/ReactionsBar'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'
import { Section } from '@/components/ui/Section'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

export const metadata = { title: 'Core objects (fixtures) — Glyph', robots: { index: false, follow: false } }

const author = (n: string, u: string) => ({ id: u, username: u, display_name: n, avatar_url: null })
const COMMENTS: CommentData[] = [
  {
    id: 'c1', author_id: 'a', parent_comment_id: null, content: 'The feedback loop problem is real. A visual ring was the fix for us too.', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), author: author('Fixture Author', 'fixture-a'),
    replies: [
      { id: 'c1r1', author_id: 'b', parent_comment_id: 'c1', content: 'Agreed — did you try a hit-stop as well?', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), author: author('Fixture Viewer', 'fixture-viewer') },
      { id: 'c1r2', author_id: 'a', parent_comment_id: 'c1', content: 'Yes, 80ms. It helped.', created_at: new Date(Date.now() - 86400000).toISOString(), author: author('Fixture Author', 'fixture-a') },
    ],
  },
  { id: 'c2', author_id: 'b', parent_comment_id: null, content: 'Would love a side-by-side video of old vs new combat.', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), author: author('Fixture Viewer', 'fixture-viewer') },
]
const DEVLOG = { title: 'Combat redesign — why we threw away 3 months of work', href: '#', projectTitle: 'Fixture Project', published_at: new Date(Date.now() - 86400000 * 4).toISOString() }
const PROJECT = { id: 'p', title: 'Fixture Project', slug: 'fixture-project', stage: 'alpha', short_description: 'A fixture project used to inspect the object components without real data.', updated_at: new Date(Date.now() - 86400000 * 2).toISOString() }
const MD = `## The honest post-mortem\n\nThe original system was **stamina-based**. It felt awful.\n\n- Stamina rings instead of a bar\n- Parry window is a *flash*\n\n> The loop was invisible.\n\n\`\`\`ts\nconst hitStop = 80 // ms\n\`\`\`\n\n### Numbers\n\n| Change | Result |\n|---|---|\n| Rings | Clearer |\n`

/** Development-only fixtures: owner vs visitor skeletons and comment interactions without authentication. 404 in production. */
export default function ObjectsFixture() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <ShellFrame user={null} headerLabel="Fixtures">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <h1 className="text-h1 font-semibold">Core object fixtures (development only)</h1>
        <p className="text-small text-fg-secondary">Fake people and text for inspecting components; not product data. Server actions and Supabase writes here will fail by design.</p>

        <Section id="f-owner" title="ProfileHeader — owner view">
          <ProfileHeader name="Fixture Owner" username="fixture-owner" avatarUrl={null} location="Vancouver, BC" facts={['Programmer', 'Godot', 'Indie']} isOpenToCollab followerCount={12} followingCount={3} isOwner currentUserId="x" targetId="x" isFollowing={false} isBlocked={false} isMuted={false} studios={[{ slug: 's', name: 'Fixture Studio', role: 'owner' }]} />
        </Section>
        <Section id="f-visitor" title="ProfileHeader — signed-in visitor">
          <ProfileHeader name="Fixture Visitor Target" username="fixture-target" avatarUrl={null} location={null} facts={[]} isOpenToCollab={false} followerCount={1} followingCount={0} isOwner={false} currentUserId="y" targetId="z" isFollowing isBlocked={false} isMuted={false} />
        </Section>

        <Section id="f-project" title="ProjectRow"><ProjectRow project={PROJECT} username="fixture-owner" variant="feature" />
          <ul className="mt-4 divide-y divide-line-subtle"><li><ProjectRow project={PROJECT} username="fixture-owner" /></li><li><ProjectRow project={{ ...PROJECT, id: 'q', title: 'Second fixture with a very long title that must truncate instead of breaking the row layout', stage: 'beta' }} username="fixture-owner" /></li></ul>
        </Section>

        <Section id="f-devlog" title="DevlogRow — list (owner and visitor) and timeline">
          <ul className="divide-y divide-line-subtle">
            <DevlogRow devlog={DEVLOG} action={<FeaturedToggleButton devlogId="d" featured />} />
            <DevlogRow devlog={{ ...DEVLOG, title: 'Visitor view of the same row' }} />
          </ul>
          <ol className="mt-6 divide-y divide-line-subtle border-y border-line-subtle">
            <DevlogRow variant="timeline" projectHref="#" editHref="#" entry={{ id: '1', slug: 'a', title: 'Published devlog', content: '## Heading\n\nBody text for the excerpt line that continues for a while so that it clamps.', published_at: DEVLOG.published_at, isDraft: false }} />
            <DevlogRow variant="timeline" projectHref="#" editHref="#" entry={{ id: '2', slug: 'b', title: 'Draft only the owner sees', content: 'Work in progress…', published_at: null, isDraft: true }} />
          </ol>
        </Section>

        <Section id="f-md" title="Markdown body"><div className="max-w-2xl"><MarkdownRenderer content={MD} /></div></Section>

        <Section id="f-react" title="Reactions (signed in / signed out)">
          <div className="space-y-3">
            <ReactionsBar devlogPostId="d" devlogAuthorId="a" currentUserId="u" initialCounts={[{ type: 'like', count: 3, reacted: true }, { type: 'helpful', count: 0, reacted: false }, { type: 'inspiring', count: 12, reacted: false }, { type: 'question', count: 0, reacted: false }]} />
            <ReactionsBar devlogPostId="d" devlogAuthorId="a" currentUserId={null} initialCounts={[{ type: 'like', count: 3, reacted: false }, { type: 'helpful', count: 0, reacted: false }, { type: 'inspiring', count: 0, reacted: false }, { type: 'question', count: 0, reacted: false }]} />
          </div>
        </Section>

        <Section id="f-comments" title="CommentThread — signed in as 'fixture-viewer' (id b)"><CommentThread devlogPostId="d" devlogAuthorId="a" currentUserId="b" comments={COMMENTS} /></Section>
        <Section id="f-comments-out" title="CommentThread — signed out, empty"><CommentThread devlogPostId="d" devlogAuthorId="a" currentUserId={null} comments={[]} /></Section>
        <Section id="f-comments-err" title="CommentThread — load failed"><CommentThread devlogPostId="d" devlogAuthorId="a" currentUserId={null} comments={[]} loadFailed /></Section>

        <Section id="f-states" title="States">
          <EmptyState kind="first-use" className="border-y-0 py-2" title="No devlogs yet" description="The first one starts this project's public record." />
          <ErrorState inline className="mt-4" title="We couldn't load the devlogs" description="This may be temporary. Reload the page to try again." />
        </Section>
      </div>
    </ShellFrame>
  )
}
