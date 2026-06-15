import { NextRequest, NextResponse } from 'next/server'

// Stripe webhook. Requires stripe npm package + STRIPE_WEBHOOK_SECRET + STRIPE_SECRET_KEY.
// Install: npm install stripe
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeWebhookSecret || !stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  // Dynamic import so build succeeds without stripe installed (stripe is an optional peer dep)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: { type: string; data: { object: Record<string, any> } }
  try {
    // This will throw at runtime if stripe is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe')
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' })
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const plan = String(sub.items?.data?.[0]?.price?.product ?? '').includes('team') ? 'team' : 'pro'
        await supabase.from('subscriptions').upsert(
          {
            stripe_subscription_id: String(sub.id),
            plan,
            status: String(sub.status),
            current_period_end: new Date(Number(sub.current_period_end) * 1000).toISOString(),
            user_id: sub.metadata?.user_id ?? null,
            studio_id: sub.metadata?.studio_id ?? null,
          },
          { onConflict: 'stripe_subscription_id' }
        )
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', String(sub.id))
        break
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        if (pi.metadata?.entity_type && pi.metadata?.entity_id && pi.metadata?.payer_id) {
          const days = parseInt(String(pi.metadata.days ?? '30'), 10)
          const endsAt = new Date()
          endsAt.setDate(endsAt.getDate() + days)
          await supabase.from('featured_listings').insert({
            entity_type: String(pi.metadata.entity_type),
            entity_id: String(pi.metadata.entity_id),
            payer_id: String(pi.metadata.payer_id),
            ends_at: endsAt.toISOString(),
            amount_cents: Number(pi.amount),
            stripe_payment_intent_id: String(pi.id),
          })
        }
        break
      }
    }
  } catch {
    return NextResponse.json({ error: 'Failed to process webhook event' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
