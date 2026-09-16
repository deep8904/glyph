import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { PublisherDashboardClient } from '@/components/publisher/PublisherDashboardClient'
import { Building2 } from 'lucide-react'

export default async function PublisherDashboardPage() {
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: publisher } = await supabase
    .from('publisher_accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!publisher) {
    return (
      <AppShell displayName={displayName} email={email} headerLabel="Publisher">
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-display font-medium tracking-tight text-gray-900 mb-2">No publisher account</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">Register as a publisher to discover games and contact developers.</p>
          <Link href="/dashboard/publisher/register" className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300">
            Register as Publisher
          </Link>
        </div>
      </AppShell>
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
    <AppShell
      displayName={displayName}
      email={email}
      headerLabel="Publisher"
      headerAction={
        !publisher.verified ? (
          <span className="text-xs font-medium text-amber-600">Pending verification</span>
        ) : (
          <span className="text-xs font-medium text-green-600">Verified</span>
        )
      }
    >
      <PublisherDashboardClient
        publisher={publisher}
        shortlists={shortlists ?? []}
        contacts={(contacts ?? []) as unknown as Contact[]}
      />
    </AppShell>
  )
}
