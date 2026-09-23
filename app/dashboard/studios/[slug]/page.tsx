import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { StudioManageClient, type ManageInvitation, type ManageMember, type ManageProject } from '@/components/studios/StudioManageClient'

type MemberRow = { user_id: string; role: 'owner' | 'admin' | 'member'; created_at: string; profiles: { username: string; display_name: string | null } | null }
type InviteRow = { id: string; role: string; created_at: string; expires_at: string; profiles: { username: string; display_name: string | null } | null }
type ProjectRow = { project_id: string; projects: { id: string; title: string; owner_id: string; visibility: string } | null }

const RANK = { owner: 0, admin: 1, member: 2 } as const

export default async function StudioManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: studio } = await supabase
    .from('studios')
    .select('id, slug, name, description, website, location, size')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  if (!studio) notFound()

  const { data: me } = await supabase.from('studio_members').select('role').eq('studio_id', studio.id).eq('user_id', user.id).maybeSingle()
  if (!me) redirect('/dashboard/studios')

  const isManager = me.role === 'owner' || me.role === 'admin'
  const [membersRes, invitesRes, projectsRes, myProjectsRes] = await Promise.all([
    supabase.from('studio_members').select('user_id, role, created_at, profiles!user_id(username, display_name)').eq('studio_id', studio.id).returns<MemberRow[]>(),
    isManager
      ? supabase.from('studio_invitations').select('id, role, created_at, expires_at, profiles!invitee_id(username, display_name)').eq('studio_id', studio.id).eq('status', 'pending').order('created_at', { ascending: false }).returns<InviteRow[]>()
      : Promise.resolve({ data: [] as InviteRow[] }),
    supabase.from('studio_projects').select('project_id, projects!project_id(id, title, owner_id, visibility)').eq('studio_id', studio.id).returns<ProjectRow[]>(),
    supabase.from('projects').select('id, title').eq('owner_id', user.id).order('title'),
  ])

  const members: ManageMember[] = (membersRes.data ?? [])
    .filter((m) => m.profiles)
    .map((m) => ({ userId: m.user_id, role: m.role, username: m.profiles!.username, displayName: m.profiles!.display_name, joinedAt: m.created_at }))
    .sort((a, b) => RANK[a.role] - RANK[b.role] || a.joinedAt.localeCompare(b.joinedAt))

  const nowMs = new Date().getTime()
  const invitations: ManageInvitation[] = (invitesRes.data ?? [])
    .filter((i) => i.profiles)
    .map((i) => ({ id: i.id, inviteeUsername: i.profiles!.username, inviteeName: i.profiles!.display_name, role: i.role, createdAt: i.created_at, expiresAt: i.expires_at, expired: new Date(i.expires_at).getTime() <= nowMs }))

  // A private project's title is hidden by RLS from everyone but its creator; show a neutral label instead of a blank.
  const studioProjects: ManageProject[] = (projectsRes.data ?? []).map((p) => ({
    projectId: p.project_id,
    title: p.projects?.title ?? 'A private project',
    ownerId: p.projects?.owner_id ?? '',
    visibility: p.projects?.visibility ?? 'private',
  }))

  return (
    <AppShell
      displayName={displayName}
      email={email}
      nav={nav}
      headerLabel={studio.name}
      headerAction={<Link href={`/studios/${studio.slug}`} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">View public page</Link>}
    >
      <div className="max-w-3xl">
        <Link href="/dashboard/studios" className="inline-flex min-h-11 items-center text-body text-fg-muted hover:text-fg">← Your studios</Link>
        <h1 className="mt-1 mb-6 text-xl font-medium tracking-tight text-fg [overflow-wrap:anywhere]">Manage {studio.name}</h1>
        <StudioManageClient
          studio={studio}
          viewerRole={me.role}
          currentUserId={user.id}
          members={members}
          invitations={invitations}
          studioProjects={studioProjects}
          myProjects={myProjectsRes.data ?? []}
        />
      </div>
    </AppShell>
  )
}
