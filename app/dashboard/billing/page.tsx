import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'

const PLAN_LABEL: Record<string, string> = { pro: 'Pro', team: 'Team' }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()
  const { plan: requestedPlan } = await searchParams

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const currentPlan = subscription?.plan ?? 'free'
  // Checkout isn't wired up yet (no Stripe product/price configuration in
  // this environment) — surface that honestly instead of silently ignoring
  // the ?plan= a user arrived with from the pricing page.
  const wantedPlan = requestedPlan && PLAN_LABEL[requestedPlan] && !subscription ? requestedPlan : null

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Billing">
      <div className="max-w-xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Billing &amp; Plan</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your Glyph subscription.</p>

        {wantedPlan && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 mb-6">
            <p className="text-sm text-amber-800">
              <span className="font-medium">{PLAN_LABEL[wantedPlan]} checkout isn&apos;t available yet.</span>{' '}
              You&apos;re on the Free plan for now — we&apos;ll let you know when upgrades open up.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Current Plan</p>
              <p className="text-lg font-medium text-gray-900 capitalize">{currentPlan}</p>
            </div>
            {subscription && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Renews</p>
                <p className="text-sm text-gray-700">
                  {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {subscription ? (
            <div className="flex gap-3">
              <button
                disabled
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                title="Subscription management isn't available yet"
              >
                Manage subscription
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">Paid plans aren&apos;t open yet. Every core feature — profile, projects, devlogs, playtesting, events, and the collaboration board — is free for individual developers.</p>
              <Link
                href="/pricing"
                className="inline-flex rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300"
              >
                View plans
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
