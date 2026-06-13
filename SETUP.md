# Glyph — Setup Guide

Stack: Next.js 16 (App Router), React 19, Tailwind v4, TypeScript, Supabase.

## 1. Clone & install
```bash
git clone https://github.com/deep8904/glyph.git
cd glyph
npm install
```

## 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in from **Supabase Dashboard → Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` — `https://<project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the publishable key (new `sb_publishable_…` format, or the legacy anon JWT).

> Note: this project standardizes on `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `..._ANON_KEY`). Keep that name.

## 3. Database migrations
SQL lives in `supabase/migrations/`. Apply `001_profiles.sql` then `002_projects.sql` by either:
- **Supabase SQL Editor:** paste each file's contents and run; or
- **Supabase CLI:** `supabase db push` (with the project linked).

This creates `profiles` and `projects` (RLS enabled: public read, owner-only write).

## 4. GitHub OAuth (these steps CANNOT be done in code)
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Homepage URL:** `http://localhost:3000` (and your production URL).
3. **Authorization callback URL** — must be the **Supabase** callback, not the app:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
4. Copy the Client ID/Secret into **Supabase Dashboard → Authentication → Providers → GitHub** and enable it.

## 5. Google OAuth (cannot be done in code)
1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web application**.
2. **Authorized JavaScript origins:** `http://localhost:3000` (and production domain).
3. **Authorized redirect URIs:** `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID/Secret into **Supabase → Authentication → Providers → Google** and enable it.

## 6. Supabase redirect allow-list (cannot be done in code)
**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, add:
```
http://localhost:3000/auth/callback
https://<your-production-domain>/auth/callback
```
Set **Site URL** to your primary origin. The app sends OAuth users back to `/auth/callback`, which exchanges the code and routes first-time users to `/onboarding`, returning users to `/dashboard`.

## 7. Email + password signup (cannot be done in code)
Email/password signup verifies the address with a 6-digit OTP **before** the account is usable. Configure:
1. **Supabase → Authentication → Providers → Email** — enable **Email**, and turn **Confirm email** ON. (With it off, `signUp` would auto-confirm and the OTP step is skipped.)
2. **Supabase → Authentication → Email Templates → "Confirm signup"** — the email must contain the **6-digit code**, so include the token in the template body, e.g.:
   ```
   Your Glyph verification code is: {{ .Token }}
   ```
   (The default template only includes `{{ .ConfirmationURL }}`. Add `{{ .Token }}` so the code can be entered in-app.)
3. Optional: tune **rate limits** under Authentication → Rate Limits. The app also enforces a 45s client-side resend cooldown.

## 8. Run
```bash
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Auth flow summary
- **OAuth (GitHub/Google):** `/login` or `/signup` → provider → `/auth/callback` → no profile? `/onboarding`, else `/dashboard`.
- **Login (email + password):** `signInWithPassword` → `/dashboard` (→ `/onboarding` if no profile yet). Wrong credentials show a single generic error.
- **Signup (email + password):** validate → `signUp` sends a 6-digit code → enter code → `verifyOtp({ type: 'signup' })` → **redirected to `/login` with a success message** (no auto-login). Resend has a 45s cooldown.
- Public profiles live at `/dev/<username>`.
