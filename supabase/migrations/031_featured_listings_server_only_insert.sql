-- Featured listings: remove client-side INSERT.
--
-- Finding: policy "featured_listings_insert" (013) is WITH CHECK
-- (auth.uid() = payer_id), so any signed-in user could insert a row with an
-- arbitrary entity_id, ends_at and a made-up stripe_payment_intent_id, i.e.
-- forge a paid featured listing without paying.
--
-- Fix: drop the policy. With RLS enabled and no INSERT policy, the
-- authenticated and anon roles cannot insert. The Stripe webhook
-- (app/api/webhooks/stripe/route.ts) is the only writer and uses the
-- service-role client, which bypasses RLS.
--
-- featured_listings_read (public SELECT) is intentionally left unchanged.

drop policy if exists "featured_listings_insert" on public.featured_listings;
