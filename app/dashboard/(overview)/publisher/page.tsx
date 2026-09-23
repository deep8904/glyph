import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { PublisherDashboardClient, type ContactRow, type ShortlistRow, type ProjectInfo } from '@/components/publisher/PublisherDashboardClient'

type ProjRow = { id: string; title: string; slug: string; stage: string | null; username: string }
type RawContact = { id: string; message: string; status: string; created_at: string; projects: { title: string; slug: string | null } | null; profiles: { username: string; display_name: string | null } | null }

export default async function PublisherDashboardPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: publisher } = await supabase
    .from('publisher_accounts')
    .select('id, company_name, description, website, verified')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!publisher) {
    return (
      <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Publisher">
        <div className="max-w-xl">
          <h1 className="text-h1 font-semibold text-fg">Publisher tools</h1>
          <p className="mt-2 text-body text-fg-secondary">Publishers can keep a private shortlist of projects and, once verified by Glyph, contact developers about a specific public project.</p>
          <Button asChild variant="primary" className="mt-4"><Link href="/dashboard/publisher/register">Register as a publisher</Link></Button>
        </div>
      </AppShell>
    )
  }

  const [{ data: shortlists }, { data: contacts }] = await Promise.all([
    supabase.from('publisher_shortlists').select('id, name, items, created_at').eq('publisher_id', publisher.id).order('created_at', { ascending: false }).returns<ShortlistRow[]>(),
    supabase
      .from('publisher_contacts')
      .select('id, message, status, created_at, projects!project_id(title, slug), profiles!developer_id(username, display_name)')
      .eq('publisher_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<RawContact[]>(),
  ])

  const ids = Array.from(new Set((shortlists ?? []).flatMap((s) => (Array.isArray(s.items) ? s.items : []))))
  // Only projects that are still public resolve; anything else is shown as "no longer public".
  const { data: projRows } = ids.length
    ? await supabase.from('discoverable_projects').select('id, title, slug, stage, username').in('id', ids).returns<ProjRow[]>()
    : { data: [] as ProjRow[] }
  const lookup: Record<string, ProjectInfo> = Object.fromEntries((projRows ?? []).map((p) => [p.id, { title: p.title, slug: p.slug, username: p.username, stage: p.stage }]))

  const contactRows: ContactRow[] = (contacts ?? []).map((c) => ({
    id: c.id, message: c.message, status: c.status, createdAt: c.created_at,
    projectTitle: c.projects?.title ?? null,
    projectHref: c.projects?.slug && c.profiles ? `/p/${c.profiles.username}/${c.projects.slug}` : null,
    developerName: c.profiles?.display_name ?? c.profiles?.username ?? 'Developer',
    developerUsername: c.profiles?.username ?? null,
  }))

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Publisher">
      <PublisherDashboardClient publisher={publisher} shortlists={shortlists ?? []} projectLookup={lookup} contacts={contactRows} />
    </AppShell>
  )
}
