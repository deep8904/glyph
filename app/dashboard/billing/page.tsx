import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'

export default async function BillingPage() {
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const currentPlan = subscription?.plan ?? 'free'

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Billing">
      <div className="max-w-xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Billing &amp; Plan</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your Glyph subscription.</p>

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
                title="Stripe portal coming soon"
              >
                Manage subscription
              </button>
              <span className="text-xs text-gray-400 self-center">Stripe customer portal</span>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">Upgrade to unlock featured listings, publisher tools, and more.</p>
              <Link
                href="/pricing"
                className="inline-flex rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300"
              >
                View plans
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Stripe Integration</p>
          <p className="text-sm text-gray-600">
            Payment processing is powered by Stripe. To complete billing setup, add{' '}
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">STRIPE_SECRET_KEY</span> and{' '}
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">STRIPE_WEBHOOK_SECRET</span>{' '}
            to your environment variables and configure your products in the Stripe dashboard.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
