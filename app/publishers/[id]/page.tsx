import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { StatusText } from '@/components/workflow/StatusLabel'
import { ObjectHeader } from '@/components/object/ObjectHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { Section } from '@/components/ui/Section'
import { isHttpsUrl } from '@/lib/utils'

type Pub = { id: string; user_id: string; company_name: string; description: string | null; website: string | null; verified: boolean; profiles: { username: string; display_name: string | null } | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return { title: 'Publisher — Glyph' }
  const supabase = await createClient()
  const { data } = await supabase.from('publisher_accounts').select('company_name').eq('id', id).maybeSingle()
  return { title: data ? `${data.company_name} — Glyph` : 'Publisher — Glyph' }
}

/**
 * Public publisher page: identity only — who they are, what they say about
 * themselves, where to find them. No invented metrics, no project lists; the
 * account is visible to everyone only once an admin has verified it (RLS).
 */
export default async function PublisherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const supabase = await createClient()

  const { data: pub } = await supabase
    .from('publisher_accounts')
    .select('id, user_id, company_name, description, website, verified, profiles!user_id(username, display_name)')
    .eq('id', id)
    .maybeSingle<Pub>()
  if (!pub) notFound()

  const site = isHttpsUrl(pub.website) ? pub.website : null
  const rep = pub.profiles

  return (
    <DiscoveryFrame label="Publishers">
      {(viewer) => (
        <article className="max-w-3xl">
          <Link href="/publishers" className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← Publishers</Link>
          <ObjectHeader eyebrow="Publisher" title={pub.company_name} state={<StatusText label={pub.verified ? 'Verified publisher' : 'Not yet verified'} tone={pub.verified ? 'positive' : 'attention'} />} />
          {viewer?.id === pub.user_id && !pub.verified && (
            <p role="status" className="mt-6 rounded-media border border-warning-line bg-warning-subtle px-4 py-3 text-small text-warning">
              Only you can see this page until Glyph verifies your account. <Link href="/dashboard/publisher" className="font-medium underline">Publisher dashboard</Link>
            </p>
          )}

          <div className="mt-6 space-y-8">
            <Section id="pub-about" title="About">
              {pub.description ? (
                <p className="max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{pub.description}</p>
              ) : (
                <EmptyState kind="first-use" className="border-y-0 py-2" title={`${pub.company_name} has not added a description yet`} />
              )}
              <MetadataBar
                className="mt-4"
                items={[
                  { label: 'Website', value: site ? <a href={site} target="_blank" rel="noopener noreferrer" className="text-link underline-offset-2 hover:underline">{new URL(site).hostname}<span className="sr-only"> (opens in a new tab)</span></a> : null },
                  { label: 'On Glyph', value: rep ? <Link href={`/dev/${rep.username}`} className="text-link underline-offset-2 hover:underline">{rep.display_name ?? rep.username} (@{rep.username})</Link> : null },
                ]}
              />
            </Section>
            <Section id="pub-how" title="How publishers work with developers">
              <p className="max-w-prose text-body text-fg-secondary">A publisher&apos;s identity is public; its relationships are private. Publishers find games on project pages and can send a developer one message about a public project. Glyph has no direct messages, so developers reply on their own terms, and the project page remains the record of the game.</p>
            </Section>
          </div>
        </article>
      )}
    </DiscoveryFrame>
  )
}
