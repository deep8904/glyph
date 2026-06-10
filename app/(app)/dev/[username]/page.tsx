import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, MoreHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FollowButton } from '@/components/app/profile/FollowButton'
import { ProfileTabs } from '@/components/app/profile/ProfileTabs'

const AVAILABILITY_LABEL = {
  open:     'Open to Collaborate',
  building: 'Just Building',
  closed:   'Not Available',
}

const AVAILABILITY_COLOR = {
  open:     'text-green-400',
  building: 'text-amber-400',
  closed:   'text-[var(--color-glyph-text-3)]',
}

const EXPERIENCE_LABEL = {
  student:      'Student',
  hobbyist:     'Hobbyist',
  indie:        'Indie Dev',
  professional: 'Professional',
}

export default async function DevProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const isOwner = user?.id === profile.id

  const [{ data: projects }, { count: followerCount }, { count: followingCount }, { data: followRow }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('id, title, slug, stage, cover_url, is_public')
        .eq('developer_id', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id),
      user
        ? supabase
            .from('follows')
            .select('follower_id')
            .eq('follower_id', user.id)
            .eq('following_id', profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

  const isFollowing = !!followRow

  return (
    <div className="space-y-0">
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-[var(--color-glyph-surface-2)]">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,61,0,0.25),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(255,61,0,0.1),transparent_60%)]" />
        )}
        {isOwner && (
          <Link
            href={`/dev/${username}/edit`}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition hover:bg-black/60"
          >
            <Pencil size={11} /> Edit Profile
          </Link>
        )}
      </div>

      {/* Avatar + identity row */}
      <div className="-mt-10 px-1">
        <div className="flex items-end justify-between gap-3">
          <div className="size-20 shrink-0 overflow-hidden rounded-full border-4 border-[var(--color-glyph-black)] bg-[var(--color-glyph-surface-3)] ring-2 ring-[var(--color-glyph-orange)]/50">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-heading text-2xl font-bold text-[var(--color-glyph-text-3)]">
                  {(profile.display_name?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pb-1">
            <FollowButton
              targetUserId={profile.id}
              currentUserId={user?.id ?? null}
              isFollowing={isFollowing}
            />
            <button className="flex size-9 items-center justify-center rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] text-[var(--color-glyph-text-2)] transition hover:bg-[var(--color-glyph-surface-3)]">
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Name + username */}
        <div className="mt-3 space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-glyph-text)]">
            {profile.display_name}
          </h1>
          <p className="font-mono text-sm text-[var(--color-glyph-text-3)]">
            @{profile.username}
            {profile.city && ` · ${profile.city}`}
            {profile.experience && ` · ${EXPERIENCE_LABEL[profile.experience as keyof typeof EXPERIENCE_LABEL]}`}
          </p>

          {/* Engine + Role pills */}
          {((profile.engines?.length ?? 0) > 0 || (profile.roles?.length ?? 0) > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.engines?.slice(0, 3).map((e: string) => (
                <span key={e} className="rounded-md bg-[var(--color-glyph-surface-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-glyph-text-2)]">
                  {e}
                </span>
              ))}
              {profile.roles?.slice(0, 2).map((r: string) => (
                <span key={r} className="rounded-md bg-[var(--color-glyph-orange-lo)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-glyph-orange)]">
                  {r}
                </span>
              ))}
            </div>
          )}

          {/* Availability */}
          <p className={`flex items-center gap-1.5 font-sans text-xs ${AVAILABILITY_COLOR[profile.availability as keyof typeof AVAILABILITY_COLOR]}`}>
            <span className="inline-block size-1.5 rounded-full bg-current" />
            {AVAILABILITY_LABEL[profile.availability as keyof typeof AVAILABILITY_LABEL]}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-[var(--color-glyph-border)] rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface)]">
          {[
            { label: 'Projects',   value: projects?.length ?? 0 },
            { label: 'Followers',  value: followerCount ?? 0 },
            { label: 'Following',  value: followingCount ?? 0 },
          ].map(stat => (
            <div key={stat.label} className="py-3 text-center">
              <p className="font-heading text-lg font-bold text-[var(--color-glyph-text)]">{stat.value}</p>
              <p className="font-mono text-[10px] text-[var(--color-glyph-text-3)]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 font-sans text-sm leading-relaxed text-[var(--color-glyph-text-2)]">
            {profile.bio}
          </p>
        )}

        {/* Tabs */}
        <div className="mt-6">
          <ProfileTabs profile={profile} projects={projects ?? []} />
        </div>
      </div>
    </div>
  )
}
