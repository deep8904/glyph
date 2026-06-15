import Link from 'next/link'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to get started.',
    features: [
      'Public developer profile',
      'Up to 3 projects',
      'Devlog (unlimited posts)',
      'Playtest requests',
      'Community board access',
      'Event RSVPs',
    ],
    cta: 'Get started',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For developers serious about building in public.',
    features: [
      'Everything in Free',
      'Unlimited projects',
      'Featured listing (1×/month)',
      'Publisher discovery opt-in',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Start Pro',
    href: '/dashboard/billing?plan=pro',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: 'per month',
    description: 'For studios collaborating as a team.',
    features: [
      'Everything in Pro',
      'Studio verified page',
      'Up to 10 team members',
      'Featured listings (3×/month)',
      'Publisher outreach inbox',
      'Team analytics dashboard',
    ],
    cta: 'Start Team',
    href: '/dashboard/billing?plan=team',
    highlighted: false,
  },
]

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Pricing' }]} />
      <PanelBody>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Glyph is free to use. Upgrade to unlock featured visibility and publisher tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-indigo-200 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                  : 'border-gray-100 bg-gray-50/50'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400 font-mono">/{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={user ? plan.href : '/signup'}
                className={`text-center rounded-full py-3 text-sm font-medium transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] font-mono text-gray-400 mt-8">
          All prices in USD. Cancel anytime. Powered by Stripe.
        </p>
      </PanelBody>
    </PageShell>
  )
}
