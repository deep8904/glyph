import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GitBranch, Gamepad2, X, Globe, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import {
  labelFor,
  ROLES,
  ENGINES,
  EXPERIENCE_LEVELS,
  PROJECT_STAGES,
  type Profile,
  type Project,
} from '@/lib/supabase/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle<Profile>()

  if (!profile) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('is_primary', true)
    .maybeSingle<Project>()

  const name = profile.display_name || profile.username
  const role = labelFor(ROLES, profile.primary_role)
  const engine = labelFor(ENGINES, profile.primary_engine)
  const experience = labelFor(EXPERIENCE_LEVELS, profile.experience_level)
  const isOpen = profile.collaboration_status === 'open'

  const socials = [
    { url: profile.github_url, label: 'GitHub', Icon: GitBranch },
    { url: profile.itchio_url, label: 'itch.io', Icon: Gamepad2 },
    { url: profile.twitter_url, label: 'Twitter / X', Icon: X },
    { url: profile.website_url, label: 'Website', Icon: Globe },
  ].filter((s) => s.url)

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow overflow-hidden flex flex-col border border-white relative">
          {/* Top bar */}
          <div className="flex items-center justify-between px-8 py-6 md:px-10 border-b border-gray-100/50">
            <Link href="/" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Developer Profile
            </span>
          </div>

          <div className="px-8 md:px-12 py-10 md:py-12 space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 font-mono text-2xl font-semibold text-indigo-600">
                  {initials(name)}
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-3xl font-medium tracking-tight text-gray-900">{name}</h1>
                <p className="font-mono text-sm text-gray-500">@{profile.username}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {profile.location && (
                    <span className="text-sm text-gray-500">{profile.location}</span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider ${
                      isOpen ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    {isOpen ? 'Open to Collaborate' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-base leading-relaxed text-gray-600 max-w-xl">{profile.bio}</p>
            )}

            {/* Identity badges */}
            {(role || engine || experience) && (
              <div className="flex flex-wrap gap-2">
                {role && <Badge variant="muted">{role}</Badge>}
                {engine && <Badge variant="muted">{engine}</Badge>}
                {experience && <Badge variant="muted">{experience}</Badge>}
              </div>
            )}

            {/* Social links */}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socials.map(({ url, label, Icon }) => (
                  <a
                    key={label}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-300"
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </a>
                ))}
              </div>
            )}

            {/* Current project */}
            <div className="space-y-4">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Current Project
              </h2>
              {project ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium tracking-tight text-gray-900">{project.title}</h3>
                      {project.short_description && (
                        <p className="mt-1 text-sm text-gray-500">{project.short_description}</p>
                      )}
                    </div>
                    {project.stage && (
                      <Badge variant="default">{labelFor(PROJECT_STAGES, project.stage)}</Badge>
                    )}
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600">
                    View Project <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/40 p-8 text-center">
                  <p className="text-sm text-gray-400">No projects yet.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="pt-4 border-t border-gray-100 font-mono text-[11px] uppercase tracking-widest text-gray-400">
              Member since {memberSince(profile.created_at)}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
