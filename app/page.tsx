import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { exploreDevlogs, projectByUsernameSlug } from '@/lib/discovery/queries'
import { classifyLandingProof } from '@/lib/glyph/landingProof'
import { classifyLandingCta } from '@/lib/glyph/landingCta'
import { LandingTopNav } from '@/components/glyph/landing/LandingTopNav'
import { LandingBuildRecord } from '@/components/glyph/landing/LandingBuildRecord'
import { LandingFooter } from '@/components/glyph/landing/LandingFooter'

export const metadata = {
  title: 'Glyph° — the home base for a game while it’s being built',
  description: 'Glyph is where indie developers document real, in-progress work — devlogs, playtesting, and collaboration — before a game has a store page or an audience. Free for individual developers.',
  openGraph: {
    title: 'Glyph° — the home base for a game while it’s being built',
    description: 'Devlogs, playtesting, and collaboration for indie developers who are still building. Free for individual developers.',
  },
}

const WHAT_YOU_CAN_DO = [
  { term: 'Project', desc: 'A real page for the game as it exists today — its stage, what it is, and who’s making it. No cover art or trailer required to start.' },
  { term: 'Devlogs', desc: 'Dated posts about what actually changed. The record accumulates as you work — it is the build record, not a highlight reel.' },
  { term: 'Playtesting', desc: 'Ask for structured feedback from real players before you have a marketing budget to find them.' },
  { term: 'Collaboration', desc: 'Post or find the specific role you need — an artist, a composer, a second programmer — for one project, not a general job board.' },
  { term: 'Events & jams', desc: 'Game jams and local events, in one place with everything else you’re already tracking.' },
]

// This route makes exactly three requests: (1) auth.getUser() — is anyone signed in, for the nav
// and CTA destination only, no profile/admin/publisher/studio/notification reads; (2) the newest
// public devlog (exploreDevlogs, the discoverable_devlogs view); (3) that devlog's project, for its
// cover art, only when a devlog was found.
export default async function Home() {
  const supabase = await createClient()
  const [{ data: { user } }, devlogsPage] = await Promise.all([
    supabase.auth.getUser(),
    exploreDevlogs(supabase, { size: 6 }),
  ])
  const authed = !!user

  const devlog = devlogsPage.rows[0] ?? null
  const { project, error: projectError } = devlog
    ? await projectByUsernameSlug(supabase, devlog.username, devlog.project_slug)
    : { project: null, error: false }
  const proofState = classifyLandingProof(devlogsPage.error, devlog, projectError, !!project?.cover_url)
  const cta = classifyLandingCta(authed)

  return (
    <div className="gg-scope min-h-dvh bg-paper font-sans text-ink">
      <a href="#glyph-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-[10px] focus:bg-ember focus:px-4 focus:py-2 focus:text-small focus:font-medium focus:text-ink-on-ember">
        Skip to content
      </a>
      <LandingTopNav authed={authed} />

      <main id="glyph-main" tabIndex={-1} className="focus:outline-none">
        {/* Hero — text-led, no ambient gradient field. The one Ember action on the page lives here. */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h1 className="text-display font-semibold tracking-[-0.025em] text-ink text-balance">
            A home base for the game you haven&rsquo;t shipped yet.
          </h1>
          <p className="mt-5 max-w-xl text-body leading-relaxed text-ink-2">
            Glyph is where indie developers document real, in-progress work — devlogs, playtesting, and the people building alongside them — before there&rsquo;s a store page, a trailer, or an audience.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={cta.href} className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-ember px-5 text-small font-medium text-ink-on-ember outline-none transition-colors hover:bg-ember-press focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
              {cta.heroLabel}
            </Link>
            <Link href="/explore" className="inline-flex min-h-11 items-center text-small font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember">
              See what&rsquo;s already public
            </Link>
          </div>
          {!authed && <p className="mt-4 font-mono text-micro text-ink-3">Free for individual developers · No credit card</p>}
        </section>

        {/* The core idea, made concrete: a real build record, not a description of one. */}
        <section aria-labelledby="build-record" className="border-y border-hair bg-sunken/40">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
            <h2 id="build-record" className="text-h1 font-semibold tracking-[-0.02em] text-ink">What a build record looks like</h2>
            <p className="mt-2 max-w-xl text-body text-ink-2">One developer, one project, one dated post — the same object you&rsquo;d see if you followed this developer on Glyph today.</p>
            <div className="mt-8">
              <LandingBuildRecord state={proofState} devlog={devlog} project={project} />
            </div>
          </div>
        </section>

        {/* What a developer can do next — a plain definition list, not an icon-card grid or a
            numbered loop. */}
        <section aria-labelledby="what-you-can-do" className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 id="what-you-can-do" className="text-h1 font-semibold tracking-[-0.02em] text-ink">What you can do next</h2>
          <dl className="mt-8 divide-y divide-hair border-y border-hair">
            {WHAT_YOU_CAN_DO.map((item) => (
              <div key={item.term} className="grid gap-1 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="font-semibold text-ink">{item.term}</dt>
                <dd className="text-body text-ink-2">{item.desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Free — a plain statement, not a cinematic pricing band. */}
        <section aria-labelledby="free" className="border-t border-hair bg-sunken/40">
          <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-16">
            <h2 id="free" className="text-h1 font-semibold tracking-[-0.02em] text-ink text-balance">Free for as long as you&rsquo;re building.</h2>
            <p className="mx-auto mt-3 max-w-lg text-body leading-relaxed text-ink-2">
              There are no paid tiers or feature paywalls for individual developers in Glyph today. Create a profile, post devlogs, run playtests, and join events at no cost.
            </p>
            <div className="mt-6">
              <Link href={cta.href} className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-hair-strong px-5 text-small font-medium text-ink outline-none transition-colors hover:bg-panel focus-visible:ring-2 focus-visible:ring-ember">
                {cta.finalLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
