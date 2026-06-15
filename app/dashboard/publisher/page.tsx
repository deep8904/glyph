import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { PublisherDashboardClient } from '@/components/publisher/PublisherDashboardClient'
import { Building2 } from 'lucide-react'

export default async function PublisherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: publisher } = await supabase
    .from('publisher_accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!publisher) {
    return (
      <PageShell>
        <PanelHeader breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Publisher' }]} />
        <PanelBody>
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-gray-300" />}
            title="No publisher account"
            description="Register as a publisher to discover games and contact developers."
            action={
              <Link href="/dashboard/publisher/register" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5">
                Register as Publisher
              </Link>
            }
          />
        </PanelBody>
      </PageShell>
    )
  }

  const { data: shortlists } = await supabase
    .from('publisher_shortlists')
    .select('id, name, items, created_at')
    .eq('publisher_id', publisher.id)
    .order('created_at', { ascending: false })

  const { data: contacts } = await supabase
    .from('publisher_contacts')
    .select('id, message, status, created_at, profiles!developer_id(username, display_name)')
    .eq('publisher_id', publisher.id)
    .order('created_at', { ascending: false })
    .limit(20)

  type Contact = { id: string; message: string; status: string; created_at: string; profiles: { username: string; display_name: string | null } | null }

  return (
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Publisher' }]}
        action={!publisher.verified ? <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider">Pending verification</span> : <span className="text-[10px] font-mono text-green-600 uppercase tracking-wider">Verified</span>}
      />
      <PanelBody>
        <PublisherDashboardClient
          publisher={publisher}
          shortlists={shortlists ?? []}
          contacts={(contacts ?? []) as unknown as Contact[]}
        />
      </PanelBody>
    </PageShell>
  )
}
