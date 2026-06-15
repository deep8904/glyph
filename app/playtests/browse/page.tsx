import Link from 'next/link'
import { Monitor, Download, Key, Clock, Users, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Badge'

const BUILD_ICONS = { browser: Monitor, download: Download, steam_key: Key }
const BUILD_LABELS = { browser: 'Browser', download: 'Download', steam_key: 'Steam Key' }

type RequestRow = {
  id: string
  build_type: string
  platforms: string[]
  description: string
  focus_areas: string[]
  requested_testers: number
  current_testers: number
  created_at: string
  projects: { title: string; slug: string | null } | null
  profiles: { username: string; display_name: string | null } | null
}

export default async function PlaytestsBrowsePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('playtest_requests')
    .select('id, build_type, platforms, description, focus_areas, requested_testers, current_testers, created_at, projects!project_id(title, slug), profiles!author_id(username, display_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  const requests = (data ?? []) as unknown as RequestRow[]

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Playtests' }]}
        action={
          user ? (
            <Link href="/dashboard/playtests/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
              Request testers
            </Link>
          ) : null
        }
      />
      <PanelBody>
        <div className="mb-6">
          <p className="text-sm text-gray-500">Browse open playtest requests from indie developers. Try their games and leave structured feedback.</p>
        </div>
        {requests.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8 text-gray-300" />}
            title="No open playtests"
            description="Be the first to request testers for your game."
            action={
              user ? (
                <Link href="/dashboard/playtests/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
                  Request testers
                </Link>
              ) : (
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
                  Sign up to participate
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const BuildIcon = BUILD_ICONS[req.build_type as keyof typeof BUILD_ICONS] ?? Monitor
              const testers = req.current_testers
              const pct = Math.min(100, Math.round((testers / req.requested_testers) * 100))
              return (
                <Link
                  key={req.id}
                  href={`/playtests/${req.id}`}
                  className="block group rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-base font-medium tracking-tight text-gray-900">{req.projects?.title ?? 'Unnamed project'}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-gray-600">
                          <BuildIcon className="h-3 w-3" />
                          {BUILD_LABELS[req.build_type as keyof typeof BUILD_LABELS] ?? req.build_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{req.description}</p>
                      {req.focus_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {req.focus_areas.slice(0, 4).map((f) => (
                            <Badge key={f} variant="secondary" size="sm">{f}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-[11px] font-mono text-gray-400">
                          by {req.profiles?.display_name ?? req.profiles?.username ?? 'unknown'}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-medium text-gray-900">{testers}/{req.requested_testers}</div>
                      <div className="text-[10px] font-mono text-gray-400 mb-2">testers</div>
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
