'use client'

import Link from 'next/link'
import { Folder, Calendar, Handshake, Plus, ArrowUpRight, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/dashboard/AppShell'

const WORKSPACE_CARDS = [
  {
    Icon: Folder,
    title: 'Projects',
    body: 'No projects yet.',
    bullets: ['Post devlogs as you build', 'Public page, searchable from day one'],
    action: 'Create your first project',
    href: '/dashboard/projects/new',
  },
  {
    Icon: Calendar,
    title: 'Events',
    body: 'Nothing on your calendar.',
    bullets: ['Host or RSVP to local meetups', 'Run a game jam with a real deadline'],
    action: 'Host an event',
    href: '/dashboard/events/new',
  },
  {
    Icon: Handshake,
    title: 'Collaborations',
    body: 'No open roles yet.',
    bullets: ['Post a role linked to a real project', 'Full-time, freelance, or revenue-share'],
    action: 'Post a role',
    href: '/collaborate/new',
  },
]

export function DashboardClient({
  displayName,
  email,
  username,
  missing,
}: {
  displayName: string
  email: string
  username: string
  missing: string[]
}) {
  return (
    <AppShell
      displayName={displayName}
      email={email}
      headerLabel="Dashboard"
      headerAction={
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-3.5 py-2.5 sm:px-5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Project</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Page header — a real app header, not a marketing hero */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1.5">
              Welcome back, {displayName.split(' ')[0]}.
            </h1>
            <p className="text-sm text-gray-500">
              Your profile is live. Keep it current and start documenting what you&apos;re building.
            </p>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <Link
              href={`/dev/${username}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              View public profile <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Browse community <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Complete-your-profile prompt — a slim inline banner, not a card */}
        {missing.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <span className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Complete your profile</span> — a fuller profile gets more collaboration requests. Missing:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-indigo-600"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Workspace cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {WORKSPACE_CARDS.map(({ Icon, title, body, bullets, action, href }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col rounded-2xl bg-white border border-gray-100 p-6 transition-all duration-200 hover:border-gray-200 hover:shadow-md hover:shadow-gray-200/50 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-400 mb-4">{body}</p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {bullets.map((b) => (
                  <li key={b} className="text-xs text-gray-500 leading-relaxed">· {b}</li>
                ))}
              </ul>
              <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                {action}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
