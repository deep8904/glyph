import { NextRequest, NextResponse } from 'next/server'

// Stripe webhook handler — no stripe npm package required.
// Verifies signatures using the Web Crypto API (available in all Next.js runtimes).
// Requires: STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = Object.fromEntries(
    sigHeader.split(',').map((p) => p.split('=') as [string, string])
  )
  const timestamp = parts['t']
  const sig = parts['v1']
  if (!timestamp || !sig) return false

  // Reject if timestamp is more than 5 minutes old
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return expected === sig
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sigHeader = req.headers.get('stripe-signature') ?? ''

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeWebhookSecret || !stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  if (!sigHeader) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const valid = await verifyStripeSignature(rawBody, sigHeader, stripeWebhookSecret)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: { type: string; data: { object: Record<string, any> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
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
