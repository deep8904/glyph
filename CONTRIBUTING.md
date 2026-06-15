# Contributing to Glyph

## Local Setup

See [SETUP.md](./SETUP.md) for the full environment setup guide.

## Development Workflow

1. Create a branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run `npx tsc --noEmit` — must be zero errors
4. Run `npm run build` — must succeed
5. Open a PR against `main`

## Code Conventions

### Server vs. Client

- Default to Server Components — no `'use client'` unless needed for interactivity
- All mutations are Server Actions in `app/actions/`
- Client components live in `components/` with `'use client'` at the top

### Forms

- Use `useTransition` + `startTransition` for server action calls (not `useFormState`)
- Always validate length and format in the server action, not just the client
- Strip dangerous unicode with `stripDangerousUnicode()` from `lib/utils`
- Return `{ error: string }` on failure, `{ success: true }` on success

### Database

- Never use raw SQL string interpolation — always use the Supabase client
- Every new table needs RLS enabled and at minimum a `SELECT` policy
- Add an `updated_at` trigger if the table has mutable rows

### Design System

- Use `PageShell` + `PanelHeader` + `PanelBody` for all pages
- Primary CTA: `rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700`
- Font: `font-sans` (Geist) for body, `font-mono` (JetBrains Mono) for labels/badges/code
- Do not add Tailwind config — all tokens live in `app/globals.css` under `@theme`

### TypeScript

- Avoid `any` — use `unknown` and narrow with type guards
- Cast Supabase join results with `as unknown as YourType` at the call site
- Zero TS errors before merge

### Accessibility

- All interactive elements must be keyboard-navigable
- Use `aria-label` on icon-only buttons
- Use `aria-live="polite"` on dynamic status messages
- Minimum touch target: 44×44px

### Security

- Never `console.log` sensitive data
- Never commit `.env.local` or any secret
- Input length caps in both client and server
- All admin actions must write to `audit_log`

## Pull Request Checklist

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → success
- [ ] New routes responsive at 375px, 768px, 1024px
- [ ] No `// TODO` or empty stub functions
- [ ] No `console.log` in production paths
- [ ] Security: input validated, length-capped, unicode-stripped
- [ ] RLS: new tables have policies
