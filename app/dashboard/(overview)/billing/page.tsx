import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { Button } from '@/components/ui/Button'
import { MetadataBar } from '@/components/ui/MetadataBar'

const PLAN_LABEL: Record<string, string> = { pro: 'Pro', team: 'Team' }

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { user } = await getSidebarIdentity()
  const supabase = await createClient()
  const { plan: requestedPlan } = await searchParams

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const currentPlan = subscription?.plan ?? 'free'
  // Checkout isn't wired up yet (no Stripe product/price configuration in this environment) —
  // surface that honestly instead of silently ignoring the ?plan= a user arrived with from pricing.
  const wantedPlan = requestedPlan && PLAN_LABEL[requestedPlan] && !subscription ? requestedPlan : null

  return (
    <AppShell headerLabel="Billing">
      <div className="max-w-xl">
        <h1 className="text-h1 font-semibold text-fg">Billing &amp; plan</h1>
        <p className="mb-8 mt-1 text-small text-fg-secondary">Manage your Glyph subscription.</p>

        {wantedPlan && (
          <p role="status" className="mb-6 border-l-2 border-warning-line bg-warning-subtle px-4 py-3 text-small text-fg-secondary">
            <span className="font-medium text-fg">{PLAN_LABEL[wantedPlan]} checkout isn&apos;t available yet.</span> You&apos;re on the Free plan for now — we&apos;ll let you know when upgrades open up.
          </p>
        )}

        <div className="border-y border-line-subtle py-5">
          <MetadataBar
            items={[
              { label: 'Current plan', value: <span className="capitalize">{currentPlan}</span> },
              ...(subscription ? [{ label: 'Renews', value: new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }] : []),
            ]}
          />

          {subscription ? (
            <Button variant="secondary" disabled title="Subscription management isn't available yet" className="mt-5">Manage subscription</Button>
          ) : (
            <div className="mt-5">
              <p className="max-w-prose text-small text-fg-secondary">Glyph is free. Every core feature — profile, projects, devlogs, playtesting, events, and the collaboration board — is free for individual developers, with no paid tiers.</p>
              <Button asChild variant="secondary" className="mt-4"><Link href="/pricing">Read our pricing</Link></Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
