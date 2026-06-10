'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Calendar } from 'lucide-react'
import type { Profile, Project } from '@/types/database'

type Tab = 'devlogs' | 'projects' | 'about'

function ProjectCard({ project }: { project: Pick<Project, 'id' | 'title' | 'slug' | 'stage' | 'cover_url' | 'is_public'> }) {
  const STAGE_COLOR: Record<string, string> = {
    prototype: 'bg-amber-500/15 text-amber-400',
    alpha:     'bg-blue-500/15 text-blue-400',
    beta:      'bg-purple-500/15 text-purple-400',
    released:  'bg-green-500/15 text-green-400',
  }

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block overflow-hidden rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface)] transition hover:border-[var(--color-glyph-border-hi)]"
    >
      <div className="aspect-video w-full bg-[var(--color-glyph-surface-2)]">
        {project.cover_url ? (
          <img src={project.cover_url} alt={project.title} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="font-mono text-xs text-[var(--color-glyph-text-3)]">No cover</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-sans text-sm font-medium text-[var(--color-glyph-text)] group-hover:text-[var(--color-glyph-orange)] transition">
          {project.title}
        </p>
        <span className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 font-mono text-[10px] ${STAGE_COLOR[project.stage] ?? 'bg-[var(--color-glyph-surface-3)] text-[var(--color-glyph-text-3)]'}`}>
          {project.stage}
        </span>
      </div>
    </Link>
  )
}

function AboutTab({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-6">
      {profile.bio && (
        <div>
          <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-glyph-text-3)]">Bio</h4>
          <p className="font-sans text-sm leading-relaxed text-[var(--color-glyph-text-2)]">{profile.bio}</p>
        </div>
      )}

      {(profile.engines?.length ?? 0) > 0 && (
        <div>
          <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-glyph-text-3)]">Engines</h4>
          <div className="flex flex-wrap gap-2">
            {profile.engines.map(e => (
              <span key={e} className="rounded-lg border border-[var(--color-glyph-border)] px-2.5 py-1 font-sans text-xs text-[var(--color-glyph-text-2)]">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {(profile.roles?.length ?? 0) > 0 && (
        <div>
          <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-glyph-text-3)]">Roles</h4>
          <div className="flex flex-wrap gap-2">
            {profile.roles.map(r => (
              <span key={r} className="rounded-lg border border-[var(--color-glyph-border)] px-2.5 py-1 font-sans text-xs text-[var(--color-glyph-text-2)]">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-glyph-text-3)]">Links</h4>
        <div className="space-y-1.5">
          {profile.website_url && (
            <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-sans text-sm text-[var(--color-glyph-orange)] hover:underline">
              <ExternalLink size={12} /> Website
            </a>
          )}
          {profile.github_handle && (
            <a href={`https://github.com/${profile.github_handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-sans text-sm text-[var(--color-glyph-text-2)] hover:text-[var(--color-glyph-text)]">
              <ExternalLink size={12} /> github.com/{profile.github_handle}
            </a>
          )}
          {profile.itch_handle && (
            <a href={`https://${profile.itch_handle}.itch.io`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-sans text-sm text-[var(--color-glyph-text-2)] hover:text-[var(--color-glyph-text)]">
              <ExternalLink size={12} /> {profile.itch_handle}.itch.io
            </a>
          )}
          {profile.twitter_handle && (
            <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-sans text-sm text-[var(--color-glyph-text-2)] hover:text-[var(--color-glyph-text)]">
              <ExternalLink size={12} /> @{profile.twitter_handle}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-glyph-text-3)]">
        <Calendar size={11} />
        Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}

export function ProfileTabs({
  profile,
  projects,
}: {
  profile: Profile
  projects: Pick<Project, 'id' | 'title' | 'slug' | 'stage' | 'cover_url' | 'is_public'>[]
}) {
  const [active, setActive] = useState<Tab>('devlogs')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'devlogs',  label: 'Devlogs' },
    { id: 'projects', label: `Projects (${projects.length})` },
    { id: 'about',    label: 'About' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-glyph-border)]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative px-4 py-3 font-sans text-sm transition ${
              active === tab.id
                ? 'text-[var(--color-glyph-text)]'
                : 'text-[var(--color-glyph-text-3)] hover:text-[var(--color-glyph-text-2)]'
            }`}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-[var(--color-glyph-orange)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {active === 'devlogs' && (
          <div className="rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface)] p-6 text-center">
            <p className="font-sans text-sm text-[var(--color-glyph-text-3)]">
              Devlogs coming in Stage 3.
            </p>
          </div>
        )}

        {active === 'projects' && (
          projects.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface)] p-6 text-center">
              <p className="font-sans text-sm text-[var(--color-glyph-text-3)]">No public projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {projects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )
        )}

        {active === 'about' && <AboutTab profile={profile} />}
      </div>
    </div>
  )
}
