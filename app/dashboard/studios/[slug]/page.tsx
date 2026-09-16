import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { StudioManageClient } from '@/components/studios/StudioManageClient'

export default async function StudioManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: studio } = await supabase.from('studios').select('*').eq('slug', slug).maybeSingle()
  if (!studio) notFound()

  const { data: member } = await supabase
    .from('studio_members')
    .select('role')
    .eq('studio_id', studio.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/dashboard')

  const { data: allMembers } = await supabase
    .from('studio_members')
    .select('id, role, profiles!user_id(username, display_name, avatar_url)')
    .eq('studio_id', studio.id)

  const { data: studioProjects } = await supabase
    .from('studio_projects')
    .select('project_id, projects!project_id(id, title, slug)')
    .eq('studio_id', studio.id)

  const { data: myProjects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('owner_id', user.id)
    .order('title')

  type Member = { id: string; role: string; profiles: { username: string; display_name: string | null; avatar_url: string | null } | null }
  type SP = { project_id: string; projects: { id: string; title: string; slug: string | null } | null }

  return (
    <AppShell
      displayName={displayName}
      email={email}
      headerLabel={studio.name}
      headerAction={<Link href={`/studios/${studio.slug}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View public page →</Link>}
    >
      <StudioManageClient
        studio={studio}
        userRole={member.role}
        members={(allMembers ?? []) as unknown as Member[]}
        studioProjects={(studioProjects ?? []) as unknown as SP[]}
        myProjects={myProjects ?? []}
      />
    </AppShell>
  )
}
