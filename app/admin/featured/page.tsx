import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { Star } from 'lucide-react'

export default async function AdminFeaturedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle()
  if (!adminUser) redirect('/')

  const { data: active } = await supabase
    .from('featured_listings')
    .select('id, entity_type, entity_id, ends_at, amount_cents, created_at, profiles!payer_id(username)')
    .gte('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
    .limit(50)

  type Listing = { id: string; entity_type: string; entity_id: string; ends_at: string; amount_cents: number; created_at: string; profiles: { username: string } | null }
  const typedListings = (active ?? []) as unknown as Listing[]

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Featured Listings' }]} />
      <PanelBody>
        {typedListings.length === 0 ? (
          <EmptyState
            icon={<Star className="h-8 w-8 text-gray-300" />}
            title="No active featured listings"
            description="No listings are currently featured."
          />
        ) : (
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Active Featured Listings ({typedListings.length})</h1>
            {typedListings.map((l) => (
              <div key={l.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-500">{l.entity_type}</span>
                    <span className="text-[10px] font-mono text-gray-400 truncate">{l.entity_id}</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    Paid by @{l.profiles?.username ?? '?'} · ${(l.amount_cents / 100).toFixed(2)} · expires {new Date(l.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
