import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { Building2 } from 'lucide-react'

export default async function PublishersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: publishers } = await supabase
    .from('publisher_accounts')
    .select('id, company_name, verified, created_at, profiles!user_id(username, display_name, avatar_url)')
    .eq('verified', true)
    .order('created_at', { ascending: false })
    .limit(50)

  type Publisher = { id: string; company_name: string; verified: boolean; created_at: string; profiles: { username: string; display_name: string | null; avatar_url: string | null } | null }
  const typedPublishers = (publishers ?? []) as unknown as Publisher[]

  return (
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Publishers' }]}
        action={
          user ? (
            <Link href="/dashboard/publisher" className="text-xs text-indigo-600 hover:underline">My publisher account →</Link>
          ) : null
        }
      />
      <PanelBody>
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-1">Publisher Directory</h1>
          <p className="text-sm text-gray-500">Verified publishers looking to connect with indie game developers.</p>
        </div>

        {typedPublishers.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-gray-300" />}
            title="No publishers yet"
            description="Publishers will appear here once verified by the Glyph team."
            action={
              user
                ? <Link href="/dashboard/publisher" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5">Register as Publisher</Link>
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {typedPublishers.map((pub) => (
              <div key={pub.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{pub.company_name}</p>
                    {pub.profiles && (
                      <Link href={`/dev/${pub.profiles.username}`} className="text-[10px] font-mono text-indigo-500 hover:underline">
                        @{pub.profiles.username}
                      </Link>
                    )}
                  </div>
                </div>
                {user && (
                  <Link
                    href={`/dashboard/publisher/contact/${pub.id}`}
                    className="block text-center rounded-full border border-indigo-200 px-4 py-2 text-xs font-mono text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    View Profile
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
