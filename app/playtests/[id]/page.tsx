import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Monitor, Download, Key, Users, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Badge'
import { RequestSessionButton } from '@/components/playtests/RequestSessionButton'

const BUILD_ICONS = { browser: Monitor, download: Download, steam_key: Key }
const BUILD_LABELS = { browser: 'Browser / Web', download: 'Download', steam_key: 'Steam Key' }

export default async function PlaytestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: req } = await supabase
    .from('playtest_requests')
    .select('*, projects!project_id(id, title, slug, short_description), profiles!author_id(username, display_name)')
    .eq('id', id)
    .maybeSingle()

  if (!req) notFound()

  type Req = typeof req & {
    projects: { id: string; title: string; slug: string | null; short_description: string | null }
    profiles: { username: string; display_name: string | null }
  }
  const r = req as unknown as Req

  let sessionStatus: string | null = null
  if (user) {
    const { data: session } = await supabase
      .from('playtest_sessions')
      .select('status')
      .eq('request_id', id)
      .eq('tester_id', user.id)
      .maybeSingle()
    sessionStatus = session?.status ?? null
  }

  const isOwner = user?.id === r.profiles.username // checked by author_id below
  const { data: rawReq2 } = await supabase.from('playtest_requests').select('author_id').eq('id', id).maybeSingle()
  const isAuthor = rawReq2?.author_id === user?.id

  const BuildIcon = BUILD_ICONS[r.build_type as keyof typeof BUILD_ICONS] ?? Monitor

  return (
    <PageShell>
      <PanelHeader
        breadcrumb={[
          { label: 'Playtests', href: '/playtests/browse' },
          { label: r.projects?.title ?? 'Playtest' },
        ]}
      />
      <PanelBody>
        <div className="mb-6">
          <Link href="/playtests/browse" className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors mb-4">
            <ArrowLeft className="h-3 w-3" /> Back to browse
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">{r.projects?.title ?? 'Playtest Request'}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${r.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {r.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            by{' '}
            <Link href={`/dev/${r.profiles.username}`} className="text-indigo-600 hover:underline">
              {r.profiles.display_name ?? r.profiles.username}
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">Build Type</div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
              <BuildIcon className="h-4 w-4 text-indigo-500" />
              {BUILD_LABELS[r.build_type as keyof typeof BUILD_LABELS] ?? r.build_type}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">Testers</div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
              <Users className="h-4 w-4 text-indigo-500" />
              {r.current_testers} / {r.requested_testers}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">Platforms</div>
            <div className="text-sm font-medium text-gray-900">{r.platforms.join(', ') || 'Any'}</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">About this build</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{r.description}</p>
        </div>

        {r.focus_areas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">Focus areas</h2>
            <div className="flex flex-wrap gap-2">
              {r.focus_areas.map((f: string) => <Badge key={f}>{f}</Badge>)}
            </div>
          </div>
        )}

        {r.projects?.slug && (
          <div className="mb-8">
            <Link href={`/p/${r.profiles.username}/${r.projects.slug}`} className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
              View project page <span className="text-xs">→</span>
            </Link>
          </div>
        )}

        {!isAuthor && r.status === 'open' && (
          <RequestSessionButton
            requestId={id}
            currentStatus={sessionStatus}
            isSignedIn={!!user}
          />
        )}

        {isAuthor && (
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
            This is your playtest request. <Link href="/dashboard/playtests" className="underline">Manage it in your dashboard →</Link>
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
