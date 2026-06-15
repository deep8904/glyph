import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { StudioManageClient } from '@/components/studios/StudioManageClient'

export default async function StudioManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: studio.name }]}
        action={<Link href={`/studios/${studio.slug}`} className="text-xs text-indigo-600 hover:underline">View public page →</Link>}
      />
      <PanelBody>
        <StudioManageClient
          studio={studio}
          userRole={member.role}
          members={(allMembers ?? []) as unknown as Member[]}
          studioProjects={(studioProjects ?? []) as unknown as SP[]}
          myProjects={myProjects ?? []}
        />
      </PanelBody>
    </PageShell>
  )
}
