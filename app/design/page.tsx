import { notFound } from 'next/navigation'
import { Compass, Inbox, Lock, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { LoadingRegion, Skeleton, SkeletonRow, SkeletonText } from '@/components/ui/Skeleton'
import { DesignInteractive } from './DesignInteractive'

export const metadata = { title: 'Design system — Glyph', robots: { index: false, follow: false } }

// Internal reference only: not served in production builds.
// Neuform foundation (docs/design/glyph-neuform-redesign-plan.md §3) — R1.
const SURFACES = ['canvas', 'surface', 'surface-muted', 'surface-elevated'] as const
const INVERSE_SURFACES = ['surface-inverse', 'surface-inverse-raised'] as const
const LINES = ['line', 'line-subtle', 'line-strong'] as const
const TEXT = [['fg', 'text-fg'], ['fg-secondary', 'text-fg-secondary'], ['fg-muted', 'text-fg-muted']] as const
const STATUS = ['accent', 'success', 'warning', 'danger', 'info'] as const
const TYPE = [
  ['Display', 'text-display font-semibold', '44 / 1.1 · 600 — Landing hero, largest Identity anchors only'],
  ['H1', 'text-h1 font-semibold', '30 / 1.2 · 600 — page-level heading'],
  ['H2', 'text-h2 font-semibold', '24 / 1.25 · 600 — section heading'],
  ['H3', 'text-h3 font-semibold', '18 / 1.3 · 600 — object title (row/card level)'],
  ['Body', 'text-body', '16 / 1.6 · 400'],
  ['Small', 'text-small', '14 / 1.45 · 400'],
  ['Micro', 'text-micro font-medium font-mono', '12 / 1.35 · 500 — mono, metadata/dates/stage'],
] as const
const SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
const MOTION = [
  ['Micro interaction', '140ms', 'var(--motion-micro)', 'hover/pressed color change'],
  ['Control', '160ms', 'var(--motion-control)', 'button, tab, toggle transition'],
  ['Drawer / dialog', '200ms', 'var(--motion-drawer)', 'sheet slide, dialog fade'],
  ['Page / major reveal', '350ms', 'var(--motion-page)', 'hero entrance, staggered list'],
] as const

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-8">
      <h2 id={id} className="mb-4 text-h2 font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}

export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div className="min-h-screen bg-canvas font-sans text-fg">
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
        <header>
          <h1 className="text-h1 font-semibold">Glyph design system</h1>
          <p className="mt-1 max-w-prose text-small text-fg-secondary">
            Living reference for tokens and primitives — Neuform foundation, R1 (<code className="font-mono text-fg-muted">docs/design/glyph-neuform-redesign-plan.md</code>). Development only. Everything here is the real component, not a mock-up; no product data is shown.
          </p>
        </header>

        <Block id="d-color" title="Color tokens">
          <p className="mb-3 text-small text-fg-secondary">One accent (orange), used for the single primary action per view — not a background fill. Slate is a deliberate secondary-text and inverse-surface tool, not decoration.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SURFACES.map((n) => (
              <div key={n} className="rounded-media border border-line">
                <div className={`h-12 rounded-t-media bg-${n}`} style={{ backgroundColor: `var(--${n})` }} />
                <p className="px-2 py-1.5 font-mono text-micro text-fg-secondary">{n}</p>
              </div>
            ))}
            {LINES.map((n) => (
              <div key={n} className="rounded-media border border-line">
                <div className="h-12 rounded-t-media" style={{ backgroundColor: `var(--${n})` }} />
                <p className="px-2 py-1.5 font-mono text-micro text-fg-secondary">{n}</p>
              </div>
            ))}
            {STATUS.map((n) => (
              <div key={n} className="rounded-media border border-line">
                <div className="flex h-12 rounded-t-media" >
                  <span className="flex-1 rounded-tl-media" style={{ backgroundColor: `var(--${n})` }} />
                  <span className="flex-1 rounded-tr-media" style={{ backgroundColor: `var(--${n}-subtle)` }} />
                </div>
                <p className="px-2 py-1.5 font-mono text-micro text-fg-secondary">{n} / subtle</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            {TEXT.map(([n, cls]) => (
              <p key={n} className={`${cls} text-body`}>{n} — The quick brown fox jumps over the lazy dog</p>
            ))}
            <p className="text-body text-link">link — <span className="underline underline-offset-2">Read the devlog</span></p>
          </div>

          <p className="mb-3 mt-6 text-small text-fg-secondary">Slate surfaces — reserved for Operate-mode density and inverse moments, not a page background.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {INVERSE_SURFACES.map((n) => (
              <div key={n} className="overflow-hidden rounded-media border border-line">
                <div className="flex h-16 flex-col justify-end p-2" style={{ backgroundColor: `var(--${n})` }}>
                  <span className="text-micro text-fg-on-inverse">Aa</span>
                  <span className="text-micro" style={{ color: 'var(--fg-on-inverse-secondary)' }}>secondary</span>
                </div>
                <p className="bg-surface px-2 py-1.5 font-mono text-micro text-fg-secondary">{n}</p>
              </div>
            ))}
            <div className="flex h-[88px] flex-col items-start justify-center gap-1 rounded-media border border-line bg-accent-secondary px-3">
              <span className="font-mono text-micro text-fg">accent-secondary</span>
            </div>
          </div>
        </Block>

        <Block id="d-type" title="Typography">
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {TYPE.map(([n, cls, spec]) => (
              <div key={n} className="flex items-baseline justify-between gap-4 py-3">
                <p className={cls}>{n}: Devlog #14 — Rebuilding the combat loop</p>
                <span className="shrink-0 font-mono text-micro text-fg-muted">{spec}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-small text-fg-secondary">
            Sans: Inter. Mono (build versions, timestamps in dense lists, code): <span className="font-mono text-fg">v0.14.2-alpha · 2026-09-21 · @username</span>
          </p>
        </Block>

        <Block id="d-space" title="Spacing, radius, elevation">
          <div className="flex flex-wrap items-end gap-3">
            {SPACING.map((n) => (
              <div key={n} className="text-center">
                <div className="bg-accent-subtle" style={{ width: n, height: n, outline: '1px solid var(--accent-line)' }} />
                <span className="mt-1 block font-mono text-micro text-fg-muted">{n}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-small text-fg-secondary">Pill is reserved for badges/status chips and semantic CTAs — it is not the default control or container shape (see §4 of the redesign plan).</p>
          <div className="mt-3 flex flex-wrap gap-4">
            {[['control 8', 'rounded-control'], ['media 8', 'rounded-media'], ['panel 16', 'rounded-panel'], ['table 16', 'rounded-table'], ['pill ∞', 'rounded-pill']].map(([n, c]) => (
              <div key={n} className={`flex h-14 w-24 items-center justify-center border border-line-strong bg-surface font-mono text-micro text-fg-secondary ${c}`}>{n}</div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex h-14 w-24 items-center justify-center rounded-panel bg-surface-elevated font-mono text-micro text-fg-secondary shadow-raised">raised</div>
            <div className="flex h-14 w-24 items-center justify-center rounded-media bg-surface-elevated font-mono text-micro text-fg-secondary shadow-popover">popover</div>
            <div className="flex h-14 w-24 items-center justify-center rounded-panel bg-surface-elevated font-mono text-micro text-fg-secondary shadow-dialog">dialog</div>
          </div>
        </Block>

        <Block id="d-buttons" title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
            <Button variant="primary" loading>Saving</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg" variant="primary">Large</Button>
            <Button asChild variant="secondary"><a href="#d-buttons">As link</a></Button>
          </div>
          <p className="mb-2 mt-6 text-small text-fg-secondary">Hover / focus / pressed — tab to a button to see the focus ring; click-and-hold to see the pressed state.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" className="hover:bg-accent-hover active:scale-[0.98]">Try hover + press</Button>
            <button type="button" className="rounded-control border border-line-strong bg-surface px-4 py-2 text-small font-medium text-fg outline-none transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]" style={{ outlineColor: 'var(--focus-ring)' }}>
              Tab to me
            </button>
          </div>
        </Block>

        <Block id="d-forms" title="Form fields">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project title" hint="Shown on your profile and in search." required>{(p) => <Input {...p} defaultValue="Tidewalker" />}</Field>
            <Field label="Engine" hint="Pick the closest match.">{(p) => (
              <Select {...p} defaultValue="godot"><option value="godot">Godot</option><option value="unity">Unity</option><option value="unreal">Unreal</option></Select>
            )}</Field>
            <Field label="Website" error="Enter a full https:// URL.">{(p) => <Input {...p} defaultValue="example.com" />}</Field>
            <Field label="Locked field">{(p) => <Input {...p} defaultValue="read-only value" readOnly />}</Field>
            <Field label="Disabled">{(p) => <Input {...p} defaultValue="disabled" disabled />}</Field>
            <Field className="sm:col-span-2" label="Pitch">{(p) => <Textarea {...p} placeholder="What is this game, in two sentences?" />}</Field>
          </div>
        </Block>

        <Block id="d-badge" title="Badges, avatars, metadata">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Neutral</Badge><Badge tone="accent">Accent</Badge><Badge tone="success">Open</Badge>
            <Badge tone="warning">Awaiting review</Badge><Badge tone="danger">Rejected</Badge><Badge tone="info">Info</Badge>
            <Badge mono>v0.14.2</Badge>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {(['sm', 'md', 'lg', 'xl'] as const).map((s) => <Avatar key={s} size={s} name="Mara Lindqvist" />)}
            <span className="text-small text-fg-secondary">Initials fallback (no image URL)</span>
          </div>
          <MetadataBar className="mt-4" items={[
            { label: 'Stage', value: 'Alpha' }, { label: 'Engine', value: 'Godot 4.3' },
            { label: 'Build', value: 'v0.14.2', mono: true }, { label: 'Updated', value: '2026-09-21', mono: true }, { label: 'Empty', value: null },
          ]} />
          <div className="mt-6"><SectionHeader title="Section header" count={3} action={<Button variant="link" size="sm">View all</Button>} /></div>
        </Block>

        <Block id="d-states" title="Empty, loading, error">
          <div className="grid gap-6 md:grid-cols-2">
            <EmptyState kind="first-use" icon={Inbox} title="No projects yet" description="A project is where your devlogs live. Create one to start documenting what you build." action={<Button variant="primary" size="sm">Create a project</Button>} />
            <EmptyState kind="cleared" icon={Inbox} title="No open playtest requests" description="You have answered every request. New ones will show up here." />
            <EmptyState kind="no-results" icon={Search} title="No results for “tidewalker”" description="Check the spelling or remove a filter." action={<Button variant="secondary" size="sm">Clear filters</Button>} />
            <EmptyState kind="restricted" icon={Lock} title="This project is private" description="Only its owner can see it." />
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <LoadingRegion label="Loading projects"><div className="divide-y divide-line-subtle border-y border-line-subtle"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div></LoadingRegion>
            <div className="space-y-3"><Skeleton className="h-6 w-1/3" /><SkeletonText lines={4} /></div>
          </div>
          <div className="mt-6 space-y-3">
            <ErrorState title="We couldn't load your projects" description="This may be temporary. Try again." retryHref="#d-states" />
            <ErrorState inline title="Could not save" description="Your changes are still in the form." />
          </div>
        </Block>

        <Block id="d-interactive" title="Overlays and navigation">
          <DesignInteractive />
        </Block>

        <Block id="d-motion" title="Motion timing">
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {MOTION.map(([name, ms, token, usage]) => (
              <div key={name} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-body text-fg">{name}</p>
                  <p className="text-small text-fg-muted">{usage}</p>
                </div>
                <span className="shrink-0 font-mono text-micro text-fg-secondary">{token} · {ms}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-small text-fg-secondary">All transitions respect <code className="font-mono text-fg">prefers-reduced-motion</code> — durations collapse to near-zero automatically (see the global rule in <code className="font-mono text-fg">app/globals.css</code>).</p>
        </Block>

        <p className="flex items-center gap-2 border-t border-line pt-6 text-micro text-fg-muted"><Compass aria-hidden className="size-3.5" strokeWidth={1.75} /> Icons: lucide-react, stroke 1.75.</p>
      </main>
    </div>
  )
}
