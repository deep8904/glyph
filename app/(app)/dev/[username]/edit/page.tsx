import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from '@/components/app/profile/EditProfileForm'

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()
  if (profile.id !== user.id) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[var(--color-glyph-text)]">Edit Profile</h1>
        <p className="mt-1 font-sans text-sm text-[var(--color-glyph-text-2)]">
          Update your public developer identity on Glyph.
        </p>
      </div>
      <EditProfileForm profile={profile} />
    </div>
  )
}
