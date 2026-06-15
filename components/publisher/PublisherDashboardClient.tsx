'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { createShortlist } from '@/app/actions/publisher'
import { Badge } from '@/components/ui/Badge'

type Publisher = { id: string; company_name: string; verified: boolean; plan: string }
type Shortlist = { id: string; name: string; items: string[]; created_at: string }
type Contact = { id: string; message: string; status: string; created_at: string; profiles: { username: string; display_name: string | null } | null }

export function PublisherDashboardClient({
  publisher,
  shortlists,
  contacts,
}: {
  publisher: Publisher
  shortlists: Shortlist[]
  contacts: Contact[]
}) {
  const [isPending, startTransition] = useTransition()
  const [newListName, setNewListName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [localShortlists, setLocalShortlists] = useState(shortlists)

  function handleCreateShortlist() {
    if (!newListName.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createShortlist(newListName.trim())
      if ('error' in result) {
        setError(result.error)
      } else if (result.success && result.id) {
        setLocalShortlists((prev) => [...prev, { id: result.id!, name: newListName.trim(), items: [], created_at: new Date().toISOString() }])
        setNewListName('')
      }
    })
  }

  return (
    <div className="space-y-10">
      {/* Account Overview */}
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-4">{publisher.company_name}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={publisher.verified ? 'success' : 'secondary'}>
            {publisher.verified ? 'Verified' : 'Pending verification'}
          </Badge>
          <Badge variant="muted" className="capitalize">{publisher.plan}</Badge>
        </div>
      </section>

      {/* Browse Games CTA */}
      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">Discover Games</h2>
        <Link
          href="/explore"
          className="inline-flex rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5"
        >
          Browse Projects →
        </Link>
      </section>

      {/* Shortlists */}
      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Shortlists ({localShortlists.length})</h2>
        <div className="space-y-2 mb-4">
          {localShortlists.map((sl) => (
            <div key={sl.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{sl.name}</p>
                <p className="text-[10px] font-mono text-gray-400">{sl.items.length} projects</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateShortlist()}
            maxLength={100}
            placeholder="New shortlist name…"
            className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
          <button
            onClick={handleCreateShortlist}
            disabled={!newListName.trim() || isPending}
            className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </section>

      {/* Contacts */}
      {contacts.length > 0 && (
        <section>
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Sent Messages ({contacts.length})</h2>
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  {c.profiles ? (
                    <Link href={`/dev/${c.profiles.username}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      {c.profiles.display_name ?? c.profiles.username}
                    </Link>
                  ) : <span className="text-sm text-gray-400">Unknown</span>}
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${c.status === 'replied' ? 'text-green-600' : 'text-gray-400'}`}>{c.status}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{c.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
