import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Globe, MapPin, Users, ShieldCheck, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Badge'
import { STUDIO_SIZES } from '@/lib/supabase/types'

const SIZE_LABELS = Object.fromEntries(STUDIO_SIZES.map((s) => [s.value, s.label]))

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: studio } = await supabase
    .from('studios')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!studio) notFound()

  const { data: members } = await supabase
    .from('studio_members')
    .select('role, profiles!user_id(username, display_name, avatar_url, primary_role)')
    .eq('studio_id', studio.id)
    .order('created_at', { ascending: true })
    .limit(20)

  const { data: studioProjects } = await supabase
    .from('studio_projects')
    .select('projects!project_id(id, title, slug, short_description, genre, stage, cover_image_url, owner_id, profiles!owner_id(username))')
    .eq('studio_id', studio.id)
    .limit(12)

  type Member = { role: string; profiles: { username: string; display_name: string | null; avatar_url: string | null; primary_role: string | null } | null }
  type SP = { projects: { id: string; title: string; slug: string | null; short_description: string | null; genre: string | null; stage: string | null; cover_image_url: string | null; profiles: { username: string } | null } | null }

  const typedMembers = (members ?? []) as unknown as Member[]
  const typedProjects = (studioProjects ?? []) as unknown as SP[]

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Studios', href: '/studios' }, { label: studio.name }]} />
      <PanelBody>
        {/* Studio header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
            {studio.logo_url ? (
              <img src={studio.logo_url} alt={studio.name} className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="text-2xl font-bold text-indigo-600">{studio.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{studio.name}</h1>
              {studio.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-mono text-indigo-600 uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] font-mono text-gray-400 mt-1">
              {studio.size && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{SIZE_LABELS[studio.size]}</span>}
              {studio.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{studio.location}</span>}
              {studio.founded_year && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Est. {studio.founded_year}</span>}
              {studio.website && (
                <a href={studio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  <Globe className="h-3 w-3" />{new URL(studio.website).hostname}
                </a>
              )}
            </div>
          </div>
        </div>

        {studio.description && (
          <div className="mb-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">About</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{studio.description}</p>
          </div>
        )}

        {typedProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Projects ({typedProjects.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {typedProjects.map((sp) => sp.projects && (
                <Link
                  key={sp.projects.id}
                  href={sp.projects.profiles?.username && sp.projects.slug ? `/p/${sp.projects.profiles.username}/${sp.projects.slug}` : '#'}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all p-4"
                >
                  <div className="flex items-start gap-3">
                    {sp.projects.cover_image_url ? (
                      <img src={sp.projects.cover_image_url} alt={sp.projects.title} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-400 font-mono">?</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{sp.projects.title}</p>
                      {sp.projects.short_description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{sp.projects.short_description}</p>}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {sp.projects.genre && <Badge size="sm" variant="secondary">{sp.projects.genre}</Badge>}
                        {sp.projects.stage && <Badge size="sm" variant="muted">{sp.projects.stage}</Badge>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {typedMembers.length > 0 && (
          <div>
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Team ({typedMembers.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {typedMembers.map((m, i) => m.profiles && (
                <Link
                  key={i}
                  href={`/dev/${m.profiles.username}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all p-4 text-center"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    {m.profiles.avatar_url ? (
                      <img src={m.profiles.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-600">
                        {(m.profiles.display_name ?? m.profiles.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {m.profiles.display_name ?? m.profiles.username}
                    </p>
                    {m.profiles.primary_role && <p className="text-[10px] font-mono text-gray-400 capitalize">{m.profiles.primary_role}</p>}
                    {m.role === 'owner' && <Badge size="sm" variant="secondary" className="mt-1">Owner</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
